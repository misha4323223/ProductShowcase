const https = require('https');

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

// Простое хранилище подписчиков в памяти (демо версия)
const subscribers = new Map();

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
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: 'chat_id required' }) 
        };
      }

      subscribers.set(chat_id, { 
        chat_id, 
        username, 
        first_name, 
        subscribed_at: new Date() 
      });

      console.log(`✅ Подписчик ${chat_id} (${first_name || username}) добавлен`);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          ok: true, 
          message: 'Подписка активирована' 
        })
      };
    }

    // ACTION 2: Отправить рассылку
    if (action === 'send') {
      if (!message) {
        return { 
          statusCode: 400, 
          body: JSON.stringify({ error: 'message required' }) 
        };
      }

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        console.error('❌ BOT_TOKEN not configured');
        throw new Error('BOT_TOKEN missing');
      }

      // Получаем всех подписчиков
      const subscriberList = Array.from(subscribers.values());
      
      if (subscriberList.length === 0) {
        console.log('⚠️ Нет подписчиков для рассылки');
        return { 
          statusCode: 200, 
          body: JSON.stringify({ 
            ok: true, 
            sent: 0, 
            failed: 0,
            total: 0,
            message: 'Нет подписчиков' 
          }) 
        };
      }

      const fullMessage = broadcast_title 
        ? `<b>📰 ${broadcast_title}</b>\n\n${message}`
        : message;

      let sent = 0;
      let failed = 0;

      console.log(`📢 Начинаем рассылку ${subscriberList.length} подписчикам...`);

      for (const subscriber of subscriberList) {
        try {
          await sendTelegramMessage(subscriber.chat_id, fullMessage, botToken);
          sent++;
          console.log(`✅ Сообщение отправлено ${subscriber.chat_id}`);
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (err) {
          console.error(`❌ Ошибка отправки ${subscriber.chat_id}:`, err.message);
          failed++;
        }
      }

      console.log(`✅ Рассылка завершена: отправлено ${sent}/${subscriberList.length}, ошибок ${failed}`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: '✅ Рассылка отправлена',
          sent,
          failed,
          total: subscriberList.length
        })
      };
    }

    return { 
      statusCode: 400, 
      body: JSON.stringify({ 
        error: 'action required: "subscribe" or "send"' 
      }) 
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
}

module.exports.handler = handler;
