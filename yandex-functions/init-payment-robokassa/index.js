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
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
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

    // СНАЧАЛА получаем и валидируем заказ
    let order;
    let actualAmount;
    
    try {
      const orderResult = await docClient.send(new GetCommand({
        TableName: "orders",
        Key: { id: orderId }
      }));

      if (!orderResult.Item) {
        return {
          statusCode: 404,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            error: `Order ${orderId} not found` 
          }),
        };
      }

      order = orderResult.Item;
      
      // Для безопасности ВСЕГДА используем сумму из заказа
      actualAmount = order.total;
      
      // Проверяем, что запрошенная сумма совпадает
      if (amount !== actualAmount) {
        console.error(`Payment amount mismatch: order.total=${actualAmount}, requested=${amount}`);
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            error: "Payment amount mismatch",
            details: `Requested amount ${amount} does not match order total ${actualAmount}`,
            correctAmount: actualAmount
          }),
        };
      }
    } catch (fetchError) {
      console.error('Error fetching order:', fetchError);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: "Failed to fetch order",
          details: fetchError.message
        }),
      };
    }

    // Генерация URL для оплаты с ПРОВЕРЕННОЙ суммой из заказа
    const paymentUrl = robokassa.generatePaymentUrl({
      outSum: actualAmount,  // ВСЕГДА используем сумму из заказа
      invId: invId,
      description: description || `Оплата заказа #${orderId.substring(0, 8)}`,
      email: email || undefined,
      culture: 'ru',
      additionalParams
    });

    console.log('Payment URL generated:', paymentUrl);

    // Обновление информации о платеже в заказе
    try {

      // Обновляем заказ с условием, что он еще не оплачен
      // Используем ТОЛЬКО сумму из заказа для безопасности
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
        ConditionExpression: "attribute_exists(id) AND (attribute_not_exists(paymentStatus) OR paymentStatus <> :alreadyPaid)",
        ExpressionAttributeValues: {
          ":paymentStatus": "pending",
          ":paymentService": "ROBOKASSA",
          ":invId": invId,
          ":amount": actualAmount,  // ВСЕГДА используем сумму из заказа
          ":initiatedAt": new Date().toISOString(),
          ":alreadyPaid": "paid"
        }
      }));

      console.log(`Order ${orderId} updated with payment info`);
    } catch (dbError) {
      console.error('Error updating order in database:', dbError);
      
      // Если заказ уже оплачен - возвращаем ошибку
      if (dbError.name === 'ConditionalCheckFailedException') {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            error: "Order already paid or payment already initiated" 
          }),
        };
      }
      
      // Для других ошибок БД - не прерываем выполнение
      // Платежная ссылка все равно будет создана
      console.warn('Payment URL will be returned despite database error');
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
        amount: actualAmount,  // Возвращаем фактическую сумму из заказа
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
