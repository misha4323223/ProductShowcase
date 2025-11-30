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
    console.error('Ошибка верификации токена:', error);
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
    console.log('📥 detach-email handler вызван');
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

    // Проверяем, есть ли привязанный Telegram
    if (!userRecord.telegramId) {
      return createResponse(400, { error: 'Email не привязан к аккаунту' });
    }

    // Удаляем старую запись и создаём новую с Telegram email
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
      message: 'Email успешно отвязан от аккаунта',
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
