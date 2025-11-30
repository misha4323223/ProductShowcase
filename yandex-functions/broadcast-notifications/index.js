const https = require('https');
const { Client } = require('ydb-sdk');

const YDB_CONNECTION_STRING = process.env.YDB_CONNECTION_STRING || 'grpc://localhost:2136?database=/local';
const ydbClient = new Client({ connectionString: YDB_CONNECTION_STRING });

async function getSubscribers() {
  try {
    console.log('📖 Получаю подписчиков из YDB...');
    
    const query = `SELECT chat_id, username, first_name, subscribed_at, is_active FROM telegram_subscribers WHERE is_active = true;`;
    
    const subscribers = [];
    await ydbClient.tableClient.withSession(async (session) => {
      const result = await session.executeQuery(query);
      for (const row of result.rows) {
        subscribers.push({
          chatId: row.get('chat_id'),
          username: row.get('username'),
          firstName: row.get('first_name'),
          subscribedAt: row.get('subscribed_at'),
          isActive: row.get('is_active')
        });
      }
    });
    
    console.log(`✅ Найдено ${subscribers.length} подписчиков`);
    return subscribers;
  } catch (error) {
    console.error(`❌ Ошибка получения подписчиков:`, error.message);
    return [];
  }
}

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
      console.log(`✅ Подписка: ${data.chat_id}`);
      return { statusCode: 200, body: JSON.stringify({ ok: true, message: 'Subscribed' }) };
    }
    
    if (action === 'get_subscribers') {
      console.log(`📋 Получение списка подписчиков`);
      const subscribers = await getSubscribers();
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, subscribers })
      };
    }
    
    if (action === 'send') {
      const { title, message } = data;
      console.log(`📤 Отправляю рассылку: "${title}"`);
      
      const subscribers = await getSubscribers();
      let successCount = 0;
      let errorCount = 0;

      for (const subscriber of subscribers) {
        try {
          const fullMessage = `<b>${title}</b>\n\n${message}`;
          await sendTelegramMessage(subscriber.chatId, fullMessage);
          successCount++;
        } catch (error) {
          console.error(`❌ Ошибка отправки ${subscriber.chatId}:`, error.message);
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
