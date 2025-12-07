const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, GetCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require('crypto');

// Нормализация телефона для корректного сравнения
function normalizePhone(phone) {
  if (!phone) return null;
  // Убираем все кроме цифр
  let digits = phone.replace(/\D/g, '');
  // Приводим к формату 7XXXXXXXXXX (11 цифр)
  if (digits.length === 10) {
    digits = '7' + digits;
  } else if (digits.length === 11 && digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  return digits.length === 11 ? digits : null;
}

// Полное сканирование таблицы с пагинацией (DynamoDB возвращает max 1MB за раз)
async function scanAllItems(docClient, params) {
  const allItems = [];
  let lastEvaluatedKey = null;
  
  do {
    const scanParams = { ...params };
    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }
    
    const result = await docClient.send(new ScanCommand(scanParams));
    if (result.Items) {
      allItems.push(...result.Items);
    }
    lastEvaluatedKey = result.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  return allItems;
}

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
    const rawPhone = yandexUser.default_phone?.number || null;
    const normalizedYandexPhone = normalizePhone(rawPhone);

    console.log('🔍 Поиск существующего пользователя с yandexId:', yandexId);
    console.log('📞 Телефон от Яндекса:', rawPhone, '→ нормализованный:', normalizedYandexPhone);

    // Поиск по yandexId с пагинацией
    const yandexIdUsers = await scanAllItems(docClient, {
      TableName: "users",
      FilterExpression: "yandexId = :yandexId",
      ExpressionAttributeValues: { ":yandexId": yandexId },
    });
    
    if (yandexIdUsers.length > 0) {
      const user = yandexIdUsers[0];
      console.log('✅ Найден существующий пользователь:', user.email);
      
      const token = generateToken(user.userId, user.email, {
        yandexId: user.yandexId,
        emailVerified: user.emailVerified,
        firstName: user.yandexFirstName || firstName,
        lastName: user.yandexLastName || lastName,
      });

      return createRedirectResponse(`${frontendUrl}/auth/callback?token=${token}&provider=yandex`);
    }

    // Ищем по нормализованному номеру телефона (сравниваем yandexPhone с phone всех пользователей)
    if (normalizedYandexPhone) {
      console.log('🔍 Поиск пользователя по нормализованному телефону:', normalizedYandexPhone);
      
      // Сканируем всех пользователей с phone с пагинацией
      const usersWithPhone = await scanAllItems(docClient, {
        TableName: "users",
        FilterExpression: "attribute_exists(phone) AND phone <> :empty",
        ExpressionAttributeValues: { ":empty": "" },
      });

      if (usersWithPhone.length > 0) {
        // Ищем пользователя с совпадающим нормализованным телефоном
        const matchingUser = usersWithPhone.find(user => {
          const userNormalizedPhone = normalizePhone(user.phone);
          return userNormalizedPhone && userNormalizedPhone === normalizedYandexPhone;
        });

        if (matchingUser) {
          console.log('✅ Найден пользователь по телефону:', matchingUser.email, '- привязываем Yandex ID');
          
          const updateCommand = new UpdateCommand({
            TableName: "users",
            Key: { email: matchingUser.email },
            UpdateExpression: "SET yandexId = :yandexId, yandexEmail = :yandexEmail, yandexFirstName = :firstName, yandexLastName = :lastName, yandexPhone = :phone, normalizedPhone = :normalizedPhone, yandexLinkedAt = :linkedAt",
            ExpressionAttributeValues: {
              ":yandexId": yandexId,
              ":yandexEmail": email,
              ":firstName": firstName,
              ":lastName": lastName,
              ":phone": rawPhone,
              ":normalizedPhone": normalizedYandexPhone,
              ":linkedAt": new Date().toISOString(),
            },
          });
          
          await docClient.send(updateCommand);

          // 🔄 АВТОМАТИЧЕСКОЕ ОБЪЕДИНЕНИЕ: Проверяем, есть ли дубликат с тем же yandexId
          const yandexDuplicates = await scanAllItems(docClient, {
            TableName: "users",
            FilterExpression: "yandexId = :yandexId AND email <> :currentEmail",
            ExpressionAttributeValues: { 
              ":yandexId": yandexId,
              ":currentEmail": matchingUser.email
            },
          });

          if (yandexDuplicates.length > 0) {
            console.log(`🗑️ Найдено ${yandexDuplicates.length} дубликатов с yandexId=${yandexId}, удаляем...`);
            
            // Удаляем дубликаты
            for (const duplicate of yandexDuplicates) {
              try {
                const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");
                await docClient.send(new DeleteCommand({
                  TableName: "users",
                  Key: { email: duplicate.email }
                }));
                console.log(`✅ Удален дубликат: ${duplicate.email}`);
              } catch (error) {
                console.error(`❌ Ошибка удаления дубликата ${duplicate.email}:`, error);
              }
            }
          }
          
          const token = generateToken(matchingUser.userId, matchingUser.email, {
            yandexId: yandexId,
            emailVerified: true,
            firstName: matchingUser.firstName || firstName,
            lastName: matchingUser.lastName || lastName,
          });

          return createRedirectResponse(`${frontendUrl}/auth/callback?token=${token}&provider=yandex`);
        }
      }
    }

    // Поиск по email используя GetCommand (email - первичный ключ)
    console.log('🔍 Поиск пользователя по email:', email);
    const getByEmail = new GetCommand({
      TableName: "users",
      Key: { email: email },
    });

    const emailResult = await docClient.send(getByEmail);

    if (emailResult.Item) {
      const user = emailResult.Item;
      console.log('✅ Найден пользователь по email, привязываем Yandex ID');
      
      const updateCommand = new UpdateCommand({
        TableName: "users",
        Key: { email: user.email },
        UpdateExpression: "SET yandexId = :yandexId, yandexEmail = :yandexEmail, yandexFirstName = :firstName, yandexLastName = :lastName, yandexPhone = :phone, normalizedPhone = :normalizedPhone, yandexLinkedAt = :linkedAt",
        ExpressionAttributeValues: {
          ":yandexId": yandexId,
          ":yandexEmail": email,
          ":firstName": firstName,
          ":lastName": lastName,
          ":phone": rawPhone,
          ":normalizedPhone": normalizedYandexPhone,
          ":linkedAt": new Date().toISOString(),
        },
      });
      
      await docClient.send(updateCommand);
      
      const token = generateToken(user.userId, user.email, {
        yandexId: yandexId,
        emailVerified: true,
        firstName: user.firstName || firstName,
        lastName: user.lastName || lastName,
      });

      return createRedirectResponse(`${frontendUrl}/auth/callback?token=${token}&provider=yandex`);
    }

    console.log('🆕 Создание нового пользователя');
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Используем телефон как основной идентификатор, если он есть
    // Формат email-ключа: телефон@phone или yandex_id@yandex
    const primaryKey = normalizedYandexPhone ? `${normalizedYandexPhone}@phone` : `yandex_${yandexId}@yandex`;

    const putCommand = new PutCommand({
      TableName: "users",
      Item: {
        email: primaryKey,
        userId,
        phone: rawPhone || null,
        normalizedPhone: normalizedYandexPhone,
        yandexEmail: email,
        yandexId,
        yandexFirstName: firstName,
        yandexLastName: lastName,
        yandexPhone: rawPhone,
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
      phone: rawPhone,
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
