const https = require('https');

async function setMyCommands(botToken) {
  const commands = [
    {
      command: 'start',
      description: '🍭 Главное меню'
    },
    {
      command: 'shop',
      description: '🛍️ Открыть магазин'
    },
    {
      command: 'orders',
      description: '📦 Мои заказы'
    },
    {
      command: 'help',
      description: '📋 Справка по командам'
    }
  ];

  const url = `https://api.telegram.org/bot${botToken}/setMyCommands`;
  const payload = JSON.stringify({ commands });

  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
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
    req.write(payload);
    req.end();
  });
}

async function handler(event) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'BOT_TOKEN not provided' }) 
      };
    }

    const result = await setMyCommands(botToken);
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        ok: true,
        message: '✅ Команды бота успешно установлены',
        commands: result 
      }) 
    };
  } catch (error) {
    console.error('Error:', error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: error.message }) 
    };
  }
}

module.exports.handler = handler;
