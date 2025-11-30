# 📰 Unified Broadcast Notifications - Одна функция для всего!

## ✅ Что изменилось:

Две функции объединены в одну `broadcast-notifications`:
- ❌ `subscribe-notifications` (удаляется)
- ❌ `send-broadcast` (удаляется)  
- ✅ `broadcast-notifications` (одна функция для обеих операций)

---

## 🚀 Использование:

### Подписка пользователя:
```bash
POST /api/broadcast-notifications
{
  "action": "subscribe",
  "chat_id": 123456789,
  "username": "username",
  "first_name": "Иван"
}
```

### Отправка рассылки:
```bash
POST /api/broadcast-notifications
{
  "action": "send",
  "broadcast_title": "🎁 Новые товары",
  "message": "Добавили свежую коллекцию конфет! 🍬"
}
```

---

## 💡 Примеры:

**Акция:**
```bash
curl -X POST http://localhost:5000/api/broadcast-notifications \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "broadcast_title": "🔥 Черная Пятница",
    "message": "Скидки до 50% на все товары!"
  }'
```

**Новый товар:**
```bash
curl -X POST http://localhost:5000/api/broadcast-notifications \
  -d '{
    "action": "send",
    "broadcast_title": "🎁 Новинка",
    "message": "Свежая коллекция конфет 🍬"
  }'
```

**Подписка в боте:**
```javascript
// В telegram-bot/index.js при /start:
subscribeUser(chatId, username, firstName);
// Это автоматически подписывает пользователя
```

---

## 📊 Ответы:

**При успешной подписке:**
```json
{
  "ok": true,
  "message": "Подписка активирована"
}
```

**При успешной рассылке:**
```json
{
  "ok": true,
  "message": "✅ Рассылка отправлена",
  "sent": 45,
  "failed": 2,
  "total": 47
}
```

---

## 🗄️ База данных

Таблица `telegram_subscribers`:
```sql
CREATE TABLE telegram_subscribers (
  id SERIAL PRIMARY KEY,
  chat_id BIGINT UNIQUE NOT NULL,
  username VARCHAR,
  first_name VARCHAR,
  subscribed_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);
```

---

## 📋 Параметры функции:

| Параметр | Тип | Обязательный | Описание |
|----------|-----|-------------|---------|
| `action` | string | ✅ | 'subscribe' или 'send' |
| `chat_id` | number | ✅* | Обязателен для subscribe |
| `message` | string | ✅* | Обязателен для send |
| `broadcast_title` | string | ❌ | Заголовок рассылки |
| `username` | string | ❌ | Username из Telegram |
| `first_name` | string | ❌ | Имя пользователя |

---

## ✨ Преимущества объединения:

✅ **Одна функция** вместо двух  
✅ **Меньше кода** для поддержки  
✅ **Проще развёртывать**  
✅ **Одна БД табличка** для обеих операций  
✅ **Понятнее логика**

Готово! 🎉
