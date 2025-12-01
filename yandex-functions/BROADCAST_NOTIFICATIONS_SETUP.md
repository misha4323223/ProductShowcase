# Настройка Broadcast Notifications с YDB

## Таблица telegram_subscribers

Создайте таблицу в Yandex Database (Document API / DynamoDB-compatible):

### Схема таблицы

```
Имя таблицы: telegram_subscribers

Primary Key: chat_id (String)

Поля:
- chat_id (String) - Primary Key, ID чата в Telegram
- username (String, nullable) - Username пользователя
- first_name (String, nullable) - Имя пользователя
- subscribed_at (String) - Дата подписки в ISO формате
- is_active (Boolean) - Активен ли подписчик
- unsubscribed_at (String, nullable) - Дата отписки
```

### Создание через YDB Console

1. Перейдите в Yandex Cloud Console
2. Serverless -> Databases -> Ваша база данных
3. Navigation -> Create table
4. Выберите "Document table"
5. Имя: `telegram_subscribers`
6. Primary key: `chat_id` (String)

## Переменные окружения функции

Добавьте следующие переменные в функцию `broadcast-notifications`:

```
TELEGRAM_BOT_TOKEN = <ваш токен бота>
YDB_ENDPOINT = <endpoint вашей YDB, например: https://docapi.serverless.yandexcloud.net/ru-central1/b1g.../etn...>
YDB_ACCESS_KEY_ID = <access key ID>
YDB_SECRET_KEY = <secret key>
```

## Развертывание обновленной функции

### Шаг 1: Загрузите файлы

Загрузите в Yandex Cloud Functions:
- `yandex-functions/broadcast-notifications/index.js`
- `yandex-functions/broadcast-notifications/package.json`

### Шаг 2: Настройки функции

```
Runtime: Node.js 18
Entry point: index.handler
Memory: 256 MB
Timeout: 120 sec (для рассылок нужно больше времени)
Service account: aje47rf2630q59equess
```

### Шаг 3: Проверьте webhook Telegram

Убедитесь, что webhook бота настроен на эту функцию:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://functions.yandexcloud.net/<FUNCTION_ID>"}'
```

## API функции

### Webhook от Telegram (автоматически)

При `/start` - сохраняет подписчика в YDB
При `/unsubscribe` - отписывает пользователя

### GET/POST запросы

**Получить всех подписчиков:**
```json
{
  "action": "get_subscribers"
}
```

Ответ:
```json
{
  "ok": true,
  "subscribers": [...],
  "count": 123
}
```

**Отправить рассылку:**
```json
{
  "action": "send",
  "title": "Новая акция!",
  "message": "Скидка 20% на все товары до конца недели!"
}
```

Ответ:
```json
{
  "ok": true,
  "sent": 100,
  "failed": 2,
  "total": 102,
  "message": "Broadcast sent to 100 subscribers, 2 failed"
}
```

**Подписать вручную:**
```json
{
  "action": "subscribe",
  "chatId": "123456789",
  "username": "user123",
  "firstName": "John"
}
```

**Отписать вручную:**
```json
{
  "action": "unsubscribe",
  "chatId": "123456789"
}
```

## Важные изменения

1. **Подписчики теперь хранятся в YDB** - данные не теряются при перезапуске функции
2. **Автоматическая отписка** - если пользователь заблокировал бота, он автоматически отписывается
3. **Команда /unsubscribe** - пользователи могут отписаться от рассылки
