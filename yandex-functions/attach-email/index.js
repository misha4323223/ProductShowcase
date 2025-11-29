const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
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
    const signature = crypto.createHmac('sha256', secret).update(`${headerB64}.${payloadB64}`).digest('base64');

    if (signature !== signatureB64) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

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
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payloadStr}`).digest('base64');
  
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

    // Check if email already exists
    const scanCommand = new ScanCommand({
      TableName: "users",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": trimmedEmail },
    });

    let result = await docClient.send(scanCommand);
    if (result.Items && result.Items.length > 0) {
      const existingUser = result.Items[0];
      if (existingUser.userId !== tokenPayload.userId) {
        return createResponse(400, { error: 'Email already in use by another account' });
      }
    }

    // Update user profile with email and password hash
    const passwordHash = hashPassword(password);
    
    const updateCommand = new UpdateCommand({
      TableName: "users",
      Key: { email: tokenPayload.email }, // Use original email from token as key
      UpdateExpression: "SET #email = :newEmail, #passwordHash = :passwordHash, #emailVerified = :emailVerified, #emailAttachedAt = :emailAttachedAt",
      ExpressionAttributeNames: {
        '#email': 'email',
        '#passwordHash': 'passwordHash',
        '#emailVerified': 'emailVerified',
        '#emailAttachedAt': 'emailAttachedAt',
      },
      ExpressionAttributeValues: {
        ':newEmail': trimmedEmail,
        ':passwordHash': passwordHash,
        ':emailVerified': true,
        ':emailAttachedAt': new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW",
    });

    const updateResult = await docClient.send(updateCommand);
    const updatedUser = updateResult.Attributes;

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
