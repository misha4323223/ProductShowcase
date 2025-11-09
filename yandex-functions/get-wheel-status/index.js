const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
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
    console.log('=== GET WHEEL STATUS REQUEST ===');
    console.log('Headers:', JSON.stringify(event.headers, null, 2));

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
    const userEmail = verification.payload.email;
    console.log('User ID:', userId, 'Email:', userEmail);

    // Проверка наличия email в токене
    if (!userEmail) {
      console.error('❌ Email отсутствует в JWT payload. Токен устарел или поврежден.');
      return errorResponse(401, 'Ваша сессия устарела. Пожалуйста, выйдите и войдите заново.');
    }

    // 2. Получить данные пользователя
    const userResult = await docClient.send(new GetCommand({
      TableName: "users",
      Key: { email: userEmail }
    }));

    const user = userResult.Item;
    if (!user) {
      return errorResponse(404, 'Пользователь не найден');
    }

    const spins = user.spins || 0;
    const totalSpinsEarned = user.totalSpinsEarned || 0;
    const totalWheelSpins = user.totalWheelSpins || 0;
    const loyaltyPoints = user.loyaltyPoints || 0;

    console.log('User wheel data:', { spins, totalSpinsEarned, totalWheelSpins, loyaltyPoints });

    // 3. Получить активные призы (не использованные и не истекшие)
    let activePrizes = [];
    
    try {
      // Попытка использовать Query с индексом на userId (быстрый путь)
      const prizesResult = await docClient.send(new QueryCommand({
        TableName: "wheelPrizes",
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        FilterExpression: "used = :false AND expiresAt > :now",
        ExpressionAttributeValues: {
          ":userId": userId,
          ":false": false,
          ":now": new Date().toISOString()
        }
      }));
      activePrizes = prizesResult.Items || [];
      console.log('Active prizes loaded via index:', activePrizes.length);
    } catch (error) {
      console.warn('Index query failed, using Scan fallback:', error.message);
      
      // Fallback: Scan таблицы с фильтром (медленнее, но работает без индекса)
      try {
        const scanResult = await docClient.send(new ScanCommand({
          TableName: "wheelPrizes",
          FilterExpression: "userId = :userId AND used = :false AND expiresAt > :now",
          ExpressionAttributeValues: {
            ":userId": userId,
            ":false": false,
            ":now": new Date().toISOString()
          }
        }));
        activePrizes = scanResult.Items || [];
        console.log('Active prizes loaded via Scan:', activePrizes.length);
      } catch (scanError) {
        console.error('Scan also failed:', scanError.message);
        // Таблица может ещё не существовать - вернём пустой массив
        activePrizes = [];
      }
    }

    // 4. Получить историю для расчёта статистики
    let historyItems = [];
    
    try {
      // Попытка использовать Query с индексом (быстрый путь)
      const historyResult = await docClient.send(new QueryCommand({
        TableName: "wheelHistory",
        IndexName: "userId-index",
        KeyConditionExpression: "userId = :userId",
        ExpressionAttributeValues: {
          ":userId": userId
        }
      }));
      historyItems = historyResult.Items || [];
      console.log('History loaded via index:', historyItems.length);
    } catch (error) {
      console.warn('History index query failed, using Scan fallback:', error.message);
      
      // Fallback: Scan таблицы с фильтром
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
        console.error('History Scan also failed:', scanError.message);
        // Таблица может ещё не существовать - продолжаем с пустым массивом
        historyItems = [];
      }
    }

    console.log('Final historyItems count:', historyItems.length);

    // Рассчитать статистику

    // Определить лучший приз (по discountAmount или типу)
    let bestPrize = null;
    if (historyItems.length > 0) {
      const prizeTypeValue = {
        'jackpot': 100,
        'free_item': 50,
        'discount_20': 20,
        'discount_10': 10,
        'delivery': 8,
        'points': 5
      };
      
      const bestItem = historyItems.reduce((best, item) => {
        const currentValue = prizeTypeValue[item.prizeType] || 0;
        const bestValue = best ? (prizeTypeValue[best.prizeType] || 0) : 0;
        return currentValue > bestValue ? item : best;
      }, null);
      
      bestPrize = bestItem ? bestItem.prizeValue : null;
    }

    // Рассчитать общую экономию (примерно)
    const totalSaved = historyItems.reduce((sum, item) => {
      if (item.prizeDetails?.savedAmount) {
        return sum + item.prizeDetails.savedAmount;
      }
      return sum;
    }, 0);

    const stats = {
      totalSpinsEarned,
      totalWheelSpins,
      bestPrize,
      totalSaved
    };

    // 5. Вернуть статус
    return successResponse({
      spins,
      totalSpinsEarned,
      totalWheelSpins,
      loyaltyPoints,
      activePrizes,
      stats
    });

  } catch (error) {
    console.error("Error getting wheel status:", error);
    return errorResponse(500, error.message || 'Ошибка при получении статуса рулетки');
  }
};
