const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { code, orderTotal } = body;

    if (!code || orderTotal === undefined) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Code and orderTotal are required" }),
      };
    }

    // Нормализуем входящий код (удаляем пробелы, приводим к верхнему регистру)
    const normalizedInputCode = code.trim().toUpperCase();

    // 1. Сначала проверяем обычные промокоды в таблице promocodes
    const promoResult = await docClient.send(new ScanCommand({
      TableName: "promocodes",
    }));
    
    let promoCode = (promoResult.Items || []).find(p => 
      p.code && p.code.trim().toUpperCase() === normalizedInputCode
    );

    // 2. Если не найден в promocodes, проверяем промокоды рулетки в wheelPrizes
    if (!promoCode) {
      const wheelPrizesResult = await docClient.send(new ScanCommand({
        TableName: "wheelPrizes",
      }));
      
      const wheelPrize = (wheelPrizesResult.Items || []).find(p => 
        p.promoCode && p.promoCode.trim().toUpperCase() === normalizedInputCode
      );

      if (wheelPrize) {
        // Проверяем, не использован ли приз
        if (wheelPrize.used) {
          return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ valid: false, message: "Промокод уже использован" }),
          };
        }

        // Проверяем срок действия
        const now = new Date();
        if (wheelPrize.expiresAt && now > new Date(wheelPrize.expiresAt)) {
          return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ valid: false, message: "Промокод истек" }),
          };
        }

        // Преобразуем wheelPrize в формат promoCode для дальнейшей обработки
        let discountAmount = 0;
        let discountType = 'percentage';
        let discountValue = 0;

        // Рассчитываем скидку в зависимости от типа приза
        if (wheelPrize.prizeType === 'discount_10') {
          discountType = 'percentage';
          discountValue = 10;
          discountAmount = orderTotal * 0.10;
        } else if (wheelPrize.prizeType === 'discount_20') {
          discountType = 'percentage';
          discountValue = 20;
          discountAmount = orderTotal * 0.20;
        } else if (wheelPrize.prizeType === 'jackpot') {
          discountType = 'percentage';
          discountValue = 40;
          discountAmount = orderTotal * 0.40;
        } else if (wheelPrize.prizeType === 'free_item') {
          // Бесплатный товар - скидка 100% на конкретный товар
          // Здесь нужна дополнительная логика на фронтенде
          discountType = 'percentage';
          discountValue = 100;
          discountAmount = 0; // Будет рассчитано на основе конкретного товара
        } else if (wheelPrize.prizeType === 'delivery') {
          // Бесплатная доставка - фиксированная скидка
          discountType = 'fixed';
          discountValue = 300; // Примерная стоимость доставки
          discountAmount = 300;
        } else if (wheelPrize.prizeType === 'points') {
          // Баллы не дают скидку на заказ
          return {
            statusCode: 200,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              valid: false, 
              message: "Этот промокод для начисления баллов, не для скидки" 
            }),
          };
        }

        // Возвращаем результат для промокода рулетки
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            valid: true,
            promoCode: {
              code: wheelPrize.promoCode,
              discountType,
              discountValue,
              active: true,
              wheelPrize: true, // Флаг, что это промокод из рулетки
              prizeId: wheelPrize.id,
              prizeType: wheelPrize.prizeType,
              productId: wheelPrize.productId, // Для free_item и discount_20
            },
            discountAmount
          }),
        };
      }

      // Промокод не найден ни в одной таблице
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, message: "Промокод не найден" }),
      };
    }

    // === ОБРАБОТКА ОБЫЧНЫХ ПРОМОКОДОВ (из таблицы promocodes) ===

    if (!promoCode.active) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, message: "Промокод неактивен" }),
      };
    }

    const now = new Date();

    if (promoCode.startDate && now < new Date(promoCode.startDate)) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, message: "Промокод еще не действует" }),
      };
    }

    if (promoCode.endDate && now > new Date(promoCode.endDate)) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, message: "Промокод истек" }),
      };
    }

    if (promoCode.maxUses) {
      const ordersResult = await docClient.send(new ScanCommand({
        TableName: "orders",
      }));
      const usageCount = (ordersResult.Items || []).filter(order =>
        order.promoCode && order.promoCode.code && 
        order.promoCode.code.trim().toUpperCase() === normalizedInputCode
      ).length;

      if (usageCount >= promoCode.maxUses) {
        return {
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: JSON.stringify({ valid: false, message: "Промокод исчерпан" }),
        };
      }
    }

    if (promoCode.minOrderAmount && orderTotal < promoCode.minOrderAmount) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valid: false,
          message: `Минимальная сумма заказа: ${promoCode.minOrderAmount} ₽`
        }),
      };
    }

    let discountAmount = 0;
    if (promoCode.discountType === 'percentage') {
      discountAmount = orderTotal * (promoCode.discountValue / 100);
    } else {
      discountAmount = promoCode.discountValue;
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        valid: true,
        promoCode,
        discountAmount
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
