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

    const action = data.action;
    
    if (action === 'subscribe') {
      console.log(`📝 Добавляю подписчика ${data.chatId}`);
      
      subscribers.set(data.chatId, {
        chatId: data.chatId,
        username: data.username,
        firstName: data.firstName,
        subscribedAt: new Date().toISOString(),
        isActive: true
      });
      
      console.log(`✅ Подписчик добавлен. Всего: ${subscribers.size}`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, message: 'Subscribed' })
      };
    }
    
    if (action === 'get_subscribers') {
      console.log(`📋 Получение списка подписчиков (${subscribers.size})`);
      const subsList = Array.from(subscribers.values());
      
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, subscribers: subsList })
      };
    }
    
    if (action === 'send') {
      const { title, message } = data;
      console.log(`📤 Отправляю рассылку: "${title}" (${subscribers.size} подписчиков)`);
      
      let successCount = 0;
      let errorCount = 0;

      for (const [chatId, subscriber] of subscribers.entries()) {
        try {
          const fullMessage = `<b>${title}</b>\n\n${message}`;
          await sendTelegramMessage(chatId, fullMessage);
          successCount++;
          console.log(`✅ Отправлено ${chatId}`);
        } catch (error) {
          console.error(`❌ Ошибка ${chatId}:`, error.message);
          errorCount++;
        }
      }

      console.log(`✅ Рассылка завершена: ${successCount} успешно, ${errorCount} ошибок`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: `Отправлено ${successCount} сообщений, ошибок: ${errorCount}`
        })
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Unknown action' }) };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

module.exports.handler = handler;
