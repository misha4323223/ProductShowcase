const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { verifyJWT } = require("../lib/auth-utils");
const { successResponse, errorResponse } = require("../lib/response-helper");

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

exports.handler = async (event) => {
  try {
    console.log('=== GET WHEEL HISTORY REQUEST ===');
    console.log('Headers:', JSON.stringify(event.headers, null, 2));
    console.log('Query params:', JSON.stringify(event.queryStringParameters, null, 2));

    // 1. Получить и верифицировать токен
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(401, 'Необходима авторизация');
    }

    const token = authHeader.substring(7);
    const verification = verifyJWT(token);

    if (!verification.valid) {
      return errorResponse(401, 'Неверный токен');
    }

    const userId = verification.payload.userId;
    console.log('User ID:', userId);

    // 2. Получить параметры пагинации
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 20;
    const offset = parseInt(queryParams.offset) || 0;

    console.log('Pagination:', { limit, offset });

    // 3. Получить историю выигрышей
    let historyItems = [];
    
    try {
      // Попытка использовать Query с индексом на userId (быстрый путь)
      const historyResult = await docClient.send(new QueryCommand({
        TableName: "wheelHistory",
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId
        },
        ScanIndexForward: false // Сортировка по убыванию (от новых к старым)
      }));
      historyItems = historyResult.Items || [];
      console.log('History loaded via index:', historyItems.length);
    } catch (error) {
      console.warn('Index query failed, using Scan fallback:', error.message);
      
      // Fallback: Scan таблицы с фильтром (медленнее, но работает без индекса)
      try {
        const scanResult = await docClient.send(new ScanCommand({
          TableName: "wheelHistory",
          FilterExpression: "userId = :userId",
          ExpressionAttributeValues: {
            ":userId": userId
          }
        }));
        historyItems = scanResult.Items || [];
        console.log('History loaded via Scan:', historyItems.length);
      } catch (scanError) {
        console.error('Scan also failed:', scanError.message);
        // Таблица может ещё не существовать
        historyItems = [];
      }
    }

    // 4. Сортировка по дате (от новых к старым)
    historyItems.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA; // Убывание (новые сверху)
    });

    // 5. Применить пагинацию
    const totalCount = historyItems.length;
    const paginatedItems = historyItems.slice(offset, offset + limit);

    console.log('Returning:', paginatedItems.length, 'items of', totalCount, 'total');

    // 6. Вернуть результат
    return successResponse({
      items: paginatedItems,
      totalCount,
      limit,
      offset,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error("Error getting wheel history:", error);
    return errorResponse(500, error.message || 'Ошибка при получении истории рулетки');
  }
};
