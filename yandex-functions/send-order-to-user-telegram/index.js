const https = require('https');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

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

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Отправка сообщения в Telegram через Bot API
 */
async function sendTelegramMessage(chatId, message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

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

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Форматирование данных заказа в красивое сообщение для Telegram
 */
function formatOrderMessage(orderData) {
  const {
    id,
    customerName,
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
  } = orderData;

  const orderNumber = id.substring(0, 8).toUpperCase();
  const orderDate = new Date(createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `🛍️ <b>Ваш заказ #${orderNumber}</b>\n\n`;
  
  message += `👤 <b>Получатель:</b> ${customerName}\n\n`;
  
  message += `🛒 <b>Товары:</b>\n`;
  items.forEach(item => {
    message += `  • ${item.name} x${item.quantity} = ${item.price * item.quantity}₽\n`;
  });
  
  if (promoCode) {
    message += `\n💸 <b>Промокод:</b> ${promoCode}\n`;
    message += `📊 <b>Подытог:</b> ${subtotal}₽\n`;
    message += `✂️ <b>Скидка:</b> -${discount}₽\n`;
  }
  
  message += `\n💰 <b>Итого:</b> <u>${total}₽</u>\n\n`;
  
  // Информация о доставке
  if (deliveryService === 'CDEK') {
    message += `🚚 <b>Доставка:</b> СДЭК`;
    if (deliveryType === 'PICKUP') {
      message += ` (Пункт выдачи)`;
      if (deliveryPointName) {
        message += `\n📍 <b>Пункт выдачи:</b> ${deliveryPointName}`;
      }
    } else if (deliveryType === 'DOOR') {
      message += ` (Курьер до двери)`;
    }
    if (cdekDeliveryCost) {
      message += `\n💵 <b>Доставка:</b> ${cdekDeliveryCost}₽`;
    }
  } else if (deliveryService === 'POST') {
    message += `🚚 <b>Доставка:</b> Почта России`;
    if (deliveryCost) {
      message += `\n💵 <b>Доставка:</b> ${deliveryCost}₽`;
    }
  }
  
  message += `\n\n📦 <b>Адрес доставки:</b>\n<code>${shippingAddress}</code>\n\n`;
  message += `⏰ <b>Время заказа:</b> ${orderDate}\n\n`;
  message += `✅ <b>Спасибо за покупку в Sweet Delights!</b> 🍰`;

  return message;
}

exports.handler = async (event) => {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { orderData } = requestBody;

    if (!orderData) {
      return createResponse(400, { error: "Missing orderData" });
    }

    const customerEmail = orderData.customerEmail?.toLowerCase().trim();
    if (!customerEmail) {
      return createResponse(400, { error: "Missing customerEmail in orderData" });
    }

    // Получаем данные пользователя из таблицы users для поиска telegramId
    const getCommand = new GetCommand({
      TableName: "users",
      Key: { email: customerEmail }
    });

    const result = await docClient.send(getCommand);
    const user = result.Item;

    // Если нет telegramId - просто пропускаем отправку (не ошибка)
    if (!user || !user.telegramId) {
      console.log(`⏭️  User ${customerEmail} has no Telegram ID linked, skipping notification`);
      return createResponse(200, { 
        success: true, 
        message: "User has no Telegram ID, notification skipped",
        notificationSent: false
      });
    }

    const telegramId = user.telegramId;
    console.log(`📱 Sending order notification to Telegram ID: ${telegramId}`);

    // Форматируем сообщение
    const message = formatOrderMessage(orderData);

    // Отправляем сообщение пользователю в Telegram
    await sendTelegramMessage(telegramId, message);

    console.log(`✅ Order notification sent to Telegram for: ${customerEmail}`);

    return createResponse(200, {
      success: true,
      message: "Order notification sent to user's Telegram",
      notificationSent: true,
      telegramId: telegramId,
      orderId: orderData.id
    });

  } catch (error) {
    console.error("Error in send-order-to-user-telegram:", error);
    
    // Если ошибка в отправке в Telegram - логируем, но не падаем
    if (error.message.includes('Telegram API')) {
      console.warn("⚠️  Telegram API error, but order was created successfully");
      return createResponse(200, {
        success: true,
        message: "Order created, but Telegram notification failed",
        telegramError: error.message,
        notificationSent: false
      });
    }

    return createResponse(500, { 
      error: "Error sending notification",
      details: error.message 
    });
  }
};
