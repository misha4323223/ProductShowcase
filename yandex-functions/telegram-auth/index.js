
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
  try {
    console.log('🔐 Starting Telegram signature verification');
    
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      console.log('❌ No hash found in initData');
      return false;
    }
    
    console.log('✅ Hash found:', hash.substring(0, 20) + '...');
    
    // Remove hash from params
    params.delete('hash');
    
    // Sort params alphabetically and build data check string with \n separator
    const dataCheckArray = [];
    for (const [key, value] of params.entries()) {
      dataCheckArray.push(`${key}=${value}`);
    }
    dataCheckArray.sort();
    const dataCheckString = dataCheckArray.join('\n');
    
    console.log('📝 Data check string (first 100 chars):', dataCheckString.substring(0, 100));
    
    // Create secret key: HMAC-SHA256 of "WebAppData" with bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();
    
    console.log('🔑 Secret key generated');
    
    // Calculate hash
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');
    
    console.log('💻 Calculated hash:', calculatedHash);
    console.log('📱 Received hash:  ', hash);
    console.log('✅ Match:', calculatedHash === hash);
    
    return calculatedHash === hash;
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
    return false;
  }
}

function parseTelegramInitData(initData) {
  try {
    const params = new URLSearchParams(initData);
    const userStr = params.get('user');
    
    if (!userStr) {
      console.log('❌ No user data in initData');
      return null;
    }

    const userData = JSON.parse(userStr);
    console.log('✅ User parsed:', userData.id, userData.first_name);
    
    return {
      id: userData.id,
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      username: userData.username || '',
      language_code: userData.language_code || 'ru',
    };
  } catch (error) {
    console.error('❌ Parse error:', error.message);
    return null;
  }
}

exports.handler = async (event) => {
  console.log('🚀 telegram-auth function started');
  
  try {
    const body = JSON.parse(event.body || '{}');
    const { initData, email } = body;

    console.log('📧 Email:', email);
    console.log('📱 InitData length:', initData?.length);

    if (!initData || !email) {
      console.log('❌ Missing params');
      return createResponse(400, { 
        error: "initData и email обязательны",
        code: "MISSING_PARAMS"
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.log('❌ Bot token not configured');
      return createResponse(500, { 
        error: "Telegram bot token not configured",
        code: "CONFIG_ERROR"
      });
    }

    console.log('🔍 Verifying signature...');
    if (!verifyTelegramSignature(initData, botToken)) {
      console.log('❌ Signature verification failed');
      return createResponse(401, { 
        error: "Неверная подпись от Telegram",
        code: "INVALID_SIGNATURE"
      });
    }

    console.log('✅ Signature verified!');

    const telegramUser = parseTelegramInitData(initData);
    if (!telegramUser) {
      console.log('❌ Failed to parse user data');
      return createResponse(400, { 
        error: "Failed to parse Telegram user data",
        code: "INVALID_USER_DATA"
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const telegramId = String(telegramUser.id);

    console.log('🔍 Looking up user:', trimmedEmail);

    const getCommand = new GetCommand({
      TableName: "users",
      Key: { email: trimmedEmail }
    });

    const result = await docClient.send(getCommand);
    if (!result.Item) {
      console.log('❌ User not found');
      return createResponse(404, { 
        error: "Пользователь не найден",
        code: "USER_NOT_FOUND"
      });
    }

    const user = result.Item;

    if (user.telegramId && user.telegramId !== telegramId) {
      console.log('❌ Telegram ID conflict');
      return createResponse(409, { 
        error: "К этому аккаунту уже привязан другой Telegram ID",
        code: "TELEGRAM_ID_CONFLICT"
      });
    }

    console.log('💾 Updating user with Telegram data...');

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

    console.log('✅ Telegram ID linked successfully!');

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
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    return createResponse(500, { 
      error: "Ошибка при привязке Telegram ID",
      code: "INTERNAL_ERROR",
      details: error.message
    });
  }
};
