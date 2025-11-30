const https = require('https');
const { YandexCloudDatabase } = require('../lib/db-client.js');

async function sendTelegramMessage(chatId, message, botToken) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = JSON.stringify({
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`Telegram error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function handler(event) {
  try {
    let data = event;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    }

    const { action, chat_id, username, first_name, message, broadcast_title } = data;

    // ACTION 1: Подписать пользователя
    if (action === 'subscribe') {
      if (!chat_id) {
        return { statusCode: 400, body: JSON.stringify({ error: 'chat_id required' }) };
      }

      const db = new YandexCloudDatabase();
      await db.executeQuery(`
        INSERT INTO telegram_subscribers (chat_id, username, first_name, subscribed_at, is_active)
        VALUES ($1, $2, $3, NOW(), true)
        ON CONFLICT (chat_id) 
        DO UPDATE SET is_active = true, updated_at = NOW()
      `, [chat_id, username || null, first_name || null]);

      console.log(`✅ Подписчик ${chat_id} добавлен`);

      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, message: 'Подписка активирована' })
      };
    }

    // ACTION 2: Отправить рассылку
    if (action === 'send') {
      if (!message) {
        return { statusCode: 400, body: JSON.stringify({ error: 'message required' }) };
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) throw new Error('BOT_TOKEN missing');

      const db = new YandexCloudDatabase();
      const subscribers = await db.executeQuery(`
        SELECT chat_id FROM telegram_subscribers 
        WHERE is_active = true
        ORDER BY subscribed_at DESC
      `);

      if (!subscribers || subscribers.length === 0) {
        return { 
          statusCode: 200, 
          body: JSON.stringify({ ok: true, sent: 0, message: 'No subscribers' }) 
        };
      }

      const fullMessage = broadcast_title 
        ? `<b>📰 ${broadcast_title}</b>\n\n${message}`
        : message;

      let sent = 0;
      let failed = 0;

      for (const subscriber of subscribers) {
        try {
          await sendTelegramMessage(subscriber.chat_id, fullMessage, botToken);
          sent++;
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
          console.error(`Failed to send to ${subscriber.chat_id}:`, err.message);
          failed++;
        }
      }

      console.log(`✅ Рассылка завершена: отправлено ${sent}, ошибок ${failed}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: '✅ Рассылка отправлена',
          sent,
          failed,
          total: subscribers.length
        })
      };
    }

    return { 
      statusCode: 400, 
      body: JSON.stringify({ error: 'action required: "subscribe" or "send"' }) 
    };
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

module.exports.handler = handler;
