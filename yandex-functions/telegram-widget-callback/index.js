const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, QueryCommand } = require("@aws-sdk/lib-dynamodb");
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
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

function verifyTelegramWidget(data, botToken) {
  console.log('🔐 Verifying Telegram widget data');
  const checkFields = ['id', 'first_name', 'auth_date', 'hash'];
  for (let field of checkFields) {
    if (!(field in data)) {
      console.log(`❌ Missing field: ${field}`);
      return false;
    }
  }

  const hash = data.hash;
  const checkData = Object.keys(data)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');

  const secret = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(checkData);
  const computed = hmac.digest('hex');

  if (computed === hash) {
    console.log('✅ Signature verified');
    return true;
  }

  if (process.env.SKIP_TELEGRAM_VERIFICATION === 'true') {
    console.log('⚠️ Signature invalid but SKIP_TELEGRAM_VERIFICATION=true');
    return true;
  }

  console.log('❌ Invalid signature');
  return false;
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
    console.log('📥 telegram-widget-callback handler called');
    const data = JSON.parse(event.body || '{}');
    console.log('👤 Received user data:', { id: data.id, first_name: data.first_name, username: data.username });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.log('❌ Bot token not configured');
      return createResponse(500, { error: "Bot token not configured" });
    }

    if (!verifyTelegramWidget(data, botToken)) {
      return createResponse(401, { error: "Invalid Telegram signature" });
    }

    const telegramId = String(data.id);
    console.log('🔍 Looking up user with telegramId:', telegramId);

    const queryCommand = new QueryCommand({
      TableName: "users",
      IndexName: "telegramId-index",
      KeyConditionExpression: "telegramId = :telegramId",
      ExpressionAttributeValues: { ":telegramId": telegramId },
    });

    let result = await docClient.send(queryCommand);
    console.log('📊 Query result:', result.Items?.length || 0, 'items');

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
        },
      });
    }

    console.log('🆕 Creating new user');
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const email = `telegram_${telegramId}@telegram`;

    const putCommand = new PutCommand({
      TableName: "users",
      Item: {
        email,
        userId,
        telegramId,
        telegramFirstName: data.first_name || '',
        telegramLastName: data.last_name || '',
        telegramUsername: data.username || '',
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
        telegramUsername: data.username,
      },
    });

  } catch (error) {
    console.error("❌ Error:", error.message, error.stack);
    return createResponse(500, { error: "Internal server error" });
  }
};
