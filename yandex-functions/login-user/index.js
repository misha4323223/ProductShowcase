const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

// ========== ВСТРОЕННЫЕ УТИЛИТЫ ==========

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

function verifyPassword(password, salt, hash) {
  const hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
}

function generateJWT(userId, email, role = 'user', extraData = {}) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const payload = {
    userId,
    email,
    role,
    ...extraData,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60)
  };
  
  const base64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', process.env.JWT_SECRET || 'default-secret-key')
    .update(`${base64Header}.${base64Payload}`)
    .digest('base64url');
  
  return `${base64Header}.${base64Payload}.${signature}`;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

// ========== DATABASE ==========

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

    // Проверить, верифицирован ли email
    if (!user.emailVerified) {
      return createResponse(401, { error: 'Пожалуйста, подтвердите вашу почту перед входом' });
    }

    const isValidPassword = verifyPassword(password, user.passwordSalt, user.passwordHash);
    if (!isValidPassword) {
      return createResponse(401, { error: 'Неверный email или пароль' });
    }

    const token = generateJWT(user.userId, user.email, user.role || 'user', {
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      telegramFirstName: user.telegramFirstName,
      emailVerified: user.emailVerified,
    });

    return createResponse(200, {
      success: true,
      token,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role || 'user',
        telegramId: user.telegramId,
        telegramUsername: user.telegramUsername,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return createResponse(500, { error: 'Ошибка при входе' });
  }
};
