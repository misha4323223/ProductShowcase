const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");
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

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event) => {
  try {
    const { token } = JSON.parse(event.body || '{}');
    
    if (!token) {
      return createResponse(400, { error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'telegram-secret-key';
    const payload = verifyToken(token, secret);

    if (!payload) {
      return createResponse(401, { valid: false, error: 'Invalid or expired token' });
    }

    // Получаем полный профиль пользователя из БД
    const getCommand = new GetCommand({
      TableName: "users",
      Key: { email: payload.email },
    });

    const result = await docClient.send(getCommand);
    
    if (!result.Item) {
      console.log('User not found in DB:', payload.email);
      return createResponse(401, { valid: false, error: 'User not found' });
    }

    const userFromDb = result.Item;
    console.log('✅ User found in DB:', userFromDb.email);

    return createResponse(200, {
      valid: true,
      user: {
        userId: userFromDb.userId,
        email: userFromDb.email,
        role: userFromDb.role || 'user',
        telegramId: userFromDb.telegramId,
        telegramUsername: userFromDb.telegramUsername,
        telegramFirstName: userFromDb.telegramFirstName,
        emailVerified: userFromDb.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
