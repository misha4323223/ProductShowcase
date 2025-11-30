const https = require('https');

// Хранилище подписчиков в памяти
const subscribers = new Map();

const MINI_APP_URL = 'https://sweetdelights.store';

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

// Обработка Telegram update (webhook)
async function handleTelegramUpdate(update) {
  if (!update.message) return;

  const chatId = update.message.chat.id;
  const text = update.message.text || '';
  const username = update.message.from.username || null;
  const firstName = update.message.from.first_name || null;

  console.log(`📥 Telegram: "${text}" от ${chatId}`);

  if (text === '/start') {
    // Добавить в подписчики
    subscribers.set(chatId, {
      chatId,
      username,
      firstName,
      subscribedAt: new Date().toISOString(),
      isActive: true
    });
    console.log(`✅ Подписчик ${chatId} добавлен. Всего: ${subscribers.size}`);

    // Отправить меню
    const message = `🍭 <b>Добро пожаловать в Sweet Delights!</b>\n\nВыберите что вас интересует:`;
    const replyMarkup = {
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
    await sendTelegramMessage(chatId, message, replyMarkup);
  } else if (text === '/shop') {
    const message = '🛍️ <b>Магазин</b>';
    const replyMarkup = {
      inline_keyboard: [[
        { text: '🛍️ Открыть', web_app: { url: MINI_APP_URL } }
      ]]
    };
    await sendTelegramMessage(chatId, message, replyMarkup);
  } else if (text === '/orders') {
    const message = '📦 <b>Мои заказы</b>';
    const replyMarkup = {
      inline_keyboard: [[
        { text: '📦 Посмотреть', web_app: { url: `${MINI_APP_URL}/?tab=orders` } }
      ]]
    };
    await sendTelegramMessage(chatId, message, replyMarkup);
  } else if (text === '/help') {
    const message = `<b>📋 Доступные команды:</b>\n\n/start - Главное меню\n/shop - Открыть магазин\n/orders - Мои заказы\n/help - Справка`;
    await sendTelegramMessage(chatId, message);
  } else {
    const message = `❓ Команда не распознана.\n\nИспользуйте /help для списка команд или нажмите /start`;
    await sendTelegramMessage(chatId, message);
  }
}

async function handler(event) {
  try {
    let data = event;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    }

    // Если это Telegram update (webhook)
    if (data.message) {
      console.log('📥 Получен webhook от Telegram');
      await handleTelegramUpdate(data);
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // Если это API запрос (action-based)
    const action = data.action || 'get_subscribers';

    if (action === 'get_subscribers') {
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
          console.log(`✅ Рассылка отправлена ${subscriber.chatId}`);
        } catch (error) {
          failed++;
          console.error(`❌ Ошибка рассылки ${subscriber.chatId}:`, error.message);
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
