const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
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
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Проверка подписи Telegram Web App
 * @param {object} initData - данные от Telegram Web App
 * @param {string} botToken - токен бота
 * @returns {boolean} - верна ли подпись
 */
function verifyTelegramSignature(initData, botToken) {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      console.log('❌ No hash in initData');
      return false;
    }

    console.log('📝 Received hash:', hash.substring(0, 20) + '...');
    console.log('🔑 Bot token length:', botToken.length);

    // Удаляем hash из параметров
    params.delete('hash');

    // Сортируем параметры и создаём string
    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    console.log('📄 Data check string:', dataCheckString.substring(0, 100) + '...');

    // Создаём SECRET из BOT_TOKEN (этот шаг был пропущен!)
    const secret = crypto.createHash('sha256').update(botToken).digest();
    
    // Создаём подпись с правильным SECRET
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(dataCheckString);
    const calculatedHash = hmac.digest('hex');

    console.log('🧮 Calculated hash:', calculatedHash.substring(0, 20) + '...');
    const isValid = calculatedHash === hash;
    console.log(`🔐 Signature verification: ${isValid ? '✅' : '❌'}`);
    return isValid;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Парсим initData для получения данных юзера
 */
function parseTelegramInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    
    if (!userStr) {
      console.log('❌ No user data in initData');
      return null;
    }

    const userData = JSON.parse(userStr);
    return {
      id: userData.id,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      username: userData.username || '',
      language_code: userData.language_code || 'ru',
    };
  } catch (error) {
    console.error('Error parsing initData:', error);
    return null;
  }
}

exports.handler = async (event) => {
  try {
    // Получаем тело запроса
    const body = JSON.parse(event.body || '{}');
    const { initData, email } = body;

    if (!initData || !email) {
      return createResponse(400, { 
        error: "initData и email обязательны",
        code: "MISSING_PARAMS"
      });
    }

    // Проверяем подпись от Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('❌ TELEGRAM_BOT_TOKEN not configured');
      return createResponse(500, { 
        error: "Telegram bot token not configured",
        code: "CONFIG_ERROR"
      });
    }

    // Проверяем подпись
    if (!verifyTelegramSignature(initData, botToken)) {
      return createResponse(401, { 
        error: "Неверная подпись от Telegram",
        code: "INVALID_SIGNATURE"
      });
    }

    // Парсим данные юзера из Telegram
    const telegramUser = parseTelegramInitData(initData);
    if (!telegramUser) {
      return createResponse(400, { 
        error: "Failed to parse Telegram user data",
        code: "INVALID_USER_DATA"
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const telegramId = String(telegramUser.id);

    // Проверяем что пользователь существует
    const getCommand = new GetCommand({
      TableName: "users",
      Key: { email: trimmedEmail }
    });

    const result = await docClient.send(getCommand);
    if (!result.Item) {
      return createResponse(404, { 
        error: "Пользователь не найден",
        code: "USER_NOT_FOUND"
      });
    }

    const user = result.Item;

    // Если уже привязан другой Telegram ID, ошибка
    if (user.telegramId && user.telegramId !== telegramId) {
      return createResponse(409, { 
        error: "К этому аккаунту уже привязан другой Telegram ID",
        code: "TELEGRAM_ID_CONFLICT"
      });
    }

    // Обновляем профиль пользователя с Telegram ID и данными
    const updateCommand = new UpdateCommand({
      TableName: "users",
      Key: { email: trimmedEmail },
      UpdateExpression: `SET 
        telegramId = :telegramId,
        telegramFirstName = :telegramFirstName,
        telegramLastName = :telegramLastName,
        telegramUsername = :telegramUsername,
        telegramLinkedAt = :telegramLinkedAt
      `,
      ExpressionAttributeValues: {
        ':telegramId': telegramId,
        ':telegramFirstName': telegramUser.first_name || '',
        ':telegramLastName': telegramUser.last_name || '',
        ':telegramUsername': telegramUser.username || '',
        ':telegramLinkedAt': new Date().toISOString(),
      },
      ReturnValues: "ALL_NEW"
    });

    const updateResult = await docClient.send(updateCommand);
    const updatedUser = updateResult.Attributes;

    console.log(`✅ Telegram ID linked for: ${trimmedEmail}, telegramId: ${telegramId}`);

    return createResponse(200, {
      success: true,
      message: "Telegram ID успешно привязан",
      user: {
        email: updatedUser.email,
        userId: updatedUser.userId,
        telegramId: updatedUser.telegramId,
        telegramUsername: updatedUser.telegramUsername,
      }
    });

  } catch (error) {
    console.error("Error in telegram-auth:", error);
    return createResponse(500, { 
      error: "Ошибка при привязке Telegram ID",
      details: error.message,
      code: "INTERNAL_ERROR"
    });
  }
};
