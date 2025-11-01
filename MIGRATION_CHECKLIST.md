# ✅ Чек-лист миграции на Yandex Cloud

## 🎯 Что УЖЕ СДЕЛАНО (автоматически):

✅ **Скрипты и код:**
- ✅ Скрипт экспорта из Firebase: `scripts/export-from-firebase.ts`
- ✅ Скрипт импорта в YDB: `scripts/import-to-ydb.ts`
- ✅ Библиотека для YDB: `client/src/lib/yandex-db.ts`
- ✅ Сервисы для работы с продуктами: `client/src/services/yandex-products.ts`
- ✅ Сервис для Object Storage: `client/src/services/yandex-storage.ts`
- ✅ Сервис для Telegram уведомлений: `client/src/services/telegram-notifications.ts`
- ✅ GitHub Actions workflow: `.github/workflows/deploy-yandex.yml`
- ✅ Пример .env файла: `.env.yandex.example`
- ✅ Установлены зависимости: AWS SDK для работы с Yandex Cloud

✅ **Документация:**
- ✅ Полное руководство: `YANDEX_MIGRATION_GUIDE.md`
- ✅ Быстрый старт: `YANDEX_QUICK_START.md`
- ✅ Пошаговая настройка: `YANDEX_SETUP_STEPS.md`
- ✅ Настройка GitHub Secrets: `GITHUB_SECRETS_SETUP.md`

✅ **Yandex Cloud:**
- ✅ База данных YDB создана
- ✅ Эндпоинт получен: `https://docapi.serverless.yandexcloud.net/ru-central1/b1gnp4ml7k5j7cquabad/etngc3d5gjae4oef9v48`

---

## 📋 Что НУЖНО СДЕЛАТЬ (вручную в Yandex Cloud):

### 1. Создать сервисный аккаунт (5 минут)
📖 **Инструкция:** `YANDEX_SETUP_STEPS.md` → Шаг 1

⬜ Создать сервисный аккаунт `sweetdelights-service-account`
⬜ Добавить роли: `ydb.editor`, `storage.editor`
⬜ Создать статический ключ доступа
⬜ **Сохранить:**
   - Access Key ID (YCAJE...)
   - Secret Key (YCM...)

---

### 2. Создать Object Storage бакет (5 минут)
📖 **Инструкция:** `YANDEX_SETUP_STEPS.md` → Шаг 2

⬜ Создать бакет `sweetdelights-images`
⬜ Настроить публичный доступ на чтение
⬜ Настроить CORS правила
⬜ **Сохранить:** имя бакета

---

### 3. Создать Telegram Bot (3 минуты)
📖 **Инструкция:** `YANDEX_SETUP_STEPS.md` → Шаг 3

⬜ Открыть @BotFather в Telegram
⬜ Создать бота командой `/newbot`
⬜ **Сохранить:**
   - Bot Token
   - Bot Username

---

### 4. Создать .env файл (2 минуты)

⬜ Скопировать `.env.yandex.example` → `.env`
⬜ Заполнить все переменные полученными значениями:
   - `VITE_YDB_ENDPOINT` - уже есть ✅
   - `VITE_YDB_ACCESS_KEY_ID` - из п.1
   - `VITE_YDB_SECRET_KEY` - из п.1
   - `VITE_YDB_DATABASE=sweetdelights-production`
   - `VITE_STORAGE_BUCKET` - из п.2
   - `VITE_STORAGE_REGION=ru-central1`
   - `VITE_TELEGRAM_BOT_TOKEN` - из п.3
   - `VITE_TELEGRAM_BOT_USERNAME` - из п.3

---

### 5. Экспортировать данные из Firebase (5 минут)

⬜ Запустить команду:
```bash
tsx scripts/export-from-firebase.ts
```

⬜ Проверить папку `export/` - должны появиться JSON файлы

---

### 6. Импортировать данные в YDB (10 минут)

⬜ Запустить команду:
```bash
tsx scripts/import-to-ydb.ts
```

⬜ Дождаться сообщения "Импорт завершен!"

---

### 7. Добавить секреты в GitHub (10 минут)
📖 **Инструкция:** `GITHUB_SECRETS_SETUP.md`

⬜ Открыть Settings → Secrets → Actions
⬜ Добавить 8 секретов:
   - VITE_YDB_ENDPOINT
   - VITE_YDB_ACCESS_KEY_ID
   - VITE_YDB_SECRET_KEY
   - VITE_YDB_DATABASE
   - VITE_STORAGE_BUCKET
   - VITE_STORAGE_REGION
   - VITE_TELEGRAM_BOT_TOKEN
   - VITE_TELEGRAM_BOT_USERNAME

---

### 8. Задеплоить на GitHub Pages (2 минуты)

⬜ Выполнить команды:
```bash
git add .
git commit -m "Миграция на Yandex Cloud"
git push origin main
```

⬜ Дождаться завершения GitHub Actions
⬜ Проверить сайт: https://sweetdelights.store

---

## ⏱️ Общее время: ~40 минут

## 💰 Стоимость после бесплатного периода: ~1000-1500₽/мес

---

## 🆘 Нужна помощь?

Откройте соответствующий файл с инструкциями:
- `YANDEX_SETUP_STEPS.md` - пошаговые инструкции по настройке Yandex Cloud
- `GITHUB_SECRETS_SETUP.md` - как добавить секреты в GitHub
- `YANDEX_MIGRATION_GUIDE.md` - полное руководство по миграции
- `YANDEX_QUICK_START.md` - краткая справка

---

## 🎉 После завершения

Ваш сайт будет полностью работать на российской инфраструктуре с соблюдением законодательства РФ о персональных данных!

**Что изменится:**
- ✅ Данные хранятся в России (Yandex Cloud)
- ✅ Push-уведомления через Telegram (российский мессенджер)
- ✅ Стоимость ~1000₽/мес вместо $50/мес
- ✅ Соответствие 152-ФЗ
