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
  
  let checkValue = params.get('signature') || params.get('hash');
  if (!checkValue) {
    console.log('No signature found');
    return false;
  }

  // Remove signature and hash before building data string
  params.delete('hash');
  params.delete('signature');

  // Build the data check string - sort alphabetically
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  console.log('=== VERIFICATION DEBUG ===');
  console.log('Received signature (base64):', checkValue.substring(0, 50));
  
  // Convert base64 signature to hex for comparison
  let receivedHex;
  try {
    receivedHex = Buffer.from(checkValue, 'base64').toString('hex');
    console.log('Received signature (hex):', receivedHex.substring(0, 50));
  } catch (e) {
    console.log('Failed to decode base64:', e.message);
    receivedHex = checkValue;
  }

  console.log('Data string length:', dataCheckString.length);
  console.log('Bot token length:', botToken.length);

  // Method 1: HMAC-SHA256 with SHA256(token) as key
  const secret1 = crypto.createHash('sha256').update(botToken).digest();
  const computed1 = crypto.createHmac('sha256', secret1).update(dataCheckString).digest('hex');
  console.log('Method 1 result:', computed1.substring(0, 50));
  
  if (computed1 === receivedHex) {
    console.log('✅ VERIFICATION PASSED (Method 1: SHA256 key)');
    return true;
  }

  // Method 2: HMAC-SHA256 with token directly as key
  const computed2 = crypto.createHmac('sha256', botToken).update(dataCheckString).digest('hex');
  console.log('Method 2 result:', computed2.substring(0, 50));
  
  if (computed2 === receivedHex) {
    console.log('✅ VERIFICATION PASSED (Method 2: Direct token)');
    return true;
  }

  // Method 3: Maybe it's not base64, try hex directly
  if (computed1 === checkValue) {
    console.log('✅ VERIFICATION PASSED (Method 3: Hex match)');
    return true;
  }

  if (computed2 === checkValue) {
    console.log('✅ VERIFICATION PASSED (Method 4: Direct token hex)');
    return true;
  }

  console.log('❌ ALL METHODS FAILED');
  console.log('Expected (first 50):', (receivedHex || checkValue).substring(0, 50));
  console.log('Method 1 got:', computed1.substring(0, 50));
  console.log('Method 2 got:', computed2.substring(0, 50));
  
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

    console.log(`✅ Telegram ID linked successfully`);

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
