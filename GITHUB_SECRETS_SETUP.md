# 🔐 Настройка GitHub Secrets для Yandex Cloud

## 📍 Где добавлять секреты:

1. Откройте ваш репозиторий на GitHub
2. Перейдите: **Settings** → **Secrets and variables** → **Actions**
3. Нажимайте **"New repository secret"** для каждого секрета

---

## 🔑 Список секретов для добавления:

### Yandex Database (YDB)

**1. VITE_YDB_ENDPOINT**
- Значение: `https://docapi.serverless.yandexcloud.net/ru-central1/b1gnp4ml7k5j7cquabad/etngc3d5gjae4oef9v48`

**2. VITE_YDB_ACCESS_KEY_ID**
- Значение: ваш Access Key ID (начинается с `YCAJE...`)
- Откуда взять: сервисный аккаунт → статические ключи

**3. VITE_YDB_SECRET_KEY**
- Значение: ваш Secret Key (начинается с `YCM...`)
- Откуда взять: сервисный аккаунт → статические ключи

**4. VITE_YDB_DATABASE**
- Значение: `sweetdelights-production`

---

### Yandex Object Storage

**5. VITE_STORAGE_BUCKET**
- Значение: `sweetdelights-images` (имя вашего бакета)

**6. VITE_STORAGE_REGION**
- Значение: `ru-central1`

---

### Telegram Bot

**7. VITE_TELEGRAM_BOT_TOKEN**
- Значение: токен от @BotFather (например: `1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`)

**8. VITE_TELEGRAM_BOT_USERNAME**
- Значение: username вашего бота (например: `sweetdelights_notify_bot`)

---

### Yandex Cloud Postbox (email notifications)

**9. VITE_API_GATEWAY_URL**
- Значение: URL вашего Yandex API Gateway
- Пример: `https://your-gateway-id.apigw.yandexcloud.net`
- Используется для отправки email через Cloud Function
- См. инструкцию в YANDEX_POSTBOX_SETUP.md

---

---

### Yandex Cloud Function (НЕ нужен для прямой загрузки)

~~**10. VITE_UPLOAD_IMAGE_FUNCTION_URL**~~
- ❌ Больше не используется! Загрузка теперь идет напрямую через AWS SDK

---

## ✅ Проверка

После добавления всех секретов:
1. В разделе Secrets должно быть **9 переменных**:
   - VITE_YDB_ENDPOINT
   - VITE_YDB_ACCESS_KEY_ID
   - VITE_YDB_SECRET_KEY
   - VITE_YDB_DATABASE
   - VITE_STORAGE_BUCKET
   - VITE_STORAGE_REGION
   - VITE_TELEGRAM_BOT_TOKEN
   - VITE_TELEGRAM_BOT_USERNAME
   - VITE_API_GATEWAY_URL
2. Каждая должна иметь зелёную галочку
3. Значения скрыты (показываются как `***`)

---

## 🚀 Деплой

После добавления секретов:
```bash
git add .
git commit -m "Миграция на Yandex Cloud"
git push origin main
```

GitHub Actions автоматически соберёт и задеплоит сайт!
