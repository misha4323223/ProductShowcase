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
const RobokassaClient = require("./robokassa-client");
const https = require('https');

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

/**
 * Отправка уведомления в Telegram после успешной оплаты
 */
async function sendTelegramNotification(orderData) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured, skipping notification');
    return;
  }

  const {
    id,
    customerName,
    customerEmail,
    customerPhone,
    items,
    total,
    subtotal,
    discount,
    promoCode,
    shippingAddress,
    createdAt,
    deliveryService,
    deliveryType,
    cdekDeliveryCost,
    deliveryCost,
    deliveryPointName,
    deliveryPointAddress,
    deliveryAddress,
    deliveryCity,
  } = orderData;

  const orderNumber = id.substring(0, 8).toUpperCase();
  const orderDate = new Date(createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `✅ <b>Оплачен заказ #${orderNumber}</b>\n\n`;
  message += `👤 <b>Клиент:</b> ${customerName}\n`;
  message += `📧 <b>Email:</b> ${customerEmail}\n`;
  message += `📱 <b>Телефон:</b> ${customerPhone}\n\n`;
  message += `🛒 <b>Товары:</b>\n`;
  
  items.forEach(item => {
    message += `  • ${item.name} x${item.quantity} - ${item.price * item.quantity}₽\n`;
  });
  
  if (promoCode) {
    message += `\n💸 <b>Промокод:</b> ${promoCode} (-${discount}₽)\n`;
    message += `📊 <b>Подытог:</b> ${subtotal}₽\n`;
  }
  
  const finalDeliveryCost = cdekDeliveryCost || deliveryCost || 0;
  message += `\n💰 <b>Итого товары:</b> ${total - finalDeliveryCost}₽\n`;
  
  if (deliveryService === 'CDEK') {
    message += `\n📦 <b>Доставка:</b> СДЭК`;
    if (deliveryType === 'PICKUP') {
      message += ` (Пункт выдачи)\n`;
      if (deliveryPointName) {
        message += `📍 <b>ПВЗ:</b> ${deliveryPointName}\n`;
      }
      if (deliveryPointAddress) {
        message += `🗺 <b>Адрес ПВЗ:</b> ${deliveryPointAddress}\n`;
      }
    } else if (deliveryType === 'COURIER') {
      message += ` (Доставка до двери)\n`;
      if (deliveryAddress) {
        message += `🏠 <b>Адрес доставки:</b> ${deliveryAddress}\n`;
      } else if (deliveryCity) {
        message += `🏙 <b>Город доставки:</b> ${deliveryCity}\n`;
      }
    }
    if (finalDeliveryCost > 0) {
      message += `💵 <b>Стоимость доставки:</b> ${finalDeliveryCost}₽\n`;
    }
  } else if (deliveryService === 'POST') {
    message += `\n📦 <b>Доставка:</b> Почта России\n`;
    if (shippingAddress) {
      message += `📍 <b>Адрес:</b> ${shippingAddress}\n`;
    }
    if (finalDeliveryCost > 0) {
      message += `💵 <b>Стоимость доставки:</b> ${finalDeliveryCost}₽\n`;
    }
  } else {
    if (shippingAddress) {
      message += `\n📦 <b>Адрес доставки:</b>\n${shippingAddress}\n`;
    }
  }
  
  message += `\n💰 <b>ИТОГО К ОПЛАТЕ:</b> ${total}₽\n`;
  message += `⏰ ${orderDate}`;

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('Telegram notification sent successfully');
          resolve(JSON.parse(data));
        } else {
          console.error(`Telegram API error: ${res.statusCode} - ${data}`);
          reject(new Error(`Telegram API error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('Error sending Telegram notification:', error);
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

exports.handler = async (event) => {
  try {
    console.log('Robokassa callback received:', event);

    // Парсинг данных от Робокассы
    // Может прийти как в body (JSON), так и в виде form-data
    let callbackData;
    
    if (event.body) {
      // ВАЖНО: Проверяем, закодированы ли данные в base64
      let bodyString = event.body;
      if (event.isBase64Encoded) {
        console.log('Decoding base64 body...');
        bodyString = Buffer.from(event.body, 'base64').toString('utf-8');
        console.log('Decoded body:', bodyString);
      }
      
      try {
        // Пробуем распарсить как JSON
        callbackData = JSON.parse(bodyString);
      } catch (e) {
        // Если не JSON, то это form-data
        // Парсим URLSearchParams
        const params = new URLSearchParams(bodyString);
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

    // Нормализуем параметры - Робокасса может присылать в разных регистрах
    // Приводим к стандартному виду с заглавными буквами
    const OutSum = callbackData.OutSum || callbackData.out_summ || callbackData.outSum;
    const InvId = callbackData.InvId || callbackData.inv_id || callbackData.invId;
    const SignatureValue = callbackData.SignatureValue || callbackData.crc;
    
    // Создаем нормализованный объект для parseCallback
    const normalizedData = {
      ...callbackData,
      OutSum,
      InvId,
      SignatureValue
    };

    // Валидация обязательных полей
    if (!OutSum || !InvId || !SignatureValue) {
      console.error('Missing required fields in callback');
      console.error('OutSum:', OutSum, 'InvId:', InvId, 'SignatureValue:', SignatureValue);
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

    // Парсинг и проверка подписи (используем нормализованные данные)
    console.log('Verifying signature with:', {
      OutSum,
      InvId,
      SignatureValue,
      additionalParams: Object.keys(normalizedData).filter(k => k.startsWith('Shp_'))
    });
    
    const parsed = robokassa.parseCallback(normalizedData);

    if (!parsed.isValid) {
      console.error('❌ Invalid signature from Robokassa!');
      console.error('Expected signature verification failed');
      console.error('Parsed result:', parsed);
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

      // Получаем данные заказа для уведомлений
      const order = orderResult.Item;

      // Отправляем email-подтверждение после успешной оплаты
      try {
        
        // Проверяем наличие email у заказа
        if (!order.customerEmail) {
          console.warn(`⚠️ Order ${orderId} has no customerEmail, skipping email notification`);
        } else {
          // Формируем текст способа доставки
          const deliveryMethodText = order.deliveryService === 'CDEK' 
            ? `СДЭК (${order.deliveryType === 'PICKUP' ? 'Пункт выдачи' : 'Доставка до двери'})` 
            : order.deliveryService === 'POST' 
              ? 'Почта России' 
              : 'Не указано';

          // URL API Gateway с fallback
          const apiGatewayBaseUrl = process.env.API_GATEWAY_URL || 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

          // Отправляем email через API Gateway используя https.request
          const emailPayload = JSON.stringify({
            type: 'order_confirmation',
            to: order.customerEmail,
            data: {
              customerName: order.customerName || 'Покупатель',
              orderNumber: orderId.substring(0, 8).toUpperCase(),
              orderDate: new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }),
              items: order.items || [],
              totalAmount: order.total,
              shippingAddress: order.shippingAddress || '',
              phone: order.customerPhone || '',
              deliveryMethod: deliveryMethodText,
              deliveryCost: order.deliveryCost || order.cdekDeliveryCost || 0,
            },
          });

          await new Promise((resolve, reject) => {
            // Правильно строим URL, сохраняя существующие query параметры
            const baseUrl = new URL(apiGatewayBaseUrl);
            baseUrl.pathname = baseUrl.pathname.replace(/\/$/, '') + '/send-email';
            const url = baseUrl;
            const options = {
              hostname: url.hostname,
              port: url.port || 443,
              path: url.pathname + url.search, // Включаем query параметры
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(emailPayload),
              },
            };

            const req = https.request(options, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                // Принимаем все 2xx статусы как успех
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  console.log(`✅ Email confirmation sent to ${order.customerEmail} (status: ${res.statusCode})`);
                  resolve();
                } else {
                  console.warn(`⚠️ Email API returned non-2xx status ${res.statusCode} for ${order.customerEmail}: ${data}`);
                  // Не прерываем выполнение - продолжаем отправку Telegram
                  resolve();
                }
              });
            });

            req.on('error', (error) => {
              console.error('❌ Error sending email request:', error);
              // Не прерываем выполнение - продолжаем отправку Telegram
              resolve();
            });

            req.write(emailPayload);
            req.end();
          });
        }
      } catch (emailError) {
        console.error('⚠️ Error sending email confirmation:', emailError);
        // Не прерываем выполнение - оплата прошла, email не критичен
      }

      // Отправляем уведомление в Telegram после успешной оплаты
      try {
        console.log(`📤 Attempting to send Telegram notification for order ${orderId}...`);
        console.log(`📋 Order data summary:`, {
          id: order.id,
          customerName: order.customerName,
          total: order.total,
          deliveryService: order.deliveryService,
          deliveryType: order.deliveryType,
          itemsCount: order.items?.length
        });
        
        await sendTelegramNotification(order);
        console.log(`✅ Telegram notification sent successfully for order ${orderId}`);
      } catch (telegramError) {
        console.error('❌ Error sending Telegram notification:', telegramError);
        console.error('Telegram error details:', telegramError.message, telegramError.stack);
        // Не прерываем выполнение - оплата прошла, уведомление не критично
      }

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
