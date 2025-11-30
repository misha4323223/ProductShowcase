const https = require('https');

// Хранилище подписчиков в памяти
const subscribers = new Map();

async function sendTelegramMessage(chatId, message) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('BOT_TOKEN missing');

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  };

  return new Promise((resolve, reject) => {
    const payloadStr = JSON.stringify(payload);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Telegram error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

async function handler(event) {
  try {
    let data = event;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    }

    const action = data.action || 'get_subscribers';

    if (action === 'subscribe') {
      // Добавить подписчика
      const { chatId, username, firstName } = data;
      if (!chatId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'chatId required' }) };
      }

      subscribers.set(chatId, {
        chatId,
        username: username || null,
        firstName: firstName || null,
        subscribedAt: new Date().toISOString(),
        isActive: true
      });

      console.log(`✅ Подписчик ${chatId} добавлен. Всего: ${subscribers.size}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: `Subscriber ${chatId} added`,
          total: subscribers.size
        })
      };
    } else if (action === 'get_subscribers') {
      // Получить список подписчиков
      const subscribersList = Array.from(subscribers.values());
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          subscribers: subscribersList,
          count: subscribersList.length
        })
      };
    } else if (action === 'send') {
      // Отправить рассылку
      const { message, title } = data;
      if (!message) {
        return { statusCode: 400, body: JSON.stringify({ error: 'message required' }) };
      }

      const subscribersList = Array.from(subscribers.values());
      let sent = 0;
      let failed = 0;

      const fullMessage = title ? `<b>${title}</b>\n\n${message}` : message;

      for (const subscriber of subscribersList) {
        try {
          await sendTelegramMessage(subscriber.chatId, fullMessage);
          sent++;
          console.log(`✅ Сообщение отправлено ${subscriber.chatId}`);
        } catch (error) {
          failed++;
          console.error(`❌ Ошибка отправки ${subscriber.chatId}:`, error.message);
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: `Broadcast sent to ${sent} subscribers, ${failed} failed`,
          sent,
          failed,
          total: subscribersList.length
        })
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action' }) };
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

module.exports.handler = handler;
