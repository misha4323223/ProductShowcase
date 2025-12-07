const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
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

function createRedirectResponse(url) {
  return {
    statusCode: 302,
    headers: {
      'Location': url,
      'Access-Control-Allow-Origin': '*',
    },
    body: '',
  };
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
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const payloadStr = Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payloadStr}`)
    .digest('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  
  return `${header}.${payloadStr}.${signature}`;
}

async function exchangeCodeForToken(code) {
  const clientId = process.env.YANDEX_CLIENT_ID;
  const clientSecret = process.env.YANDEX_CLIENT_SECRET;
  
  const tokenUrl = 'https://oauth.yandex.ru/token';
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    client_id: clientId,
    client_secret: clientSecret,
  });

  console.log('🔄 Обмен кода на токен...');
  
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('❌ Ошибка получения токена:', data);
    throw new Error(data.error_description || 'Failed to get token');
  }

  console.log('✅ Токен получен успешно');
  return data.access_token;
}

async function getYandexUserInfo(accessToken) {
  console.log('🔄 Получение данных пользователя Яндекс...');
  
  const response = await fetch('https://login.yandex.ru/info', {
    headers: {
      'Authorization': `OAuth ${accessToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    console.error('❌ Ошибка получения данных пользователя:', data);
    throw new Error('Failed to get user info');
  }

  console.log('✅ Данные пользователя получены:', data.id, data.default_email);
  return data;
}

exports.handler = async (event) => {
  try {
    console.log('🚀 yandex-oauth handler started');
    console.log('📥 Query params:', event.queryStringParameters);

    const code = event.queryStringParameters?.code;
    const error = event.queryStringParameters?.error;
    const frontendUrl = process.env.FRONTEND_URL || 'https://sweetdelights.store';

    if (error) {
      console.log('❌ OAuth error:', error);
      return createRedirectResponse(`${frontendUrl}/auth?error=yandex_oauth_denied`);
    }

    if (!code) {
      console.log('❌ No authorization code');
      return createRedirectResponse(`${frontendUrl}/auth?error=no_code`);
    }

    const yandexToken = await exchangeCodeForToken(code);
    const yandexUser = await getYandexUserInfo(yandexToken);

    const yandexId = String(yandexUser.id);
    const email = yandexUser.default_email || `yandex_${yandexId}@yandex.ru`;
    const firstName = yandexUser.first_name || '';
    const lastName = yandexUser.last_name || '';
    const phone = yandexUser.default_phone?.number || null;

    console.log('🔍 Поиск существующего пользователя с yandexId:', yandexId);

    const scanByYandexId = new ScanCommand({
      TableName: "users",
      FilterExpression: "yandexId = :yandexId",
      ExpressionAttributeValues: { ":yandexId": yandexId },
    });

    let result = await docClient.send(scanByYandexId);
    
    if (result.Items && result.Items.length > 0) {
      const user = result.Items[0];
      console.log('✅ Найден существующий пользователь:', user.email);
      
      const token = generateToken(user.userId, user.email, {
        yandexId: user.yandexId,
        emailVerified: user.emailVerified,
        firstName: user.yandexFirstName || firstName,
        lastName: user.yandexLastName || lastName,
      });

      return createRedirectResponse(`${frontendUrl}/auth/callback?token=${token}&provider=yandex`);
    }

    // Сначала ищем по номеру телефона
    if (phone) {
      console.log('🔍 Поиск пользователя по телефону:', phone);
      const scanByPhone = new ScanCommand({
        TableName: "users",
        FilterExpression: "phone = :phone",
        ExpressionAttributeValues: { ":phone": phone },
      });

      result = await docClient.send(scanByPhone);

      if (result.Items && result.Items.length > 0) {
        const user = result.Items[0];
        console.log('✅ Найден пользователь по телефону, привязываем Yandex ID');
        
        const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
        const updateCommand = new UpdateCommand({
          TableName: "users",
          Key: { email: user.email },
          UpdateExpression: "SET yandexId = :yandexId, yandexFirstName = :firstName, yandexLastName = :lastName, yandexPhone = :phone, yandexLinkedAt = :linkedAt",
          ExpressionAttributeValues: {
            ":yandexId": yandexId,
            ":firstName": firstName,
            ":lastName": lastName,
            ":phone": phone,
            ":linkedAt": new Date().toISOString(),
          },
        });
        
        await docClient.send(updateCommand);
        
        const token = generateToken(user.userId, user.email, {
          yandexId: yandexId,
          emailVerified: true,
          firstName: firstName,
          lastName: lastName,
        });

        return createRedirectResponse(`${frontendUrl}/auth/callback?token=${token}&provider=yandex`);
      }
    }

    console.log('🔍 Поиск пользователя по email:', email);
    const scanByEmail = new ScanCommand({
      TableName: "users",
      FilterExpression: "email = :email",
      ExpressionAttributeValues: { ":email": email },
    });

    result = await docClient.send(scanByEmail);

    if (result.Items && result.Items.length > 0) {
      const user = result.Items[0];
      console.log('✅ Найден пользователь по email, привязываем Yandex ID');
      
      const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
      const updateCommand = new UpdateCommand({
        TableName: "users",
        Key: { email: user.email },
        UpdateExpression: "SET yandexId = :yandexId, yandexFirstName = :firstName, yandexLastName = :lastName, yandexPhone = :phone, yandexLinkedAt = :linkedAt",
        ExpressionAttributeValues: {
          ":yandexId": yandexId,
          ":firstName": firstName,
          ":lastName": lastName,
          ":phone": phone,
          ":linkedAt": new Date().toISOString(),
        },
      });
      
      await docClient.send(updateCommand);
      
      const token = generateToken(user.userId, user.email, {
        yandexId: yandexId,
        emailVerified: true,
        firstName: firstName,
        lastName: lastName,
      });

      return createRedirectResponse(`${frontendUrl}/auth/callback?token=${token}&provider=yandex`);
    }

    console.log('🆕 Создание нового пользователя');
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Используем телефон как основной идентификатор, если он есть
    // Формат email-ключа: телефон@phone или yandex_id@yandex
    const primaryKey = phone ? `${phone}@phone` : `yandex_${yandexId}@yandex`;

    const putCommand = new PutCommand({
      TableName: "users",
      Item: {
        email: primaryKey,
        userId,
        phone: phone || null,
        yandexEmail: email,
        yandexId,
        yandexFirstName: firstName,
        yandexLastName: lastName,
        yandexPhone: phone,
        yandexLinkedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        role: "user",
        emailVerified: true,
      },
    });

    await docClient.send(putCommand);
    console.log('✅ Пользователь создан:', userId, 'ключ:', primaryKey);

    const token = generateToken(userId, primaryKey, {
      yandexId,
      phone: phone,
      emailVerified: true,
      firstName,
      lastName,
    });

    return createRedirectResponse(`${frontendUrl}/auth/callback?token=${token}&provider=yandex&newUser=true`);

  } catch (error) {
    console.error("❌ Error in yandex-oauth:", error.message, error.stack);
    const frontendUrl = process.env.FRONTEND_URL || 'https://sweetdelights.store';
    return createRedirectResponse(`${frontendUrl}/auth?error=yandex_oauth_error&message=${encodeURIComponent(error.message)}`);
  }
};
