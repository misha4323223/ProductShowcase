const { YandexCloudDatabase } = require('../lib/db-client.js');

async function handler(event) {
  try {
    let data = event;
    if (typeof event.body === 'string') {
      data = JSON.parse(event.body);
    }

    const { chat_id, username, first_name } = data;
    if (!chat_id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'chat_id required' }) };
    }

    const db = new YandexCloudDatabase();
    
    // Сохраняем подписчика (или обновляем если уже существует)
    await db.executeQuery(`
      INSERT INTO telegram_subscribers (chat_id, username, first_name, subscribed_at, is_active)
      VALUES ($1, $2, $3, NOW(), true)
      ON CONFLICT (chat_id) 
      DO UPDATE SET is_active = true, updated_at = NOW()
    `, [chat_id, username || null, first_name || null]);

    console.log(`✅ Подписчик ${chat_id} добавлен`);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, message: 'Подписка активирована' })
    };
  } catch (error) {
    console.error('Error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}

module.exports.handler = handler;
