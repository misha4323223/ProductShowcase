# 🚀 Быстрый старт: Миграция на Yandex Cloud

## ✅ Что уже сделано:

1. ✅ Созданы скрипты экспорта/импорта данных
2. ✅ Созданы сервисы для работы с YDB
3. ✅ Настроена интеграция с Yandex Object Storage
4. ✅ Добавлена поддержка Telegram Bot
5. ✅ Установлены необходимые зависимости

## 📋 Что нужно сделать сейчас:

### Шаг 1: Завершите создание YDB базы данных ⏳
Вы уже на этом шаге! После создания базы:
1. Откройте её в консоли
2. Скопируйте **Document API эндпоинт**
3. Сохраните его - понадобится для `.env`

### Шаг 2: Создайте сервисный аккаунт и получите ключи 🔑

1. Перейдите в **IAM → Сервисные аккаунты**
2. Нажмите **"Создать сервисный аккаунт"**
3. Параметры:
   - Имя: `sweetdelights-sa`
   - Роли: `ydb.editor`, `storage.editor`
4. После создания → **"Создать статический ключ доступа"**
5. **ВАЖНО!** Сохраните:
   - Идентификатор ключа (Access Key ID)
   - Секретный ключ (показывается только один раз!)

### Шаг 3: Создайте Object Storage бакет 📦

1. В консоли → **Object Storage**
2. **"Создать бакет"**
3. Параметры:
   - Имя: `sweetdelights-images` (любое уникальное)
   - Доступ: **Публичный на чтение**
   - Класс: Стандартное
4. После создания → **CORS** → добавьте правило:

```json
[{
  "AllowedOrigins": ["https://sweetdelights.store"],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3000
}]
```

### Шаг 4: Создайте Telegram Bot 🤖

1. Откройте Telegram → найдите **@BotFather**
2. Отправьте: `/newbot`
3. Название: `Sweet Delights Уведомления`
4. Username: `sweetdelights_bot` (или любой свободный)
5. **Сохраните токен бота**

### Шаг 5: Настройте .env файл 📝

Создайте файл `.env` в корне проекта:

```env
# Yandex Database (YDB)
VITE_YDB_ENDPOINT=https://docapi.serverless.yandexcloud.net/ru-central1/ваш_эндпоинт
VITE_YDB_ACCESS_KEY_ID=YCAJEваш_ключ
VITE_YDB_SECRET_KEY=YCMваш_секретный_ключ
VITE_YDB_DATABASE=sweetdelights-production

# Yandex Object Storage
VITE_STORAGE_BUCKET=sweetdelights-images
VITE_STORAGE_REGION=ru-central1

# Telegram Bot
VITE_TELEGRAM_BOT_TOKEN=ваш_токен_бота
VITE_TELEGRAM_BOT_USERNAME=sweetdelights_bot

# Старые Firebase переменные (для экспорта данных)
VITE_FIREBASE_API_KEY=ваш_текущий_ключ
VITE_FIREBASE_PROJECT_ID=sweetweb-3543f
VITE_FIREBASE_MESSAGING_SENDER_ID=ваш_sender_id
VITE_FIREBASE_APP_ID=ваш_app_id
```

### Шаг 6: Экспортируйте данные из Firebase 📤

Запустите в терминале:
```bash
npm run export-firebase
```

Или:
```bash
tsx scripts/export-from-firebase.ts
```

Проверьте папку `export/` - должны появиться JSON файлы со всеми данными.

### Шаг 7: Импортируйте данные в YDB 📥

```bash
npm run import-to-ydb
```

Или:
```bash
tsx scripts/import-to-ydb.ts
```

### Шаг 8: Добавьте секреты в GitHub Actions 🔐

1. GitHub → ваш репозиторий → **Settings** → **Secrets and variables** → **Actions**
2. Добавьте новые secrets:
   - `VITE_YDB_ENDPOINT`
   - `VITE_YDB_ACCESS_KEY_ID`
   - `VITE_YDB_SECRET_KEY`
   - `VITE_YDB_DATABASE`
   - `VITE_STORAGE_BUCKET`
   - `VITE_STORAGE_REGION`
   - `VITE_TELEGRAM_BOT_TOKEN`
   - `VITE_TELEGRAM_BOT_USERNAME`

### Шаг 9: Задеплойте на GitHub Pages 🚀

```bash
git add .
git commit -m "Миграция на Yandex Cloud"
git push origin main
```

GitHub Actions автоматически соберёт и задеплоит сайт!

---

## 📞 Нужна помощь?

1. **База данных не создаётся?** Проверьте, что выбран тип Serverless
2. **Не получается создать ключи?** Убедитесь, что сервисному аккаунту назначены роли
3. **Ошибка при импорте?** Проверьте, что все переменные в `.env` корректны

---

## 💰 Стоимость

- YDB Serverless: **0₽/мес** (до 1 ГБ)
- Object Storage: **0₽/мес** (до 1 ГБ в первый год)
- Telegram Bot: **БЕСПЛАТНО навсегда**
- Грант на старт: **4000₽ на 60 дней**

---

## ⏱️ Время миграции: ~2 часа

✅ Файлы и код уже готовы - осталось только настроить облако!
