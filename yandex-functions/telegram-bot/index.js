const https = require('https');

const MINI_APP_URL = 'https://sweetdelights.store/telegram';

async function sendTelegramMessage(chatId, message, replyMarkup) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN not configured');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
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
        'Content-Length': Buffer.byteLength(payloadStr)
      }
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
          reject(new Error(`Telegram API error: ${res.statusCode}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

async function handleStartCommand(chatId) {
  const message = `🎉 <b>Добро пожаловать в Sweet Delights!</b>\n\nВыберите действие:`;
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🛍️ Открыть магазин',
          web_app: { url: MINI_APP_URL }
        }
      ]
    ]
  };
  await sendTelegramMessage(chatId, message, replyMarkup);
}

async function handleShopCommand(chatId) {
  const message = `🛍️ <b>Sweet Delights Магазин</b>\n\nОткройте мини-приложение:`;
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🛍️ Открыть магазин',
          web_app: { url: MINI_APP_URL }
        }
      ]
    ]
  };
  await sendTelegramMessage(chatId, message, replyMarkup);
}

async function handleOrdersCommand(chatId) {
  const message = `📦 <b>Ваши заказы</b>\n\nОткройте мини-приложение:`;
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '📦 Открыть заказы',
          web_app: { url: MINI_APP_URL }
        }
      ]
    ]
  };
  await sendTelegramMessage(chatId, message, replyMarkup);
}

async function handleMessage(chatId, text) {
  const message = `👋 Привет!\n\nДоступные команды:\n/start - Начать\n/shop - Магазин\n/orders - Заказы`;
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '🛍️ Открыть магазин',
          web_app: { url: MINI_APP_URL }
        }
      ]
    ]
  };
  await sendTelegramMessage(chatId, message, replyMarkup);
}

async function handler(event) {
  try {
    let webhookData = event;
    if (typeof event.body === 'string') {
      webhookData = JSON.parse(event.body);
    }

    console.log('📨 Webhook received');

    if (webhookData.message) {
      const msg = webhookData.message;
      const chatId = msg.chat.id;
      const text = msg.text || '';

      console.log(`📩 Message: ${text}`);

      if (text === '/start') {
        await handleStartCommand(chatId);
      } else if (text === '/shop') {
        await handleShopCommand(chatId);
      } else if (text === '/orders') {
        await handleOrdersCommand(chatId);
      } else if (text.length > 0) {
        await handleMessage(chatId, text);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
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
