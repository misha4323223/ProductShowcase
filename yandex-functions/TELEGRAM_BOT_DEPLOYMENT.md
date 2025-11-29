# Развертывание telegram-bot функции в Yandex Cloud

## 📝 Структура функции

Файлы созданы в `yandex-functions/telegram-bot/`:
- `index.js` - основной обработчик вебхуков
- `package.json` - зависимости

## 🚀 Что делает функция

**Получает вебхуки от Telegram и обрабатывает:**

1. **Команда `/start`** - показывает главное меню:
   - 🛍️ Открыть магазин (Web App)
   - 📦 Мои заказы
   - 👤 Профиль

2. **Команда `/shop`** - кнопка "Открыть магазин"

3. **Команда `/orders`** - кнопка "Открыть заказы"

4. **Обычные сообщения** - показывает доступные команды

5. **Кнопки** - каллбэки для callback_data

## 🔧 Шаги развертывания

### Шаг 1: Создать функцию в Yandex Cloud Console

```
1. Перейти в Yandex Cloud Console
2. Functions → Create function
3. Name: telegram-bot
4. Runtime: Node.js 18
5. Zip и upload файлы:
   - yandex-functions/telegram-bot/index.js
   - yandex-functions/telegram-bot/package.json
6. Entry point: index.handler
7. Memory: 256 MB
8. Timeout: 60 sec
9. Service account: aje47rf2630q59equess (как у других функций)
```

### Шаг 2: Добавить переменные окружения

```
TELEGRAM_BOT_TOKEN = (ваш BOT_TOKEN из @BotFather)
```

### Шаг 3: Включить HTTP запросы

```
Уровень доступа: Public
Require authentication: OFF
```

### Шаг 4: После развертывания

Получить публичный URL функции (будет выглядеть как):
```
https://functions.yandexcloud.net/d4em7xxxxxxxxxxxxx
```

### Шаг 5: Установить webhook в Telegram

Выполнить один раз (когда получите URL функции):

```bash
curl -X POST \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://functions.yandexcloud.net/d4em7xxxxxxxxxxxxx"}' \
  https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook
```

Или через Telegram Bot API в браузере:
```
https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setWebhook?url=https://functions.yandexcloud.net/d4em7xxxxxxxxxxxxx
```

### Шаг 6: Проверить webhook

```bash
curl https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/getWebhookInfo
```

Должно вернуть:
```json
{
  "ok": true,
  "result": {
    "url": "https://functions.yandexcloud.net/d4em7xxxxxxxxxxxxx",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

## 🧪 Тестирование

1. **Открыть бота в Telegram**: @SweetWeb71_bot

2. **Отправить `/start`** - должны появиться кнопки

3. **Нажать "Открыть магазин"** - должна открыться Mini App

4. **Отправить `/shop`** - кнопка магазина

5. **Отправить `/orders`** - кнопка заказов

## 📊 ID Функций

Когда развернете, обновите:

| Функция | ID | URL |
|---------|----|----|
| telegram-auth | d4em719picvakgi4ng2s | /api/telegram/auth |
| send-order-to-user-telegram | d4epu4u7dq6u9ni5tfbo | /api/send-order-to-user-telegram |
| **telegram-bot** | **d4em7xxxxxxxxxxxxx** | **/webhook** |

## ✅ Последствия

После развертывания:
- Бот будет получать все сообщения через webhook
- Пользователи смогут открыть Mini App прямо из Telegram
- Будут работать команды /start, /shop, /orders
