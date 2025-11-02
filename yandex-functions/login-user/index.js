const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { verifyPassword, generateJWT, validateEmail } = require('../lib/auth-utils');
const { createResponse } = require('../lib/response-helper');

const client = new DynamoDBClient({
  region: 'ru-central1',
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

module.exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    if (!email || !password) {
      return createResponse(400, { error: 'Email и пароль обязательны' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!validateEmail(trimmedEmail)) {
      return createResponse(400, { error: 'Неверный формат email' });
    }

    const getCommand = new GetCommand({
      TableName: 'users',
      Key: { email: trimmedEmail }
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return createResponse(401, { error: 'Неверный email или пароль' });
    }

    const user = result.Item;

    const isValidPassword = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isValidPassword) {
      return createResponse(401, { error: 'Неверный email или пароль' });
    }

    const token = generateJWT(user.userId, user.email, user.role || 'user');

    return createResponse(200, {
      success: true,
      token,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role || 'user'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return createResponse(500, { error: 'Ошибка при входе' });
  }
};
