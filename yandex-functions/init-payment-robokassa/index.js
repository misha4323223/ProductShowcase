/**
 * Cloud Function: init-payment-robokassa
 * 
 * Назначение: Генерация данных для оплаты через Робокассу
 * Поддерживает: обычный redirect И iFrame режим для СБП с QR-кодом
 * 
 * Входные данные (POST):
 * {
 *   "orderId": "abc123",
 *   "amount": 5000,
 *   "email": "user@example.com",
 *   "description": "Заказ #123",
 *   "paymentMethod": "sbp" | "card"  // sbp для СБП с QR-кодом
 * }
 * 
 * Выходные данные:
 * {
 *   "success": true,
 *   "paymentUrl": "https://...",           // URL для redirect (карта)
 *   "iframeParams": {...},                  // Параметры для iFrame (СБП)
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

  _hash(str) {
    return crypto
      .createHash(this.hashAlgorithm)
      .update(str)
      .digest('hex')
      .toUpperCase();
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

    // Для СБП добавляем IncCurrLabel (работает частично, основной метод - iFrame)
    if (paymentMethod === 'sbp') {
      urlParams.append('IncCurrLabel', 'SBP');
    }

    return `${this.paymentUrl}?${urlParams.toString()}`;
  }

  // Генерация параметров для iFrame (для СБП с QR-кодом)
  generateIframeParams(params) {
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

    const iframeParams = {
      MerchantLogin: this.merchantLogin,
      OutSum: this._normalizeAmount(outSum),
      InvId: invId.toString(),
      Description: description,
      SignatureValue: signature,
      Culture: culture,
      Encoding: 'utf-8',
    };

    if (email) {
      iframeParams.Email = email;
    }

    if (this.isTest) {
      iframeParams.IsTest = 1;
    }

    // Добавляем Shp_ параметры
    Object.entries(additionalParams).forEach(([key, value]) => {
      iframeParams[key] = value;
    });

    // Настройки для iFrame: режим модального окна с выбором способов оплаты
    if (paymentMethod === 'sbp') {
      // Только СБП
      iframeParams.Settings = JSON.stringify({
        PaymentMethods: ['SBP'],
        Mode: 'modal'
      });
    } else if (paymentMethod === 'card') {
      // Только карта
      iframeParams.Settings = JSON.stringify({
        PaymentMethods: ['BankCard'],
        Mode: 'modal'
      });
    } else {
      // Оба способа
      iframeParams.Settings = JSON.stringify({
        PaymentMethods: ['BankCard', 'SBP'],
        Mode: 'modal'
      });
    }

    return iframeParams;
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

    const body = JSON.parse(event.body || '{}');
    const { orderId, amount, email, description, paymentMethod } = body;

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

    const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
    const password1 = process.env.ROBOKASSA_PASSWORD_1;
    const password2 = process.env.ROBOKASSA_PASSWORD_2;
    const hashAlgorithm = process.env.ROBOKASSA_HASH_ALGORITHM || 'sha256';
    const isTest = process.env.ROBOKASSA_TEST_MODE === 'true';

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

    const robokassa = new RobokassaClient(merchantLogin, password1, password2, {
      isTest,
      hashAlgorithm
    });

    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 1000);
    const numericInvId = Number(`${timestamp}${randomSuffix}`);
    
    console.log(`Generated numeric InvId: ${numericInvId} for order: ${orderId}`);

    const additionalParams = {
      Shp_OrderId: orderId
    };

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
      actualAmount = order.total;
      
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

    const paymentParams = {
      outSum: actualAmount,
      invId: numericInvId,
      description: description || `Оплата заказа #${orderId.substring(0, 8)}`,
      email: email || undefined,
      culture: 'ru',
      paymentMethod: paymentMethod,
      additionalParams
    };

    // Генерируем URL для redirect (работает для карты)
    const paymentUrl = robokassa.generatePaymentUrl(paymentParams);
    
    // Генерируем параметры для iFrame (работает для СБП с QR-кодом)
    const iframeParams = robokassa.generateIframeParams(paymentParams);

    console.log('Payment URL generated:', paymentUrl);
    console.log('iFrame params generated for:', paymentMethod || 'all methods');
    console.log('Using numeric InvId:', numericInvId, 'with orderId in Shp_OrderId:', orderId);

    try {
      await docClient.send(new UpdateCommand({
        TableName: "orders",
        Key: { id: orderId },
        UpdateExpression: `
          SET paymentStatus = :paymentStatus,
              paymentService = :paymentService,
              robokassaInvoiceId = :invoiceId,
              robokassaOutSum = :amount,
              paymentInitiatedAt = :initiatedAt,
              paymentMethod = :paymentMethod
        `,
        ConditionExpression: "attribute_exists(id) AND (attribute_not_exists(paymentStatus) OR paymentStatus <> :alreadyPaid)",
        ExpressionAttributeValues: {
          ":paymentStatus": "pending",
          ":paymentService": "ROBOKASSA",
          ":invoiceId": numericInvId,
          ":amount": actualAmount,
          ":initiatedAt": new Date().toISOString(),
          ":alreadyPaid": "paid",
          ":paymentMethod": paymentMethod || "card"
        }
      }));

      console.log(`Order ${orderId} updated with payment info`);
    } catch (dbError) {
      console.error('Error updating order in database:', dbError);
      
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
      
      console.warn('Payment URL will be returned despite database error');
    }

    // Возвращаем оба варианта: URL для redirect И параметры для iFrame
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
        paymentUrl,           // URL для обычного redirect (карта)
        iframeParams,         // Параметры для iFrame (СБП с QR-кодом)
        iframeScriptUrl: 'https://auth.robokassa.ru/Merchant/bundle/robokassa_iframe.js',
        orderId,
        invId: numericInvId,
        amount: actualAmount,
        paymentMethod: paymentMethod || 'card',
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
