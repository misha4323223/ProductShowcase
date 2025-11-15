/**
 * Cloud Function: init-payment-robokassa
 * 
 * Назначение: Генерация ссылки на оплату через Робокассу
 * 
 * Входные данные (POST):
 * {
 *   "orderId": "abc123",          // ID заказа из базы данных
 *   "amount": 5000,               // Сумма платежа в рублях
 *   "email": "user@example.com",  // Email покупателя (опционально)
 *   "description": "Заказ #123"   // Описание платежа
 * }
 * 
 * Выходные данные:
 * {
 *   "success": true,
 *   "paymentUrl": "https://auth.robokassa.ru/Merchant/Index.aspx?...",
 *   "orderId": "abc123",
 *   "amount": 5000
 * }
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const RobokassaClient = require("../lib/robokassa-client");

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
    console.log('Init payment request:', event);

    // Парсинг входных данных
    const body = JSON.parse(event.body || '{}');
    const { orderId, amount, email, description } = body;

    // Валидация обязательных полей
    if (!orderId || !amount) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: "Missing required fields: orderId, amount" 
        }),
      };
    }

    // Проверка, что сумма положительная
    if (amount <= 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: "Amount must be greater than 0" 
        }),
      };
    }

    // Получение настроек Робокассы из переменных окружения
    const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
    const password1 = process.env.ROBOKASSA_PASSWORD_1;
    const password2 = process.env.ROBOKASSA_PASSWORD_2;
    const hashAlgorithm = process.env.ROBOKASSA_HASH_ALGORITHM || 'sha256';
    const isTest = process.env.ROBOKASSA_TEST_MODE === 'true';

    // Проверка наличия всех необходимых настроек
    if (!merchantLogin || !password1 || !password2) {
      console.error('Missing Robokassa credentials');
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: "Robokassa credentials not configured" 
        }),
      };
    }

    // Инициализация клиента Робокассы
    const robokassa = new RobokassaClient(merchantLogin, password1, password2, {
      isTest,
      hashAlgorithm
    });

    // Генерация InvId (уникальный номер счета)
    // Используем orderId из базы данных
    const invId = orderId;

    // Дополнительные параметры (передаются через Shp_*)
    // Это позволит идентифицировать заказ при callback
    const additionalParams = {
      Shp_OrderId: orderId
    };

    // Генерация URL для оплаты
    const paymentUrl = robokassa.generatePaymentUrl({
      outSum: amount,
      invId: invId,
      description: description || `Оплата заказа #${orderId.substring(0, 8)}`,
      email: email || undefined,
      culture: 'ru',
      additionalParams
    });

    console.log('Payment URL generated:', paymentUrl);

    // Обновление заказа в базе данных
    // Добавляем информацию о том, что платеж инициирован
    try {
      await docClient.send(new UpdateCommand({
        TableName: "orders",
        Key: { id: orderId },
        UpdateExpression: `
          SET paymentStatus = :paymentStatus,
              paymentService = :paymentService,
              robokassaInvId = :invId,
              robokassaOutSum = :amount,
              paymentInitiatedAt = :initiatedAt
        `,
        ExpressionAttributeValues: {
          ":paymentStatus": "pending",
          ":paymentService": "ROBOKASSA",
          ":invId": invId,
          ":amount": amount,
          ":initiatedAt": new Date().toISOString()
        }
      }));

      console.log(`Order ${orderId} updated with payment info`);
    } catch (dbError) {
      console.error('Error updating order in database:', dbError);
      // Не прерываем выполнение, если не удалось обновить БД
      // Платежная ссылка все равно будет создана
    }

    // Возврат успешного результата
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        paymentUrl,
        orderId,
        invId,
        amount,
        isTest
      }),
    };

  } catch (error) {
    console.error("Error in init-payment-robokassa:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: error.message,
        details: "Failed to initialize payment"
      }),
    };
  }
};
