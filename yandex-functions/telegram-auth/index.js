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
  let checkValue = '';
  let dataCheckString = '';

  // Parse the initData string
  const params = new URLSearchParams(initData);
  
  // Get signature/hash
  checkValue = params.get('signature') || params.get('hash');
  if (!checkValue) {
    return false;
  }

  console.log('Received signature:', checkValue.substring(0, 40));

  // Build data check string with newlines (Telegram format)
  const entries = [];
  params.forEach((value, key) => {
    if (key !== 'signature' && key !== 'hash') {
      entries.push([key, value]);
    }
  });

  entries.sort(([a], [b]) => a.localeCompare(b));
  dataCheckString = entries.map(([key, value]) => `${key}=${value}`).join('\n');

  console.log('Data string length:', dataCheckString.length);
  console.log('Data string (first 100):', dataCheckString.substring(0, 100));

  // Convert signature from base64 to hex if needed
  let receivedHex = checkValue;
  if (!checkValue.match(/^[0-9a-f]*$/i)) {
    try {
      receivedHex = Buffer.from(checkValue, 'base64').toString('hex');
      console.log('Converted base64 to hex');
    } catch (e) {
      console.log('Not base64, treating as hex');
    }
  }

  // Method 1: SHA256(token) as HMAC key
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataCheckString);
  const computed1 = hmac.digest('hex');

  console.log('Method 1 result:', computed1.substring(0, 40));

  if (computed1 === receivedHex) {
    console.log('✅ PASSED');
    return true;
  }

  // Method 2: Token directly as HMAC key
  const hmac2 = crypto.createHmac('sha256', botToken);
  hmac2.update(dataCheckString);
  const computed2 = hmac2.digest('hex');

  console.log('Method 2 result:', computed2.substring(0, 40));

  if (computed2 === receivedHex) {
    console.log('✅ PASSED');
    return true;
  }

  // Method 3: Try with & separator instead of \n
  const dataCheckStringAmp = entries.map(([key, value]) => `${key}=${value}`).join('&');
  console.log('Data string with & (first 100):', dataCheckStringAmp.substring(0, 100));

  const hmac3 = crypto.createHmac('sha256', secret);
  hmac3.update(dataCheckStringAmp);
  const computed3 = hmac3.digest('hex');

  console.log('Method 3 (& + SHA256 key):', computed3.substring(0, 40));

  if (computed3 === receivedHex) {
    console.log('✅ PASSED');
    return true;
  }

  const hmac4 = crypto.createHmac('sha256', botToken);
  hmac4.update(dataCheckStringAmp);
  const computed4 = hmac4.digest('hex');

  console.log('Method 4 (& + direct key):', computed4.substring(0, 40));

  if (computed4 === receivedHex) {
    console.log('✅ PASSED');
    return true;
  }

  console.log('❌ ALL METHODS FAILED');
  console.log('Expected:', receivedHex.substring(0, 40));
  
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
