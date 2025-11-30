# 🔧 Настройка Telegram Webhook

## Проблема:
Функция `telegram-bot` не получает сообщения от Telegram потому что **webhook не установлен**.

## Решение:

### 1️⃣ Получи URL твоей функции:
```
https://d4efkrvud5o73t4cskgk.functions.yandexcloud.net
```

### 2️⃣ Установи webhook через BotFather:

Отправь боту @BotFather команду:
```
/setwebhook
```

Затем укажи URL:
```
https://d4efkrvud5o73t4cskgk.functions.yandexcloud.net
```

### 3️⃣ Проверь webhook:
Отправь боту @BotFather:
```
/getwebhookinfo
```

Должен вернуть:
```
url: https://d4efkrvud5o73t4cskgk.functions.yandexcloud.net
```

### 4️⃣ Тестируй:
1. Напиши боту `/start`
2. Смотри логи в функции `telegram-bot`
3. Должны быть логи: "Message: /start"

## Если webhook не работает:
- Удали старый webhook: `/deletewebhook`
- Установи новый: `/setwebhook URL`
- Подожди 30 секунд
- Проверь webhook info

