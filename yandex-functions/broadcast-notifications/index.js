const https = require('https');
const { Client } = require('ydb-sdk');

const YDB_ENDPOINT = process.env.YDB_ENDPOINT || 'grpc://localhost:2136';

let ydbClient;

async function initYDB() {
  if (!ydbClient) {
    ydbClient = new Client({
      endpoint: YDB_ENDPOINT,
      database: '/local',
      authService: undefined
    });
    await ydbClient.ready();
  }
  return ydbClient;
}

async function getSubscribers() {
  try {
    console.log('📖 Получаю подписчиков из YDB...');
    
    const client = await initYDB();
    const session = await client.getSession();
    
    const query = `
      SELECT chat_id, username, first_name, subscribed_at, is_active 
      FROM telegram_subscribers 
      WHERE is_active = true
    `;
    
    const result = await session.executeQuery(query);
    const subscribers = [];
    
    for (const row of result.resultSets[0].rows) {
      subscribers.push({
        chatId: row.items[0].int64Value,
        username: row.items[1].stringValue,
        firstName: row.items[2].stringValue,
        subscribedAt: row.items[3].timestampValue,
        isActive: row.items[4].boolValue
      });
    }
    
    console.log(`✅ Найдено ${subscribers.length} подписчиков`);
    return subscribers;
  } catch (error) {
    console.error(`❌ Ошибка YDB:`, error.message);
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
