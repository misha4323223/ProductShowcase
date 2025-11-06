const https = require('https');

/**
 * Отправка сообщения в Telegram через Bot API
 */
async function sendTelegramMessage(message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');
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
    customerEmail,
    customerPhone,
    items,
    total,
    subtotal,
    discount,
    promoCode,
    shippingAddress,
    createdAt,
  } = orderData;

  const orderNumber = id.substring(0, 8).toUpperCase();
  const orderDate = new Date(createdAt).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  let message = `🛍️ <b>Новый заказ #${orderNumber}</b>\n\n`;
  
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
  
  message += `\n💰 <b>Итого:</b> ${total}₽\n`;
  message += `📦 <b>Адрес доставки:</b>\n${shippingAddress}\n\n`;
  message += `⏰ ${orderDate}`;

  return message;
}

/**
 * Cloud Function handler
 */
exports.handler = async (event) => {
  try {
    const requestBody = JSON.parse(event.body || '{}');
    const { orderData } = requestBody;

    if (!orderData) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: "Missing orderData" }),
      };
    }

    const message = formatOrderMessage(orderData);
    await sendTelegramMessage(message);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, message: 'Telegram notification sent' }),
    };
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
