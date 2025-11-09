const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const https = require('https');

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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Отправка уведомления в Telegram (встроено в функцию create-order)
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
    const orderData = JSON.parse(event.body || '{}');
    
    if (!orderData.userId || !orderData.items || !orderData.total) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: "Missing required order fields" }),
      };
    }

    const id = generateId();
    const order = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    // Сохраняем заказ в базу данных
    await docClient.send(new PutCommand({
      TableName: "orders",
      Item: order,
    }));

    // Если использован промокод рулетки, помечаем его как использованный
    if (orderData.promoCode) {
      try {
        const wheelPrizesResult = await docClient.send(new ScanCommand({
          TableName: "wheelPrizes",
        }));
        
        const normalizedPromoCode = orderData.promoCode.trim().toUpperCase();
        const wheelPrize = (wheelPrizesResult.Items || []).find(p => 
          p.promoCode && p.promoCode.trim().toUpperCase() === normalizedPromoCode
        );

        if (wheelPrize && !wheelPrize.used) {
          // Помечаем приз как использованный
          await docClient.send(new UpdateCommand({
            TableName: "wheelPrizes",
            Key: { id: wheelPrize.id },
            UpdateExpression: "SET used = :true, usedAt = :usedAt, orderId = :orderId",
            ExpressionAttributeValues: {
              ":true": true,
              ":usedAt": new Date().toISOString(),
              ":orderId": id
            }
          }));
          console.log(`Wheel prize ${wheelPrize.id} marked as used for order ${id}`);
        }
      } catch (error) {
        console.error('Error marking wheel prize as used:', error);
        // Не прерываем выполнение, если не удалось пометить приз
      }
    }

    // Отправляем уведомление в Telegram (неблокирующая операция)
    sendTelegramNotification(order).catch(error => {
      console.error('Failed to send Telegram notification:', error);
      // Не прерываем выполнение, если Telegram недоступен
    });
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, id, orderId: id }),
    };
  } catch (error) {
    console.error("Error:", error);
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
