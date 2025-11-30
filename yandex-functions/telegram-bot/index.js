const https = require('https');

const MINI_APP_URL = 'https://sweetdelights.store';

async function subscribeUser(chatId, username, firstName) {
  try {
    console.log(`💾 Отправляю подписку ${chatId} на broadcast-notifications...`);
    
    const payload = {
      action: 'subscribe',
      chatId,
      username: username || null,
      firstName: firstName || null
    };

    return new Promise((resolve, reject) => {
      const payloadStr = JSON.stringify(payload);
      const options = {
        hostname: 'd4efkrvud5o73t4cskgk.functions.yandexcloud.net',
        path: '/broadcast-notifications',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payloadStr)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`✅ Подписка сохранена`);
            resolve(result);
          } catch (e) {
            resolve({ ok: true });
          }
        });
      });

      req.on('error', (err) => {
        console.error(`⚠️ Ошибка отправки:`, err.message);
        resolve({ ok: true });
      });
      
      req.write(payloadStr);
      req.end();
    });
  } catch (error) {
    console.error(`⚠️ Ошибка:`, error.message);
    return { ok: true };
  }
}

async function sendTelegramMessage(chatId, message, replyMarkup) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('BOT_TOKEN missing');

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  };

  if (replyMarkup) payload.reply_markup = replyMarkup;

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
    console.log('📥 Получен запрос от Telegram');
    
    let data = event;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    }

    if (!data.message) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const chatId = data.message.chat.id;
    const text = data.message.text || '';

    console.log(`✅ Сообщение: "${text}" от ${chatId}`);

    // Сохраняем подписчика
    if (text === '/start') {
      await subscribeUser(chatId, data.message.from.username, data.message.from.first_name);
    }

    let message = '';
    let replyMarkup = null;

    if (text === '/start') {
      message = `🍭 <b>Добро пожаловать в Sweet Delights!</b>\n\nВыберите что вас интересует:`;
      
      replyMarkup = {
        inline_keyboard: [
          [
            { text: '🛍️ Магазин', web_app: { url: MINI_APP_URL } },
            { text: '📦 Заказы', web_app: { url: `${MINI_APP_URL}/?tab=orders` } }
          ],
          [
            { text: '❤️ Избранное', web_app: { url: `${MINI_APP_URL}/?tab=wishlist` } },
            { text: '🎁 Промо', web_app: { url: `${MINI_APP_URL}/?tab=promos` } }
          ],
          [
            { text: '⚙️ Профиль', web_app: { url: `${MINI_APP_URL}/?tab=account` } }
          ]
        ]
      };
    } else if (text === '/shop') {
      message = '🛍️ <b>Магазин</b>';
      replyMarkup = {
        inline_keyboard: [[
          { text: '🛍️ Открыть', web_app: { url: MINI_APP_URL } }
        ]]
      };
    } else if (text === '/orders') {
      message = '📦 <b>Мои заказы</b>';
      replyMarkup = {
        inline_keyboard: [[
          { text: '📦 Посмотреть', web_app: { url: `${MINI_APP_URL}/?tab=orders` } }
        ]]
      };
    } else if (text === '/help') {
      message = `<b>📋 Доступные команды:</b>\n\n/start - Главное меню\n/shop - Открыть магазин\n/orders - Мои заказы\n/help - Справка`;
    } else {
      message = `❓ Команда не распознана.\n\nИспользуйте /help для списка команд или нажмите /start`;
    }

    await sendTelegramMessage(chatId, message, replyMarkup);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

module.exports.handler = handler;
