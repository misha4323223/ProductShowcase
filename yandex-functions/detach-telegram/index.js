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

function normalizeBase64(b64) {
  let normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  normalized = normalized.replace(/=/g, '');
  return normalized;
}

function verifyToken(token, secret) {
  try {
    console.log('🔍 verifyToken: START');
    const parts = token.split('.');
    console.log('📊 Токен имеет', parts.length, 'части');
    
    if (parts.length !== 3) {
      console.log('❌ Ожидается 3 части');
      return null;
    }

    const [headerB64, payloadB64, signatureB64] = parts;
    console.log('🔐 Вычисляю подпись с HMAC-SHA256');
    
    const dataToSign = `${headerB64}.${payloadB64}`;
    const signature = crypto.createHmac('sha256', secret).update(dataToSign).digest('base64');

    const normalizedReceived = normalizeBase64(signatureB64);
    const normalizedComputed = normalizeBase64(signature);

    console.log('📊 Полное совпадение:', normalizedComputed === normalizedReceived ? '✅ ДА' : '❌ НЕТ');
    
    if (normalizedComputed !== normalizedReceived) {
      console.log('❌ НЕСОВПАДЕНИЕ!');
      return null;
    }

    console.log('✅ Подпись верна');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('❌ Токен истек');
      return null;
    }

    console.log('✅ Токен верен, userId:', payload.userId);
    return payload;
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
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
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${payloadStr}`).digest('base64');
  
  return `${header}.${payloadStr}.${signature}`;
}

exports.handler = async (event) => {
  try {
    console.log('📥 detach-telegram handler вызван');
    const { token } = JSON.parse(event.body || '{}');

    if (!token) {
      return createResponse(401, { error: 'Требуется токен' });
    }

    // Проверяем токен
    const secret = process.env.JWT_SECRET || 'telegram-secret-key';
    const tokenPayload = verifyToken(token, secret);
    
    if (!tokenPayload) {
      return createResponse(401, { error: 'Неверный или истекший токен' });
    }

    console.log('✅ Токен верифицирован для userId:', tokenPayload.userId);

    // Получаем пользователя по email
    const getUserCommand = new ScanCommand({
      TableName: "users",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": tokenPayload.email },
    });

    const getUserResult = await docClient.send(getUserCommand);
    if (!getUserResult.Items || getUserResult.Items.length === 0) {
      return createResponse(401, { error: 'Пользователь не найден' });
    }

    const userRecord = getUserResult.Items[0];

    // Проверяем, есть ли привязанный email
    if (!userRecord.passwordHash || userRecord.email.includes('@telegram')) {
      return createResponse(400, { error: 'Email не привязан к аккаунту' });
    }

    // Удаляем старую запись
    await docClient.send(new DeleteCommand({
      TableName: "users",
      Key: { email: tokenPayload.email },
    }));

    console.log('🗑️ Старая запись удалена');

    // Создаём новую запись с Telegram email
    const telegramEmail = `${userRecord.telegramId}@telegram`;
    const updatedUser = {
      ...userRecord,
      email: telegramEmail,
      passwordHash: undefined,
      emailVerified: false,
      emailAttachedAt: undefined,
    };

    await docClient.send(new PutCommand({
      TableName: "users",
      Item: updatedUser,
    }));

    console.log('✅ Новая запись создана с Telegram email');

    // Генерируем новый токен
    const newToken = generateToken(updatedUser.userId, updatedUser.email, {
      telegramId: updatedUser.telegramId,
      telegramUsername: updatedUser.telegramUsername,
      emailVerified: false,
    });

    return createResponse(200, {
      success: true,
      message: 'Telegram успешно отвязан от аккаунта',
      token: newToken,
      user: {
        userId: updatedUser.userId,
        email: updatedUser.email,
        telegramId: updatedUser.telegramId,
        telegramUsername: updatedUser.telegramUsername,
      },
    });

  } catch (error) {
    console.error("❌ Ошибка:", error.message, error.stack);
    return createResponse(500, { error: "Внутренняя ошибка сервера" });
  }
};
