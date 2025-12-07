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
 *   "description": "Заказ #123",  // Описание платежа
 *   "paymentMethod": "sbp"        // Способ оплаты: "sbp" для СБП (опционально)
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

const crypto = require('crypto');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

// ============================================
// RobokassaClient - встроенный класс
// ============================================
class RobokassaClient {
  constructor(merchantLogin, password1, password2, options = {}) {
    this.merchantLogin = merchantLogin;
    this.password1 = password1;
    this.password2 = password2;
    this.isTest = options.isTest || false;
    this.hashAlgorithm = options.hashAlgorithm || 'sha256';
    this.paymentUrl = 'https://auth.robokassa.ru/Merchant/Index.aspx';
  }

  _normalizeAmount(amount) {
    return Number(amount).toFixed(2);
  }

  generatePaymentSignature(outSum, invId, additionalParams = {}) {
    const normalizedSum = this._normalizeAmount(outSum);
    let signatureString = `${this.merchantLogin}:${normalizedSum}:${invId}:${this.password1}`;
    const sortedParams = Object.keys(additionalParams)
      .filter(key => key.startsWith('Shp_') || key.startsWith('shp_'))
      .sort()
      .map(key => `${key}=${additionalParams[key]}`);
    if (sortedParams.length > 0) {
      signatureString += `:${sortedParams.join(':')}`;
    }
    return this._hash(signatureString);
  }

  verifyResultSignature(outSum, invId, signatureValue, additionalParams = {}) {
    const normalizedSum = this._normalizeAmount(outSum);
    let checkString = `${normalizedSum}:${invId}:${this.password2}`;
    const sortedParams = Object.keys(additionalParams)
      .filter(key => key.startsWith('Shp_') || key.startsWith('shp_'))
      .sort()
      .map(key => `${key}=${additionalParams[key]}`);
    if (sortedParams.length > 0) {
      checkString += `:${sortedParams.join(':')}`;
    }
    const expectedSignature = this._hash(checkString);
    return signatureValue.toUpperCase() === expectedSignature.toUpperCase();
  }

  generatePaymentUrl(params) {
    const {
      outSum,
      invId,
      description,
      email,
      culture = 'ru',
      paymentMethod,
      additionalParams = {}
    } = params;

    const signature = this.generatePaymentSignature(outSum, invId, additionalParams);
    const urlParams = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      OutSum: this._normalizeAmount(outSum),
      InvId: invId.toString(),
      Description: description,
      SignatureValue: signature,
      Culture: culture,
    });

    if (email) {
      urlParams.append('Email', email);
    }
    if (this.isTest) {
      urlParams.append('IsTest', '1');
    }

    Object.entries(additionalParams).forEach(([key, value]) => {
      urlParams.append(key, value);
    });

    // СБП - добавляем IncCurrLabel=SBP для отображения QR-кода
    if (paymentMethod === 'sbp') {
      urlParams.append('IncCurrLabel', 'SBP');
    }

    return `${this.paymentUrl}?${urlParams.toString()}`;
  }

  parseCallback(callbackData) {
    const {
      OutSum,
      InvId,
      SignatureValue,
      Culture,
      ...customParams
    } = callbackData;

    const additionalParams = {};
    Object.keys(customParams).forEach(key => {
      if (key.startsWith('Shp_') || key.startsWith('shp_')) {
        additionalParams[key] = customParams[key];
      }
    });

    return {
      outSum: parseFloat(OutSum),
      invId: InvId,
      signatureValue: SignatureValue,
      culture: Culture,
      additionalParams,
      isValid: this.verifyResultSignature(
        OutSum,
        InvId,
        SignatureValue,
        additionalParams
      )
    };
  }

  _hash(str) {
    return crypto
      .createHash(this.hashAlgorithm)
      .update(str)
      .digest('hex')
      .toUpperCase();
  }

  generateResultResponse(invId) {
    return `OK${invId}`;
  }
}

// ============================================
// Инициализация YDB клиента
// ============================================
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

// ============================================
// Основной обработчик
// ============================================
exports.handler = async (event) => {
  try {
    console.log('Init payment request:', event);

    // Парсинг входных данных
    const body = JSON.parse(event.body || '{}');
    const { orderId, amount, email, description, paymentMethod } = body;

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
    // ВАЖНО: Robokassa требует строго числовой InvId (положительное целое число)
    // Используем timestamp в миллисекундах + случайное число для уникальности
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const numericInvId = Number(`${timestamp}${randomSuffix}`);
    
    console.log(`Generated numeric InvId: ${numericInvId} for order: ${orderId}`);

    // Дополнительные параметры (передаются через Shp_*)
    // Это позволит идентифицировать заказ при callback по реальному orderId
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
      invId: numericInvId,    // Используем числовой InvId для Robokassa
      description: description || `Оплата заказа #${orderId.substring(0, 8)}`,
      email: email || undefined,
      culture: 'ru',
      paymentMethod: paymentMethod,  // sbp для СБП
      additionalParams
    });

    console.log('Payment URL generated:', paymentUrl);
    console.log('Using numeric InvId:', numericInvId, 'with orderId in Shp_OrderId:', orderId);
    console.log('Payment method:', paymentMethod || 'default (card)');

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
              robokassaInvoiceId = :invoiceId,
              robokassaOutSum = :amount,
              paymentInitiatedAt = :initiatedAt
        `,
        ConditionExpression: "attribute_exists(id) AND (attribute_not_exists(paymentStatus) OR paymentStatus <> :alreadyPaid)",
        ExpressionAttributeValues: {
          ":paymentStatus": "pending",
          ":paymentService": "ROBOKASSA",
          ":invoiceId": numericInvId,  // Сохраняем числовой InvId
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
        invId: numericInvId,  // Возвращаем числовой InvId
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
