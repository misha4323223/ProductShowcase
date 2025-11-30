const https = require('https');
const { YandexCloudDatabase } = require('../lib/db-client.js');

async function sendTelegramMessage(chatId, message, replyMarkup, botToken) {
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

    console.log('📥 Запрос получен');

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error('BOT_TOKEN missing');

    const db = new YandexCloudDatabase();

    // WEBHOOK от Telegram (есть message поле)
    if (data.message) {
      console.log('🤖 Webhook от Telegram');
      const chatId = data.message.chat.id;
      const text = data.message.text || '';
      const username = data.message.from.username || null;
      const firstName = data.message.from.first_name || null;

      console.log(`✅ Сообщение: "${text}" от ${chatId}`);

      // Сохранить подписчика в БД
      if (text === '/start') {
        await db.executeQuery(`
          INSERT INTO telegram_subscribers (chat_id, username, first_name, subscribed_at, is_active)
          VALUES ($1, $2, $3, NOW(), true)
          ON CONFLICT (chat_id) 
          DO UPDATE SET is_active = true, updated_at = NOW()
        `, [chatId, username, firstName]);
        console.log(`💾 Подписчик ${chatId} добавлен в БД`);
      }

      let message = '';
      let replyMarkup = null;

      if (text === '/start') {
        message = `🍭 <b>Добро пожаловать в Sweet Delights!</b>\n\nВыберите что вас интересует:`;
        
        replyMarkup = {
          inline_keyboard: [
            [
              { text: '🛍️ Магазин', web_app: { url: 'https://sweetdelights.store' } },
              { text: '📦 Заказы', web_app: { url: 'https://sweetdelights.store/?tab=orders' } }
            ],
            [
              { text: '❤️ Избранное', web_app: { url: 'https://sweetdelights.store/?tab=wishlist' } },
              { text: '🎁 Промо', web_app: { url: 'https://sweetdelights.store/?tab=promos' } }
            ],
            [
              { text: '⚙️ Профиль', web_app: { url: 'https://sweetdelights.store/?tab=account' } }
            ]
          ]
        };
      } else if (text === '/shop') {
        message = '🛍️ <b>Магазин</b>';
        replyMarkup = {
          inline_keyboard: [[
            { text: '🛍️ Открыть', web_app: { url: 'https://sweetdelights.store' } }
          ]]
        };
      } else if (text === '/orders') {
        message = '📦 <b>Мои заказы</b>';
        replyMarkup = {
          inline_keyboard: [[
            { text: '📦 Посмотреть', web_app: { url: 'https://sweetdelights.store/?tab=orders' } }
          ]]
        };
      } else if (text === '/help') {
        message = `<b>📋 Доступные команды:</b>\n\n/start - Главное меню\n/shop - Открыть магазин\n/orders - Мои заказы\n/help - Справка`;
      } else {
        message = `❓ Команда не распознана.\n\nИспользуйте /help для списка команд или нажмите /start`;
      }

      await sendTelegramMessage(chatId, message, replyMarkup, botToken);

      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }

    // API запросы (есть action поле)
    const action = data.action || 'get_subscribers';

    if (action === 'subscribe') {
      const { chatId, username, firstName } = data;
      if (!chatId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'chatId required' }) };
      }

      await db.executeQuery(`
        INSERT INTO telegram_subscribers (chat_id, username, first_name, subscribed_at, is_active)
        VALUES ($1, $2, $3, NOW(), true)
        ON CONFLICT (chat_id) 
        DO UPDATE SET is_active = true, updated_at = NOW()
      `, [chatId, username, firstName]);

      console.log(`✅ Подписчик ${chatId} добавлен`);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: `Subscriber ${chatId} added`
        })
      };
    } else if (action === 'get_subscribers') {
      const subscribers = await db.executeQuery(`
        SELECT chat_id, username, first_name, subscribed_at, is_active
        FROM telegram_subscribers 
        WHERE is_active = true
        ORDER BY subscribed_at DESC
      `);

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          subscribers: subscribers || [],
          count: (subscribers || []).length
        })
      };
    } else if (action === 'send') {
      const { message, title } = data;
      if (!message) {
        return { statusCode: 400, body: JSON.stringify({ error: 'message required' }) };
      }

      const subscribers = await db.executeQuery(`
        SELECT chat_id FROM telegram_subscribers 
        WHERE is_active = true
        ORDER BY subscribed_at DESC
      `);

      if (!subscribers || subscribers.length === 0) {
        return {
          statusCode: 200,
          body: JSON.stringify({ ok: true, sent: 0, failed: 0, total: 0, message: 'No subscribers' })
        };
      }

      const fullMessage = title ? `<b>${title}</b>\n\n${message}` : message;

      let sent = 0;
      let failed = 0;

      for (const subscriber of subscribers) {
        try {
          await sendTelegramMessage(subscriber.chat_id, fullMessage, null, botToken);
          sent++;
          console.log(`✅ Рассылка отправлена ${subscriber.chat_id}`);
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          failed++;
          console.error(`❌ Ошибка рассылки ${subscriber.chat_id}:`, error.message);
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          ok: true,
          message: `Broadcast sent to ${sent} subscribers, ${failed} failed`,
          sent,
          failed,
          total: subscribers.length
        })
      };
    }

    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request' }) };
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

module.exports.handler = handler;
