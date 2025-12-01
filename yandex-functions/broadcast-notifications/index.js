const https = require('https');
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const TABLE_NAME = "telegram_subscribers";

function createDbClient() {
  const client = new DynamoDBClient({
    region: "ru-central1",
    endpoint: process.env.YDB_ENDPOINT,
    credentials: {
      accessKeyId: process.env.YDB_ACCESS_KEY_ID,
      secretAccessKey: process.env.YDB_SECRET_KEY,
    },
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: false,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });
}

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

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
          reject(new Error(`Telegram error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payloadStr);
    req.end();
  });
}

async function saveSubscriber(docClient, chatId, username, firstName) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      chat_id: String(chatId),
      username: username || null,
      first_name: firstName || null,
      subscribed_at: new Date().toISOString(),
      is_active: true
    }
  });

  await docClient.send(command);
  console.log(`YDB: Подписчик ${chatId} сохранён в базу`);
}

async function getSubscriber(docClient, chatId) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { chat_id: String(chatId) }
  });

  const result = await docClient.send(command);
  return result.Item;
}

async function getAllSubscribers(docClient) {
  const command = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "is_active = :active",
    ExpressionAttributeValues: {
      ":active": true
    }
  });

  const result = await docClient.send(command);
  return result.Items || [];
}

async function unsubscribe(docClient, chatId) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      chat_id: String(chatId),
      is_active: false,
      unsubscribed_at: new Date().toISOString()
    }
  });

  await docClient.send(command);
  console.log(`YDB: Подписчик ${chatId} отписан`);
}

async function handler(event) {
  try {
    let data = event;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    }

    console.log('Запрос получен');

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN не настроен');

    const docClient = createDbClient();

    if (data.message) {
      console.log('Webhook от Telegram');
      const chatId = data.message.chat.id;
      const text = data.message.text || '';
      const username = data.message.from.username || null;
      const firstName = data.message.from.first_name || null;

      console.log(`Сообщение: "${text}" от ${chatId}`);

      let message = '';
      let replyMarkup = null;

      if (text === '/start') {
        try {
          await saveSubscriber(docClient, chatId, username, firstName);
          console.log(`Подписчик ${chatId} сохранён в YDB`);
        } catch (dbError) {
          console.error(`Ошибка сохранения в YDB: ${dbError.message}`);
        }

        message = `<b>Добро пожаловать в Sweet Delights!</b>\n\nВыберите что вас интересует:`;
        
        replyMarkup = {
          inline_keyboard: [
            [
              { text: 'Магазин', web_app: { url: 'https://sweetdelights.store' } },
              { text: 'Заказы', web_app: { url: 'https://sweetdelights.store/?tab=orders' } }
            ],
            [
              { text: 'Избранное', web_app: { url: 'https://sweetdelights.store/?tab=wishlist' } },
              { text: 'Промо', web_app: { url: 'https://sweetdelights.store/?tab=promos' } }
            ],
            [
              { text: 'Профиль', web_app: { url: 'https://sweetdelights.store/?tab=account' } }
            ]
          ]
        };
      } else if (text === '/shop') {
        message = '<b>Магазин</b>';
        replyMarkup = {
          inline_keyboard: [[
            { text: 'Открыть', web_app: { url: 'https://sweetdelights.store' } }
          ]]
        };
      } else if (text === '/orders') {
        message = '<b>Мои заказы</b>';
        replyMarkup = {
          inline_keyboard: [[
            { text: 'Посмотреть', web_app: { url: 'https://sweetdelights.store/?tab=orders' } }
          ]]
        };
      } else if (text === '/unsubscribe') {
        try {
          await unsubscribe(docClient, chatId);
          message = 'Вы отписались от уведомлений.';
        } catch (dbError) {
          console.error(`Ошибка отписки в YDB: ${dbError.message}`);
          message = 'Ошибка отписки. Попробуйте ещё раз.';
        }
      } else if (text === '/help') {
        message = `<b>Доступные команды:</b>\n\n/start - Главное меню\n/shop - Открыть магазин\n/orders - Мои заказы\n/unsubscribe - Отписаться от рассылки\n/help - Справка`;
      } else {
        message = `Команда не распознана.\n\nИспользуйте /help для списка команд или нажмите /start`;
      }

      await sendTelegramMessage(chatId, message, replyMarkup, botToken);

      return createResponse(200, { ok: true });
    }

    const action = data.action || 'get_subscribers';

    if (action === 'subscribe') {
      const { chatId, username, firstName } = data;
      if (!chatId) {
        return createResponse(400, { error: 'chatId required' });
      }

      await saveSubscriber(docClient, chatId, username, firstName);

      return createResponse(200, {
        ok: true,
        message: `Подписчик ${chatId} добавлен в базу`
      });

    } else if (action === 'get_subscribers') {
      const subscribers = await getAllSubscribers(docClient);
      
      return createResponse(200, {
        ok: true,
        subscribers: subscribers,
        count: subscribers.length
      });

    } else if (action === 'send') {
      const { message, title } = data;
      if (!message) {
        return createResponse(400, { error: 'message required' });
      }

      const subscribers = await getAllSubscribers(docClient);

      if (!subscribers || subscribers.length === 0) {
        return createResponse(200, {
          ok: true,
          sent: 0,
          failed: 0,
          total: 0,
          message: 'Нет подписчиков в базе'
        });
      }

      const fullMessage = title ? `<b>${title}</b>\n\n${message}` : message;

      let sent = 0;
      let failed = 0;

      for (const subscriber of subscribers) {
        try {
          await sendTelegramMessage(subscriber.chat_id, fullMessage, null, botToken);
          sent++;
          console.log(`Рассылка отправлена: ${subscriber.chat_id}`);
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          failed++;
          console.error(`Ошибка рассылки для ${subscriber.chat_id}: ${error.message}`);
          
          if (error.message.includes('403') || error.message.includes('blocked')) {
            try {
              await unsubscribe(docClient, subscriber.chat_id);
              console.log(`Автоотписка заблокировавшего: ${subscriber.chat_id}`);
            } catch (e) {
              console.error(`Ошибка автоотписки: ${e.message}`);
            }
          }
        }
      }

      return createResponse(200, {
        ok: true,
        message: `Рассылка отправлена ${sent} подписчикам, ${failed} ошибок`,
        sent,
        failed,
        total: subscribers.length
      });

    } else if (action === 'unsubscribe') {
      const { chatId } = data;
      if (!chatId) {
        return createResponse(400, { error: 'chatId required' });
      }

      await unsubscribe(docClient, chatId);

      return createResponse(200, {
        ok: true,
        message: `Подписчик ${chatId} отписан`
      });
    }

    return createResponse(400, { error: 'Неверное действие' });

  } catch (error) {
    console.error('Ошибка:', error.message);
    return createResponse(500, { error: error.message });
  }
}

module.exports.handler = handler;
