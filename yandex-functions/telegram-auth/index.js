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

function verifyTelegramSignature(initData, botToken) {
  const params = new URLSearchParams(initData);
  const allParams = Object.fromEntries(params.entries());
  
  console.log('📋 All params:', JSON.stringify(allParams, null, 2).substring(0, 500));
  
  let checkValue = params.get('hash') || params.get('signature');
  
  if (!checkValue) {
    console.log('❌ No hash or signature found');
    return false;
  }

  console.log('🔐 Check value (first 40 chars):', checkValue.substring(0, 40));

  params.delete('hash');
  params.delete('signature');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  console.log('📝 Data check string (first 200):', dataCheckString.substring(0, 200));
  console.log('🔑 Bot token (first 10):', botToken.substring(0, 10) + '...');

  // Method 1: SHA256(token) as key
  const secret1 = crypto.createHash('sha256').update(botToken).digest();
  const hmac1 = crypto.createHmac('sha256', secret1);
  hmac1.update(dataCheckString);
  const hash1 = hmac1.digest('hex');

  console.log('Method 1 result:', hash1.substring(0, 40));

  if (hash1 === checkValue) {
    console.log('✅ PASSED Method 1');
    return true;
  }

  // Method 2: Direct token as key  
  const hmac2 = crypto.createHmac('sha256', botToken);
  hmac2.update(dataCheckString);
  const hash2 = hmac2.digest('hex');

  console.log('Method 2 result:', hash2.substring(0, 40));

  if (hash2 === checkValue) {
    console.log('✅ PASSED Method 2');
    return true;
  }

  // Method 3: Maybe it's base64?
  try {
    const hash1Base64 = Buffer.from(hash1, 'hex').toString('base64');
    const hash2Base64 = Buffer.from(hash2, 'hex').toString('base64');
    
    console.log('Method 1 (base64):', hash1Base64.substring(0, 40));
    console.log('Method 2 (base64):', hash2Base64.substring(0, 40));
    
    if (hash1Base64 === checkValue || hash2Base64 === checkValue) {
      console.log('✅ PASSED Method 3 (base64)');
      return true;
    }
  } catch(e) {}

  console.log('❌ ALL METHODS FAILED');
  return false;
}

function parseTelegramInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    
    if (!userStr) return null;

    const userData = JSON.parse(userStr);
    return {
      id: userData.id,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      username: userData.username || '',
      language_code: userData.language_code || 'ru',
    };
  } catch (error) {
    return null;
  }
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { initData, email } = body;

    console.log('Request data:', { hasInitData: !!initData, email: email?.substring(0, 6) + '***' });

    if (!initData || !email) {
      return createResponse(400, { 
        error: "initData и email обязательны",
        code: "MISSING_PARAMS"
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return createResponse(500, { 
        error: "Telegram bot token not configured",
        code: "CONFIG_ERROR"
      });
    }

    if (!verifyTelegramSignature(initData, botToken)) {
      console.log('Invalid Telegram signature');
      return createResponse(401, { 
        error: "Неверная подпись от Telegram",
        code: "INVALID_SIGNATURE"
      });
    }

    const telegramUser = parseTelegramInitData(initData);
    if (!telegramUser) {
      return createResponse(400, { 
        error: "Failed to parse Telegram user data",
        code: "INVALID_USER_DATA"
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const telegramId = String(telegramUser.id);

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

    if (user.telegramId && user.telegramId !== telegramId) {
      return createResponse(409, { 
        error: "К этому аккаунту уже привязан другой Telegram ID",
        code: "TELEGRAM_ID_CONFLICT"
      });
    }

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

    console.log(`✅ Telegram ID linked`);

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
    console.error("Error:", error.message);
    return createResponse(500, { 
      error: "Ошибка при привязке Telegram ID",
      code: "INTERNAL_ERROR"
    });
  }
};
