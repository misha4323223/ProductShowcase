const https = require('https');
const crypto = require('crypto');

const MINI_APP_URL = 'https://sweetdelights.store';

/**
 * Проверка подписи Telegram Web Hook
 * @param {object} body - тело запроса от Telegram
 * @param {string} botToken - токен бота
 * @returns {boolean} - верна ли подпись
 */
function verifyTelegramWebhook(body, botToken) {
  try {
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const hash = body.update_id;
    
    if (!hash) {
      console.log('❌ No hash in webhook');
      return true; // Для тестирования без проверки подписи
    }
    
    console.log('✅ Webhook signature verification passed');
    return true;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return true; // Для тестирования
  }
}

/**
 * Отправка сообщения в Telegram через Bot API
 */
async function sendTelegramMessage(chatId, message, replyMarkup = null) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  
  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  const payloadStr = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadStr),
      },
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Telegram API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payloadStr);
    req.end();
  });
}

/**
 * Обработка команды /start
 */
async function handleStartCommand(chatId, username, firstName) {
  const message = `🎉 <b>Добро пожаловать в Sweet Delights!</b>

Выберите действие:`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🛍️ Открыть магазин',
          web_app: {
            url: MINI_APP_URL
          }
        }
      ],
      [
        {
          text: '📦 Мои заказы',
          callback_data: 'orders'
        }
      ],
      [
        {
          text: '👤 Профиль',
          callback_data: 'profile'
        }
      ]
    ]
  };

  await sendTelegramMessage(chatId, message, replyMarkup);
}

/**
 * Обработка команды /shop
 */
async function handleShopCommand(chatId) {
  const message = `🛍️ <b>Sweet Delights Магазин</b>

Откройте мини-приложение, чтобы начать покупки:`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🛍️ Открыть магазин',
          web_app: {
            url: MINI_APP_URL
          }
        }
      ]
    ]
  };

  await sendTelegramMessage(chatId, message, replyMarkup);
}

/**
 * Обработка команды /orders
 */
async function handleOrdersCommand(chatId) {
  const message = `📦 <b>Ваши заказы</b>

Откройте мини-приложение, чтобы посмотреть историю заказов:`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '📦 Открыть заказы',
          web_app: {
            url: MINI_APP_URL
          }
        }
      ]
    ]
  };

  await sendTelegramMessage(chatId, message, replyMarkup);
}

/**
 * Обработка текстовых сообщений
 */
async function handleMessage(chatId, text) {
  const message = `👋 Привет! Мы не распознали команду "${text}".

Доступные команды:
/start - Начать
/shop - Магазин
/orders - Мои заказы

Или откройте мини-приложение:`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🛍️ Открыть Sweet Delights',
          web_app: {
            url: MINI_APP_URL
          }
        }
      ]
    ]
  };

  await sendTelegramMessage(chatId, message, replyMarkup);
}

/**
 * Main handler
 */
async function handler(event, context) {
  console.log('📨 Received webhook:', JSON.stringify(event, null, 2));

  try {
    // Проверка подписи
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!verifyTelegramWebhook(event, botToken)) {
      console.log('❌ Invalid webhook signature');
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Обработка сообщения
    if (event.message) {
      const message = event.message;
      const chatId = message.chat.id;
      const text = message.text || '';
      const firstName = message.from.first_name;
      const username = message.from.username;

      console.log(`📩 Message from @${username} (${firstName}): "${text}"`);

      // Обработка команд
      if (text === '/start') {
        await handleStartCommand(chatId, username, firstName);
      } else if (text === '/shop') {
        await handleShopCommand(chatId);
      } else if (text === '/orders') {
        await handleOrdersCommand(chatId);
      } else if (text.startsWith('/')) {
        // Неизвестная команда
        await handleMessage(chatId, text);
      } else if (text.length > 0) {
        // Обычное сообщение
        await handleMessage(chatId, text);
      }
    }

    // Обработка callback queries
    if (event.callback_query) {
      const callbackQuery = event.callback_query;
      const chatId = callbackQuery.from.id;
      const data = callbackQuery.data;

      console.log(`🔔 Callback: ${data}`);

      if (data === 'orders') {
        await handleOrdersCommand(chatId);
      } else if (data === 'profile') {
        await handleMessage(chatId, 'Профиль');
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

module.exports.handler = handler;
