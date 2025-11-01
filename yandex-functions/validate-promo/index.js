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
    const body = JSON.parse(event.body || '{}');
    const { code, orderTotal } = body;

    if (!code || orderTotal === undefined) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Code and orderTotal are required" }),
      };
    }

    // Получаем промокод
    const promoResult = await docClient.send(new ScanCommand({
      TableName: "promocodes",
    }));
    const promoCode = (promoResult.Items || []).find(p => p.code === code.toUpperCase());

    if (!promoCode) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ valid: false, message: "Промокод не найден" }),
      };
    }

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
        order.promoCode && order.promoCode.code === code.toUpperCase()
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
