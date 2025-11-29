const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

function verifyTelegramSignature(rawInitData, botToken) {
  const params = new URLSearchParams(rawInitData);
  const checkValue = params.get('hash') || params.get('signature');
  
  if (!checkValue) return false;

  params.delete('hash');
  params.delete('signature');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  let expectedHex = checkValue;
  if (checkValue.length > 40 && !checkValue.match(/^[0-9a-f]*$/i)) {
    try {
      expectedHex = Buffer.from(checkValue, 'base64').toString('hex');
    } catch (e) {}
  }

  const secret = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(dataCheckString);
  const computed = hmac.digest('hex');

  if (computed === expectedHex) return true;

  const hmac2 = crypto.createHmac('sha256', botToken);
  hmac2.update(dataCheckString);
  const computed2 = hmac2.digest('hex');

  if (computed2 === expectedHex) return true;

  if (process.env.SKIP_TELEGRAM_VERIFICATION === 'true') return true;

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

function generateToken(userId, email) {
  const payload = {
    userId,
    email,
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
    console.log('🔐 telegram-login handler called');
    const body = JSON.parse(event.body || '{}');
    const { initData } = body;
    console.log('📥 Received initData:', initData ? initData.substring(0, 100) : 'null');

    if (!initData) {
      console.log('❌ Missing initData');
      return createResponse(400, { error: "initData required", code: "MISSING_DATA" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.log('❌ Bot token not configured');
      return createResponse(500, { error: "Bot token not configured", code: "CONFIG_ERROR" });
    }

    console.log('🔍 Verifying Telegram signature');
    if (!verifyTelegramSignature(initData, botToken)) {
      console.log('⚠️ Invalid signature, but SKIP_TELEGRAM_VERIFICATION may be enabled');
      if (process.env.SKIP_TELEGRAM_VERIFICATION !== 'true') {
        return createResponse(401, { error: "Invalid Telegram signature", code: "INVALID_SIGNATURE" });
      }
      console.log('✅ Skipping signature verification (SKIP_TELEGRAM_VERIFICATION=true)');
    }

    const telegramUser = parseTelegramInitData(initData);
    console.log('👤 Parsed Telegram user:', telegramUser);
    if (!telegramUser) {
      console.log('❌ Failed to parse Telegram data');
      return createResponse(400, { error: "Invalid Telegram data", code: "INVALID_USER_DATA" });
    }

    const telegramId = String(telegramUser.id);
    console.log('🔍 Looking up existing user with telegramId:', telegramId);

    const queryCommand = new QueryCommand({
      TableName: "users",
      IndexName: "telegramId-index",
      KeyConditionExpression: "telegramId = :telegramId",
      ExpressionAttributeValues: { ":telegramId": telegramId },
    });

    let result = await docClient.send(queryCommand);
    console.log('📊 Query result items count:', result.Items?.length || 0);
    
    if (result.Items && result.Items.length > 0) {
      const user = result.Items[0];
      console.log('✅ Found existing user:', user.email);
      const token = generateToken(user.userId, user.email);

      return createResponse(200, {
        success: true,
        message: "Logged in successfully",
        token,
        user: {
          userId: user.userId,
          email: user.email,
          telegramId: user.telegramId,
          telegramUsername: user.telegramUsername,
        },
      });
    }

    console.log('🆕 Creating new user account');
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const email = `telegram_${telegramId}@telegram`;

    const putCommand = new PutCommand({
      TableName: "users",
      Item: {
        email,
        userId,
        telegramId,
        telegramFirstName: telegramUser.first_name,
        telegramLastName: telegramUser.last_name,
        telegramUsername: telegramUser.username,
        telegramLinkedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        role: "user",
        emailVerified: true,
      },
    });

    await docClient.send(putCommand);
    console.log('✅ User created:', userId);
    const token = generateToken(userId, email);

    return createResponse(200, {
      success: true,
      message: "Account created and logged in successfully",
      token,
      user: {
        userId,
        email,
        telegramId,
        telegramUsername: telegramUser.username,
      },
    });

  } catch (error) {
    console.error("❌ Error in telegram-login:", error.message, error.stack);
    return createResponse(500, { error: "Internal server error", code: "INTERNAL_ERROR" });
  }
};
