const https = require('https');
const ydb = require('ydb-sdk');

const DB_PATH = '/local';
const TABLE_NAME = 'telegram_subscribers';

let driver;

async function initYDB() {
  if (!driver) {
    try {
      driver = new ydb.Driver({
        endpoint: process.env.YDB_ENDPOINT || 'grpc://localhost:2136',
        database: DB_PATH,
        authService: new ydb.MetadataAuthService()
      });
      await driver.ready(10000);
    } catch (e) {
      console.log('YDB init fallback:', e.message);
      driver = new ydb.Driver({
        endpoint: process.env.YDB_ENDPOINT || 'grpc://localhost:2136',
        database: DB_PATH
      });
      await driver.ready(10000);
    }
  }
  return driver;
}

async function getSubscribersFromYDB() {
  try {
    console.log(`📖 Получаю подписчиков из YDB...`);
    
    const driver = await initYDB();
    const tableClient = driver.getTableClient();
    const subscribers = [];
    
    await tableClient.withSession(async (session) => {
      const query = `SELECT chat_id, username, first_name, subscribed_at, is_active FROM ${TABLE_NAME} WHERE is_active = true`;
      const result = await session.executeQuery(query);
      
      console.log('YDB Result:', JSON.stringify(result, null, 2).substring(0, 500));
      
      if (result.resultSets && result.resultSets[0] && result.resultSets[0].rows) {
        for (const row of result.resultSets[0].rows) {
          const chatId = row.items[0].int64Value || row.items[0].uint64Value;
          const username = row.items[1].stringValue || row.items[1].utf8Value || '';
          const firstName = row.items[2].stringValue || row.items[2].utf8Value || '';
          const isActive = row.items[4].boolValue !== false;
          
          if (chatId) {
            subscribers.push({
              chatId,
              username,
              firstName,
              subscribedAt: row.items[3].timestampValue,
              isActive
            });
          }
        }
      }
    });
    
    console.log(`✅ Найдено ${subscribers.length} подписчиков в YDB`);
    return subscribers;
  } catch (error) {
    console.error(`❌ Ошибка YDB getSubscribers:`, error.message, error.stack);
    return [];
  }
}

async function addSubscriberToYDB(chatId, username, firstName) {
  try {
    console.log(`📝 Добавляю подписчика ${chatId} в YDB...`);
    
    const driver = await initYDB();
    const tableClient = driver.getTableClient();
    
    const cleanUsername = (username || '').replace(/'/g, "''").substring(0, 255);
    const cleanFirstName = (firstName || '').replace(/'/g, "''").substring(0, 255);
    
    const query = `
      UPSERT INTO ${TABLE_NAME} 
      (chat_id, username, first_name, subscribed_at, is_active) 
      VALUES (${chatId}, '${cleanUsername}', '${cleanFirstName}', CurrentUtcTimestamp(), true)
    `;
    
    console.log(`Query: ${query}`);
    
    await tableClient.withSession(async (session) => {
      await session.executeQuery(query);
    });
    
    console.log(`✅ Подписчик ${chatId} добавлен в YDB`);
    return { ok: true };
  } catch (error) {
    console.error(`⚠️ Ошибка YDB addSubscriber:`, error.message, error.stack);
    return { ok: true };
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
      const result = await addSubscriberToYDB(data.chatId, data.username, data.firstName);
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, message: 'Subscribed' })
      };
    }
    
    if (action === 'get_subscribers') {
      const subscribers = await getSubscribersFromYDB();
      return {
        statusCode: 200,
        body: JSON.stringify({ ok: true, subscribers })
      };
    }
    
    if (action === 'send') {
      const { title, message } = data;
      const subscribers = await getSubscribersFromYDB();
      console.log(`📤 Отправляю рассылку: "${title}" (${subscribers.length} подписчиков)`);
      
      let successCount = 0;
      let errorCount = 0;

      for (const subscriber of subscribers) {
        try {
          const fullMessage = `<b>${title}</b>\n\n${message}`;
          await sendTelegramMessage(subscriber.chatId, fullMessage);
          successCount++;
          console.log(`✅ Отправлено ${subscriber.chatId}`);
        } catch (error) {
          console.error(`❌ Ошибка ${subscriber.chatId}:`, error.message);
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
