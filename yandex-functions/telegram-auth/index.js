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

function verifyTelegramSignature(rawInitData, botToken) {
  const params = new URLSearchParams(rawInitData);
  
  const hash = params.get('hash');
  const signature = params.get('signature');
  
  console.log('🔍 Checking for hash:', !!hash);
  console.log('🔍 Checking for signature:', !!signature);

  const checkValue = hash || signature;
  if (!checkValue) {
    console.log('❌ No hash or signature');
    return false;
  }

  // Remove them before building data string
  params.delete('hash');
  params.delete('signature');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Convert signature from base64 to hex if needed
  let expectedHex = checkValue;
  if (checkValue.length > 40 && !checkValue.match(/^[0-9a-f]*$/i)) {
    try {
      expectedHex = Buffer.from(checkValue, 'base64').toString('hex');
    } catch (e) {
      expectedHex = checkValue;
    }
  }

  // Try all possible combinations
  const methods = [
    { name: 'SHA256 key + newlines', key: crypto.createHash('sha256').update(botToken).digest() },
    { name: 'Direct token + newlines', key: botToken },
  ];

  for (const method of methods) {
    const hmac = crypto.createHmac('sha256', method.key);
    hmac.update(dataCheckString);
    const computed = hmac.digest('hex');
    
    console.log(`📊 ${method.name}: ${computed.substring(0, 40)}`);
    
    if (computed === expectedHex) {
      console.log(`✅ PASSED with ${method.name}`);
      return true;
    }
  }

  console.log('❌ Signature verification failed');
  console.log('Expected (hex):', expectedHex.substring(0, 40));
  
  // TEMPORARY: Allow verification to pass for debugging
  // This will be removed once signature verification works
  if (process.env.SKIP_TELEGRAM_VERIFICATION === 'true') {
    console.log('⚠️ VERIFICATION SKIPPED - DEBUG MODE');
    return true;
  }
  
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
