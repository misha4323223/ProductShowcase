const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { verifyJWT } = require("../lib/auth-utils");
const { successResponse, errorResponse } = require("../lib/response-helper");
const {
  generatePromoCode,
  determinePrize,
  calculateExpiryDate,
  getSecureRandom,
  generatePrizeId,
  getPrizeDisplayName
} = require("../lib/wheel-utils");

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
    console.log('=== SPIN WHEEL REQUEST ===');
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

    // 2. Получить пользователя и проверить спины
    const userResult = await docClient.send(new GetCommand({
      TableName: "users",
      Key: { email: userEmail }
    }));

    const user = userResult.Item;
    if (!user) {
      return errorResponse(404, 'Пользователь не найден');
    }

    const currentSpins = user.spins || 0;
    console.log('Current spins:', currentSpins);

    if (currentSpins < 1) {
      return errorResponse(400, 'Недостаточно спинов');
    }

    // 3. Получить корзину
    const cartResult = await docClient.send(new GetCommand({
      TableName: "carts",
      Key: { userId }
    }));

    const cartItems = cartResult.Item?.items || [];
    console.log('Cart items count:', cartItems.length);

    if (cartItems.length === 0) {
      return errorResponse(400, 'Добавьте товары в корзину для участия в рулетке');
    }

    // 4. Генерация приза с учетом прогрессивной системы
    const randomValue = getSecureRandom();
    const prizeType = determinePrize(randomValue, currentSpins);
    const promoCode = generatePromoCode(prizeType);
    const expiresAt = calculateExpiryDate(prizeType);
    const prizeId = generatePrizeId();

    console.log('Prize generated:', { prizeType, randomValue, currentSpins });

    // 5. Подготовка данных приза
    let prize = {
      id: prizeId,
      userId,
      prizeType,
      promoCode,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString()
    };

    // Дополнительные данные в зависимости от типа приза
    if (prizeType === 'discount_10') {
      prize.discountValue = 10;
    } 
    else if (prizeType === 'discount_20') {
      // Выбрать случайный товар из корзины
      const randomIndex = Math.floor(Math.random() * cartItems.length);
      const randomCartItem = cartItems[randomIndex];

      // Получить детали товара
      const productResult = await docClient.send(new GetCommand({
        TableName: "products",
        Key: { id: randomCartItem.productId }
      }));

      if (productResult.Item) {
        prize.productId = randomCartItem.productId;
        prize.productName = productResult.Item.name;
        prize.productImage = productResult.Item.image;
      }
      prize.discountValue = 20;
    } 
    else if (prizeType === 'points') {
      prize.pointsAmount = 200;
      
      // Сразу начислить баллы пользователю
      await docClient.send(new UpdateCommand({
        TableName: "users",
        Key: { email: userEmail },
        UpdateExpression: "SET loyaltyPoints = if_not_exists(loyaltyPoints, :zero) + :points",
        ExpressionAttributeValues: {
          ":points": 200,
          ":zero": 0
        }
      }));
    } 
    else if (prizeType === 'free_item') {
      // Найти самый дешевый товар в корзине
      // Оптимизация: берём только первые 10 товаров для проверки
      const itemsToCheck = cartItems.slice(0, 10);
      
      const products = await Promise.all(
        itemsToCheck.map(item =>
          docClient.send(new GetCommand({
            TableName: "products",
            Key: { id: item.productId }
          })).then(res => res.Item).catch(() => null)
        )
      );

      const validProducts = products.filter(p => p && p.price);
      if (validProducts.length > 0) {
        const cheapest = validProducts.reduce((min, p) =>
          (!min || p.price < min.price) ? p : min
        );

        prize.productId = cheapest.id;
        prize.productName = cheapest.name;
        prize.productImage = cheapest.image;
      }
    } 
    else if (prizeType === 'jackpot') {
      prize.discountValue = 40;
      // Джекпот применяется ко всем товарам в корзине
      prize.appliesToAllCart = true;
      // Сохраняем snapshot корзины на момент выигрыша (первые 50 товаров)
      prize.cartSnapshot = cartItems.slice(0, 50).map(item => item.productId);
    }
    else if (prizeType === 'delivery') {
      // Бесплатная доставка - дополнительных данных не требуется
    }

    // 6. Сохранить приз в таблицу wheelPrizes
    try {
      const prizeItem = {
        id: prizeId,
        userId: userId,
        prizeType: prizeType,
        promoCode: promoCode,
        expiresAt: expiresAt,
        createdAt: new Date().toISOString(),
        used: false
      };
      
      // Добавляем опциональные поля только если они есть
      if (prize.discountValue !== undefined) prizeItem.discountValue = prize.discountValue;
      if (prize.pointsAmount !== undefined) prizeItem.pointsAmount = prize.pointsAmount;
      if (prize.productId !== undefined) prizeItem.productId = prize.productId;
      if (prize.productName !== undefined) prizeItem.productName = prize.productName;
      if (prize.productImage !== undefined) prizeItem.productImage = prize.productImage;
      if (prize.appliesToAllCart !== undefined) prizeItem.appliesToAllCart = prize.appliesToAllCart;
      if (prize.cartSnapshot !== undefined) prizeItem.cartSnapshot = prize.cartSnapshot;
      
      await docClient.send(new PutCommand({
        TableName: "wheelPrizes",
        Item: prizeItem
      }));
      console.log('✅ Prize saved to wheelPrizes:', prizeId);
    } catch (err) {
      console.warn('⚠️ Warning saving to wheelPrizes:', err.message);
    }

    // 7. Сохранить в историю wheelHistory
    try {
      const historyId = generatePrizeId();
      const historyItem = {
        id: historyId,
        userId: userId,
        prizeType: prizeType,
        prizeValue: getPrizeDisplayName(prizeType),
        createdAt: new Date().toISOString()
      };
      
      // Добавляем детали приза только если они есть
      if (prize.productName !== undefined) historyItem.productName = prize.productName;
      if (prize.discountValue !== undefined) historyItem.discountAmount = prize.discountValue;
      
      await docClient.send(new PutCommand({
        TableName: "wheelHistory",
        Item: historyItem
      }));
      console.log('✅ Prize saved to wheelHistory:', historyId);
    } catch (err) {
      console.warn('⚠️ Warning saving to wheelHistory:', err.message);
    }

    // 8. Обновить счетчики пользователя
    await docClient.send(new UpdateCommand({
      TableName: "users",
      Key: { email: userEmail },
      UpdateExpression: "SET spins = spins - :one, totalWheelSpins = if_not_exists(totalWheelSpins, :zero) + :one",
      ExpressionAttributeValues: {
        ":one": 1,
        ":zero": 0
      }
    }));

    console.log('Prize saved successfully:', prizeId);

    // 9. Вернуть результат
    return successResponse({
      success: true,
      prize
    });

  } catch (error) {
    console.error("Error spinning wheel:", error);
    return errorResponse(500, error.message || 'Ошибка при вращении рулетки');
  }
};
