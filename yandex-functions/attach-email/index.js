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

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
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
    console.log('📥 attach-email handler called');
    const { token, email, password, passwordConfirm } = JSON.parse(event.body || '{}');

    if (!token) {
      return createResponse(401, { error: 'No token provided' });
    }

    if (!email || !password || !passwordConfirm) {
      return createResponse(400, { error: 'Email, password and password confirmation required' });
    }

    if (password !== passwordConfirm) {
      return createResponse(400, { error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return createResponse(400, { error: 'Password must be at least 6 characters' });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'telegram-secret-key';
    const tokenPayload = verifyToken(token, secret);
    
    if (!tokenPayload) {
      return createResponse(401, { error: 'Invalid or expired token' });
    }

    console.log('✅ Token verified for userId:', tokenPayload.userId);

    const trimmedEmail = email.trim().toLowerCase();
    console.log('📧 Attempting to attach email:', trimmedEmail);

    // Check if email already exists
    const scanCommand = new ScanCommand({
      TableName: "users",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": trimmedEmail },
    });

    let result = await docClient.send(scanCommand);
    console.log('🔍 Found', result.Items?.length || 0, 'records with email:', trimmedEmail);
    
    if (result.Items && result.Items.length > 0) {
      const existingUser = result.Items[0];
      console.log('👤 Existing user userId:', existingUser.userId, 'Current user:', tokenPayload.userId);
      console.log('🔐 Existing user has password hash:', !!existingUser.passwordHash);
      
      if (existingUser.userId !== tokenPayload.userId) {
        // If the other user doesn't have a password hash (Telegram-only account), remove their record
        if (!existingUser.passwordHash) {
          console.log('🗑️ Removing orphaned Telegram-only account');
          await docClient.send(new DeleteCommand({
            TableName: "users",
            Key: { email: trimmedEmail },
          }));
        } else {
          // Real account with password exists - this is a real conflict
          console.log('❌ Email conflict with another user who has password');
          return createResponse(400, { error: 'Email already in use by another account' });
        }
      } else {
        // Same user - just continue and let delete/recreate handle it
        console.log('✅ Email belongs to same user, continuing...');
      }
    }

    // For DynamoDB, if email is the primary key, we need to delete old and create new
    // First, get the full user record to preserve all fields
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
    const passwordHash = hashPassword(password);

    // Delete old record and create new one with updated email
    await docClient.send(new DeleteCommand({
      TableName: "users",
      Key: { email: tokenPayload.email },
    }));

    console.log('🗑️ Old email record deleted');

    // Create new record with updated email
    const updatedUser = {
      ...userRecord,
      email: trimmedEmail,
      passwordHash,
      emailVerified: true,
      emailAttachedAt: new Date().toISOString(),
    };

    await docClient.send(new PutCommand({
      TableName: "users",
      Item: updatedUser,
    }));

    console.log('✅ New email record created');

    console.log('✅ Email attached to account:', trimmedEmail);

    // Generate new token with updated user data
    const newToken = generateToken(updatedUser.userId, updatedUser.email, {
      telegramId: updatedUser.telegramId,
      telegramUsername: updatedUser.telegramUsername,
      telegramFirstName: updatedUser.telegramFirstName,
      emailVerified: true,
    });

    return createResponse(200, {
      success: true,
      message: 'Email successfully attached to your account',
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
