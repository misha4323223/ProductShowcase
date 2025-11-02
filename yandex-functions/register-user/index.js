const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { hashPassword, generateJWT, validateEmail, validatePassword } = require('../lib/auth-utils');
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

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return createResponse(400, { error: passwordValidation.error });
    }

    const getCommand = new GetCommand({
      TableName: 'users',
      Key: { email: trimmedEmail }
    });

    const existingUser = await docClient.send(getCommand);
    if (existingUser.Item) {
      return createResponse(400, { error: 'Пользователь с таким email уже существует' });
    }

    const { salt, hash } = hashPassword(password);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const putCommand = new PutCommand({
      TableName: 'users',
      Item: {
        email: trimmedEmail,
        userId,
        passwordSalt: salt,
        passwordHash: hash,
        role: 'user',
        createdAt: new Date().toISOString(),
      }
    });

    await docClient.send(putCommand);

    const token = generateJWT(userId, trimmedEmail, 'user');

    return createResponse(200, {
      success: true,
      token,
      user: {
        userId,
        email: trimmedEmail,
        role: 'user'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return createResponse(500, { error: 'Ошибка при регистрации' });
  }
};
