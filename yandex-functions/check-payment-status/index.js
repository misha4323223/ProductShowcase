/**
 * Cloud Function: check-payment-status
 * 
 * Назначение: Проверка статуса платежа в базе данных
 * Полезно для админки или если callback от Робокассы не пришел
 * 
 * Входные данные (GET):
 * ?orderId=abc123
 * 
 * Выходные данные:
 * {
 *   "orderId": "abc123",
 *   "paymentStatus": "paid",
 *   "status": "processing",
 *   "amount": 5000,
 *   "paidAt": "2025-01-15T10:30:00Z"
 * }
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

// Инициализация YDB клиента
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
    console.log('Check payment status request:', event);

    // Получаем orderId из query параметров
    const orderId = event.queryStringParameters?.orderId || 
                    event.pathParameters?.orderId ||
                    event.params?.orderId;

    if (!orderId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: "Missing required parameter: orderId" 
        }),
      };
    }

    // Получаем заказ из базы данных
    const result = await docClient.send(new GetCommand({
      TableName: "orders",
      Key: { id: orderId }
    }));

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: "Order not found",
          orderId
        }),
      };
    }

    const order = result.Item;

    // Формируем ответ с информацией о платеже
    const paymentInfo = {
      orderId: order.id,
      orderStatus: order.status,
      
      // Платежная информация
      paymentStatus: order.paymentStatus || 'unknown',
      paymentService: order.paymentService || null,
      
      // Робокасса специфичные поля
      robokassaInvId: order.robokassaInvId || null,
      robokassaOutSum: order.robokassaOutSum || null,
      
      // Суммы
      total: order.total,
      subtotal: order.subtotal || order.total,
      discount: order.discount || 0,
      
      // Временные метки
      createdAt: order.createdAt,
      paymentInitiatedAt: order.paymentInitiatedAt || null,
      paidAt: order.paidAt || null,
      
      // Статусы для быстрой проверки
      isPaid: order.paymentStatus === 'paid',
      isPending: order.paymentStatus === 'pending',
      isFailed: order.paymentStatus === 'failed',
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentInfo),
    };

  } catch (error) {
    console.error("Error in check-payment-status:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: error.message,
        details: "Failed to check payment status"
      }),
    };
  }
};
