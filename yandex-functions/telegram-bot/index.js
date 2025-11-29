const https = require('https');

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

async function handler(event) {
  try {
    let data = event;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    }

    if (!data.message) {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    const chatId = data.message.chat.id;
    const text = data.message.text || '';

    console.log('Message:', text);

    const replyMarkup = {
      inline_keyboard: [[{
        text: '🛍️ Открыть магазин',
        web_app: { url: MINI_APP_URL }
      }]]
    };

    let message = '';
    if (text === '/start') {
      message = '🎉 Добро пожаловать в Sweet Delights!\n\nОткройте магазин:';
    } else if (text === '/shop') {
      message = '🛍️ Открыть магазин:';
    } else if (text === '/orders') {
      message = '📦 Ваши заказы:';
    } else {
      message = 'Доступные команды: /start, /shop, /orders';
    }

    await sendTelegramMessage(chatId, message, replyMarkup);

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

module.exports.handler = handler;
