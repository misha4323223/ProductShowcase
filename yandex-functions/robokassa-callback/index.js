/**
 * Cloud Function: robokassa-callback
 * 
 * Назначение: Обработка уведомлений от Робокассы о подтверждении оплаты (Result URL)
 * 
 * Входные данные (POST от Робокассы):
 * {
 *   "OutSum": "5000.00",
 *   "InvId": "1763214567890123",      // ЧИСЛОВОЙ идентификатор счета
 *   "SignatureValue": "A1B2C3D4...",
 *   "Shp_OrderId": "mi0c08v2wevj..."  // Реальный ID заказа из YDB
 * }
 * 
 * Выходные данные (для Робокассы):
 * "OK{InvId}"
 * 
 * ⚠️ ВАЖНО: 
 * - Робокасса ожидает ответ СТРОГО в формате "OK{InvId}"
 * - InvId теперь числовой (timestamp-based), а реальный orderId передается в Shp_OrderId
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
    console.log('Robokassa callback received:', event);

    // Парсинг данных от Робокассы
    // Может прийти как в body (JSON), так и в виде form-data
    let callbackData;
    
    if (event.body) {
      try {
        // Пробуем распарсить как JSON
        callbackData = JSON.parse(event.body);
      } catch (e) {
        // Если не JSON, то это form-data
        // Парсим URLSearchParams
        const params = new URLSearchParams(event.body);
        callbackData = {};
        for (const [key, value] of params.entries()) {
          callbackData[key] = value;
        }
      }
    } else if (event.queryStringParameters) {
      // Данные пришли в query params
      callbackData = event.queryStringParameters;
    } else {
      console.error('No callback data found in request');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Bad Request: No data',
      };
    }

    console.log('Parsed callback data:', callbackData);

    const { OutSum, InvId, SignatureValue } = callbackData;

    // Валидация обязательных полей
    if (!OutSum || !InvId || !SignatureValue) {
      console.error('Missing required fields in callback');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Bad Request: Missing required fields',
      };
    }

    // Получение настроек Робокассы
    const merchantLogin = process.env.ROBOKASSA_MERCHANT_LOGIN;
    const password1 = process.env.ROBOKASSA_PASSWORD_1;
    const password2 = process.env.ROBOKASSA_PASSWORD_2;
    const hashAlgorithm = process.env.ROBOKASSA_HASH_ALGORITHM || 'sha256';
    const isTest = process.env.ROBOKASSA_TEST_MODE === 'true';

    if (!merchantLogin || !password1 || !password2) {
      console.error('Missing Robokassa credentials');
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Internal Server Error: Configuration error',
      };
    }

    // Инициализация клиента Робокассы
    const robokassa = new RobokassaClient(merchantLogin, password1, password2, {
      isTest,
      hashAlgorithm
    });

    // Парсинг и проверка подписи
    const parsed = robokassa.parseCallback(callbackData);

    if (!parsed.isValid) {
      console.error('Invalid signature from Robokassa!');
      console.error('Expected signature verification failed');
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'text/plain' },
        body: 'Bad Request: Invalid signature',
      };
    }

    console.log('✅ Signature verified successfully');

    // Извлекаем orderId из дополнительных параметров
    // ВАЖНО: InvId теперь числовой (для Robokassa), реальный orderId в Shp_OrderId
    const orderId = parsed.additionalParams.Shp_OrderId || InvId;
    
    console.log(`Processing payment: InvId=${InvId}, OrderId=${orderId}`);

    // Обновляем заказ в базе данных
    try {
      // Сначала получаем текущий заказ
      const orderResult = await docClient.send(new GetCommand({
        TableName: "orders",
        Key: { id: orderId }
      }));

      if (!orderResult.Item) {
        console.error(`Order ${orderId} not found in database`);
        // Все равно возвращаем OK, чтобы Робокасса не повторяла запрос
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'text/plain' },
          body: robokassa.generateResultResponse(InvId),
        };
      }

      // Обновляем статус заказа
      await docClient.send(new UpdateCommand({
        TableName: "orders",
        Key: { id: orderId },
        UpdateExpression: `
          SET paymentStatus = :paymentStatus,
              #orderStatus = :orderStatus,
              robokassaSignatureValue = :signature,
              paidAt = :paidAt
        `,
        ExpressionAttributeNames: {
          "#orderStatus": "status"
        },
        ExpressionAttributeValues: {
          ":paymentStatus": "paid",
          ":orderStatus": "processing", // Меняем статус заказа на "в обработке"
          ":signature": SignatureValue,
          ":paidAt": new Date().toISOString()
        }
      }));

      console.log(`✅ Order ${orderId} marked as PAID`);

      // Здесь можно добавить отправку уведомления в Telegram
      // или email-уведомление о подтверждении оплаты

    } catch (dbError) {
      console.error('Error updating order in database:', dbError);
      // Все равно возвращаем OK, чтобы Робокасса не повторяла запрос
      // Оплата прошла, подпись валидна - это главное
    }

    // Возвращаем ОБЯЗАТЕЛЬНЫЙ формат ответа для Робокассы: "OK{InvId}"
    const response = robokassa.generateResultResponse(InvId);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*'
      },
      body: response,
    };

  } catch (error) {
    console.error("Error in robokassa-callback:", error);
    
    // Даже при ошибке пытаемся вернуть корректный ответ
    // чтобы Робокасса не повторяла запрос бесконечно
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Internal Server Error',
    };
  }
};
