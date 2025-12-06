# Деплой функций подарочных сертификатов

## Обзор

Система подарочных сертификатов состоит из двух Cloud Functions:
1. **gift-certificates** - основная функция для работы с сертификатами
2. **process-scheduled-certificates** - cron-функция для отложенной отправки

---

## Этап 1: Создание функции gift-certificates

### 1.1 Создайте функцию в консоли Yandex Cloud

```
Имя: gift-certificates
Среда выполнения: nodejs18
Точка входа: index.handler
Таймаут: 30 секунд
Память: 256 MB
```

### 1.2 Установите переменные окружения

| Переменная | Описание | Пример |
|-----------|----------|--------|
| `YDB_ENDPOINT` | Endpoint YDB (Document API) | `https://docapi.serverless.yandexcloud.net/ru-central1/...` |
| `YDB_ACCESS_KEY_ID` | Access Key для YDB | `AKIA...` |
| `YDB_SECRET_KEY` | Secret Key для YDB | `...` |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram бота | `123456:ABC...` |
| `SEND_EMAIL_FUNCTION_URL` | URL функции send-email | `https://functions.yandexcloud.net/d4e...` |

### 1.3 Загрузите код

Запакуйте содержимое папки `yandex-functions/gift-certificates/` в ZIP:
```bash
cd yandex-functions/gift-certificates
zip -r gift-certificates.zip .
```

Загрузите ZIP в функцию через консоль или CLI:
```bash
yc serverless function version create \
  --function-name gift-certificates \
  --runtime nodejs18 \
  --entrypoint index.handler \
  --memory 256m \
  --execution-timeout 30s \
  --source-path gift-certificates.zip \
  --environment YDB_ENDPOINT=...,YDB_ACCESS_KEY_ID=...,YDB_SECRET_KEY=...,TELEGRAM_BOT_TOKEN=...,SEND_EMAIL_FUNCTION_URL=...
```

### 1.4 Запишите ID функции

После создания скопируйте ID функции (например: `d4e...`).

---

## Этап 2: Создание функции process-scheduled-certificates

### 2.1 Создайте функцию

```
Имя: process-scheduled-certificates
Среда выполнения: nodejs18
Точка входа: index.handler
Таймаут: 60 секунд
Память: 256 MB
```

### 2.2 Установите те же переменные окружения

| Переменная | Значение |
|-----------|----------|
| `YDB_ENDPOINT` | (то же, что для gift-certificates) |
| `YDB_ACCESS_KEY_ID` | (то же) |
| `YDB_SECRET_KEY` | (то же) |
| `TELEGRAM_BOT_TOKEN` | (то же) |
| `SEND_EMAIL_FUNCTION_URL` | (то же) |

### 2.3 Загрузите код

```bash
cd yandex-functions/process-scheduled-certificates
zip -r process-scheduled-certificates.zip .
```

### 2.4 Создайте триггер (cron)

Функция должна запускаться каждый час для проверки сертификатов с отложенной доставкой:

```bash
yc serverless trigger create timer \
  --name process-scheduled-certificates-trigger \
  --cron-expression "0 * * * ? *" \
  --invoke-function-name process-scheduled-certificates \
  --invoke-function-service-account-id aje47rf2630q59equess
```

---

## Этап 3: Обновление send-email функции

Функция send-email уже обновлена и поддерживает тип `gift_certificate`.

Если нужно переразвернуть:
```bash
cd yandex-functions/send-email
zip -r send-email.zip .
```

Добавьте переменную окружения (опционально):
| Переменная | Описание |
|-----------|----------|
| `GIFTS_EMAIL` | Email для отправки сертификатов (опционально, по умолчанию FROM_EMAIL) |

---

## Этап 4: Обновление API Gateway

### 4.1 Замените плейсхолдер в api-gateway-spec.yaml

Откройте файл `api-gateway-spec.yaml` и замените:
```
${GIFT_CERTIFICATES_FUNCTION_ID}
```
на реальный ID функции gift-certificates.

### 4.2 Обновите спецификацию в консоли

В консоли Yandex Cloud откройте API Gateway и загрузите обновлённую спецификацию.

---

## Этап 5: Тестирование

### 5.1 Создание сертификата
```bash
curl -X POST "https://your-api-gateway.apigw.yandexcloud.net/certificates" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "amount": 1000,
    "purchaserEmail": "buyer@example.com",
    "purchaserName": "Иван",
    "isGift": true,
    "recipientEmail": "friend@example.com",
    "recipientName": "Мария",
    "senderName": "Иван",
    "message": "С днём рождения!"
  }'
```

### 5.2 Валидация сертификата
```bash
curl -X POST "https://your-api-gateway.apigw.yandexcloud.net/certificates" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "validate",
    "code": "GC-XXXX-XXXX"
  }'
```

### 5.3 Активация после оплаты
```bash
curl -X POST "https://your-api-gateway.apigw.yandexcloud.net/certificates" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "id": "certificate_id_here"
  }'
```

### 5.4 Применение к заказу
```bash
curl -X POST "https://your-api-gateway.apigw.yandexcloud.net/certificates" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "apply",
    "code": "GC-XXXX-XXXX",
    "orderId": "order123",
    "amountToUse": 500
  }'
```

---

## API Reference

### POST /certificates

| action | Описание | Обязательные поля |
|--------|----------|-------------------|
| `create` | Создать сертификат | amount, purchaserEmail |
| `validate` | Проверить валидность | code |
| `apply` | Применить к заказу | code, orderId, amountToUse |
| `activate` | Активировать после оплаты | id или code |
| `send` | Отправить получателю | id или code |

### GET /certificates

| Параметр | Описание |
|----------|----------|
| `code` | Получить по коду сертификата |
| `id` | Получить по ID |
| `userId` | Получить все сертификаты пользователя (email) |

---

## Номиналы сертификатов

Поддерживаемые значения: 500, 1000, 2000, 3000, 5000, 7000, 10000 рублей.

## Статусы сертификатов

| Статус | Описание |
|--------|----------|
| `pending` | Ожидает оплаты |
| `active` | Активен, можно использовать |
| `used` | Полностью использован |
| `expired` | Срок действия истёк |

## Срок действия

Сертификаты действительны 365 дней с момента создания.
