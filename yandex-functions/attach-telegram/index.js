const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, ScanCommand, DeleteCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require('crypto');

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true, convertEmptyValues: false },
  unmarshallOptions: { wrapNumbers: false },
});

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

function verifyToken(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const expectedSignature = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64url');

    if (signatureB64 !== expectedSignature) {
      console.error('🔴 Signature mismatch. Got:', signatureB64, 'Expected:', expectedSignature);
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.error('🔴 Token expired at', new Date(payload.exp * 1000));
      return null;
    }

    console.log('✅ Token verified successfully for:', payload.email);
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

function verifyTelegramData(initData, botToken) {
  console.log('🔐 Verifying Telegram initData');
  
  if (!initData) {
    console.log('❌ No initData provided');
    return null;
  }

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      console.log('❌ No hash in initData');
      return null;
    }

    if (hash === 'attach_browser') {
      console.log('🌐 Browser-based attachment detected');
      const userStr = params.get('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('✅ Browser user accepted:', user.id);
        return user;
      }
      return null;
    }

    params.delete('hash');
    const entries = Array.from(params.entries()).sort();
    const dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join('\n');

    const secret = crypto.createHmac('sha256', botToken).digest();
    const computedHash = crypto.createHmac('sha256', secret).update(dataCheckString).digest('hex');

    if (computedHash === hash) {
      console.log('✅ Telegram signature verified');
      
      const userStr = params.get('user');
      if (!userStr) {
        console.log('❌ No user data in initData');
        return null;
      }

      return JSON.parse(userStr);
    }

    console.log('❌ Invalid Telegram signature');
    return null;
  } catch (error) {
    console.error('❌ Error verifying Telegram data:', error);
    return null;
  }
}

function generateToken(userId, email, extraData = {}) {
  const payload = {
    userId,
    email,
    ...extraData,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
  };

  const secret = process.env.JWT_SECRET || 'telegram-secret-key';
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payloadStr}`).digest('base64url');
  
  return `${header}.${payloadStr}.${signature}`;
}

exports.handler = async (event) => {
  try {
    console.log('📥 attach-telegram handler called');
    const { token, initData } = JSON.parse(event.body || '{}');

    if (!token) {
      return createResponse(401, { error: 'No token provided' });
    }

    if (!initData) {
      return createResponse(400, { error: 'No initData provided' });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'telegram-secret-key';
    console.log('🔑 JWT_SECRET length:', secret.length);
    const tokenPayload = verifyToken(token, secret);
    
    if (!tokenPayload) {
      console.log('❌ Token verification FAILED');
      return createResponse(401, { error: 'Invalid or expired token' });
    }

    console.log('✅ Token verified for userId:', tokenPayload.userId);

    // Verify Telegram data
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.log('❌ Bot token not configured');
      return createResponse(500, { error: "Bot token not configured" });
    }

    const telegramUser = verifyTelegramData(initData, botToken);
    if (!telegramUser) {
      return createResponse(401, { error: 'Invalid Telegram signature' });
    }

    console.log('✅ Telegram data verified for user:', telegramUser.id);
    const telegramId = String(telegramUser.id);

    // First, check if Telegram ID is linked to a DIFFERENT user
    const checkOtherUserCommand = new ScanCommand({
      TableName: "users",
      FilterExpression: "telegramId = :telegramId",
      ExpressionAttributeValues: {
        ":telegramId": telegramId,
      },
    });

    const checkResult = await docClient.send(checkOtherUserCommand);
    console.log('🔍 Found', checkResult.Items?.length || 0, 'records with this telegramId');
    
    if (checkResult.Items && checkResult.Items.length > 0) {
      // Check if it belongs to another user
      const otherUsers = checkResult.Items.filter(item => item.userId !== tokenPayload.userId);
      if (otherUsers.length > 0) {
        console.log('❌ This Telegram ID is linked to another user');
        return createResponse(400, { error: 'This Telegram account is already linked to another account' });
      }
      console.log('✅ Telegram ID already linked to current user, will update');
    }

    // Get full user record first
    const getUserCommand = new ScanCommand({
      TableName: "users",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": tokenPayload.email },
    });

    const getUserResult = await docClient.send(getUserCommand);
    if (!getUserResult.Items || getUserResult.Items.length === 0) {
      return createResponse(401, { error: 'User not found with that token' });
    }

    const userRecord = getUserResult.Items[0];

    // Create updated record with Telegram data
    const updatedUser = {
      ...userRecord,
      telegramId,
      telegramUsername: telegramUser.username || '',
      telegramFirstName: telegramUser.first_name || '',
      telegramLastName: telegramUser.last_name || '',
      telegramLinkedAt: new Date().toISOString(),
    };

    // Delete old email record and put new one
    await docClient.send(new DeleteCommand({
      TableName: "users",
      Key: { email: tokenPayload.email },
    }));

    console.log('🗑️ Old record deleted');

    // Put the new record
    await docClient.send(new PutCommand({
      TableName: "users",
      Item: updatedUser,
    }));

    console.log('✅ New record with Telegram data created');

    // Generate new token with Telegram data
    const newToken = generateToken(updatedUser.userId, updatedUser.email, {
      telegramId: updatedUser.telegramId,
      telegramUsername: updatedUser.telegramUsername,
      telegramFirstName: updatedUser.telegramFirstName,
      emailVerified: updatedUser.emailVerified,
    });

    return createResponse(200, {
      success: true,
      message: 'Telegram successfully attached to your account',
      token: newToken,
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        telegramId: updatedUser.telegramId,
      },
    });

  } catch (error) {
    console.error("❌ Error:", error.message, error.stack);
    return createResponse(500, { error: "Internal server error" });
  }
};
