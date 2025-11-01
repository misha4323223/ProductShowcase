# 🚀 Полное руководство по миграции на Yandex Cloud

## 📋 Содержание
1. [Подготовка Yandex Cloud](#этап-1-подготовка-yandex-cloud)
2. [Создание Yandex Database (YDB)](#этап-2-создание-yandex-database)
3. [Настройка Object Storage](#этап-3-настройка-object-storage)
4. [Экспорт данных из Firebase](#этап-4-экспорт-данных-из-firebase)
5. [Импорт данных в YDB](#этап-5-импорт-данных-в-ydb)
6. [Настройка Telegram Bot](#этап-6-настройка-telegram-bot)
7. [Обновление кода приложения](#этап-7-обновление-кода)
8. [Деплой через GitHub Actions](#этап-8-деплой)

---

## Этап 1: Подготовка Yandex Cloud

### 1.1 Регистрация
1. Перейдите на https://cloud.yandex.ru/
2. Войдите через Яндекс ID
3. Привяжите банковскую карту (для активации бесплатного гранта 4000₽)
4. Получите грант на 60 дней

### 1.2 Создание облака и каталога
1. В консоли создайте **Облако**: `sweetdelights-cloud`
2. Создайте **Каталог**: `production`
3. Регион: **ru-central1**

### 1.3 Создание сервисного аккаунта
1. Перейдите в **IAM → Сервисные аккаунты**
2. Нажмите **"Создать сервисный аккаунт"**
3. Параметры:
   - **Имя**: `sweetdelights-service-account`
   - **Роли**: 
     - `ydb.editor` (для работы с базой данных)
     - `storage.editor` (для работы с Object Storage)
4. Нажмите **"Создать"**

### 1.4 Создание статических ключей доступа
1. Откройте созданный сервисный аккаунт
2. Перейдите во вкладку **"Ключи доступа"**
3. Нажмите **"Создать новый ключ"** → **"Создать статический ключ доступа"**
4. **ВАЖНО! Сохраните:**
   - **Идентификатор ключа** (Access Key ID) - например: `YCAJExxx...`
   - **Секретный ключ** (Secret Access Key) - например: `YCMxxx...`
   
   ⚠️ **Секретный ключ показывается только один раз!** Скопируйте его сразу.

---

## Этап 2: Создание Yandex Database (YDB)

### 2.1 Создание базы данных
1. В консоли Yandex Cloud найдите **"Yandex Database"** (через поиск вверху)
2. Нажмите **"Создать базу данных"**
3. Параметры:
   - **Тип**: Serverless (бесплатный tier!)
   - **Имя**: `sweetdelights-db`
   - **Описание**: База данных для интернет-магазина сладостей
   - **Зона доступности**: ru-central1-a
4. Нажмите **"Создать базу данных"**

### 2.2 Получение эндпоинта
1. Откройте созданную базу данных
2. Скопируйте **Document API эндпоинт**:
   - Формат: `https://docapi.serverless.yandexcloud.net/ru-central1/xxxxxxxxxxxxx`
   - Пример: `https://docapi.serverless.yandexcloud.net/ru-central1/b1g5xxxxxxxxx/etnxxxxxxxxx`
3. Сохраните этот эндпоинт - он понадобится в `.env`

### 2.3 Создание таблиц (через Document API)
YDB в режиме Document API автоматически создаст таблицы при первой записи.
Структура будет соответствовать Firebase коллекциям:
- `products` - товары
- `categories` - категории
- `orders` - заказы
- `reviews` - отзывы
- `promocodes` - промокоды
- `carts` - корзины пользователей
- `wishlists` - избранное
- `stockNotifications` - подписки на уведомления о товарах
- `pushSubscriptions` - подписки на push-уведомления

---

## Этап 3: Настройка Object Storage

### 3.1 Создание бакета
1. В консоли → **Object Storage**
2. Нажмите **"Создать бакет"**
3. Параметры:
   - **Имя**: `sweetdelights-images` (уникальное имя!)
   - **Доступ на чтение объектов**: Публичный
   - **Класс хранения**: Стандартное
   - **Максимальный размер**: оставьте пустым (неограничен)
4. Нажмите **"Создать бакет"**

### 3.2 Настройка CORS
1. Откройте бакет
2. Перейдите в **CORS**
3. Нажмите **"Настроить"**
4. Добавьте правило:
```json
[
  {
    "AllowedOrigins": ["https://sweetdelights.store", "https://*.sweetdelights.store"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```
5. Нажмите **"Сохранить"**

### 3.3 Получение URL бакета
URL формата: `https://storage.yandexcloud.net/sweetdelights-images/`

---

## Этап 4: Экспорт данных из Firebase

### 4.1 Установка зависимостей
```bash
npm install
```

### 4.2 Настройка переменных окружения
Убедитесь, что в `.env` есть Firebase переменные:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=sweetweb-3543f
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4.3 Запуск экспорта
```bash
npm run export-firebase
```

Или напрямую:
```bash
tsx scripts/export-from-firebase.ts
```

### 4.4 Проверка результатов
После выполнения проверьте папку `export/`:
- `products.json` - все товары
- `categories.json` - категории
- `orders.json` - заказы
- `reviews.json` - отзывы
- `promocodes.json` - промокоды
- `carts.json` - корзины
- `wishlists.json` - избранное
- `stockNotifications.json` - подписки на уведомления
- `pushSubscriptions.json` - push-подписки
- `_export-summary.json` - сводка экспорта

---

## Этап 5: Импорт данных в YDB

### 5.1 Настройка переменных для YDB
Добавьте в `.env`:
```env
VITE_YDB_ENDPOINT=https://docapi.serverless.yandexcloud.net/ru-central1/xxxxx
VITE_YDB_ACCESS_KEY_ID=YCAJExxxxxxxxx
VITE_YDB_SECRET_KEY=YCMxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_YDB_DATABASE=sweetdelights-db
```

### 5.2 Запуск импорта
```bash
npm run import-to-ydb
```

Или:
```bash
tsx scripts/import-to-ydb.ts
```

Скрипт автоматически:
1. Прочитает все JSON файлы из `export/`
2. Создаст таблицы в YDB (если не существуют)
3. Импортирует все записи
4. Покажет статистику

---

## Этап 6: Настройка Telegram Bot

### 6.1 Создание бота
1. Откройте Telegram
2. Найдите **@BotFather**
3. Отправьте команду: `/newbot`
4. Название бота: `Sweet Delights Уведомления`
5. Username: `sweetdelights_notify_bot` (или любой доступный)
6. **Сохраните токен бота**: `1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw`

### 6.2 Добавление токена в .env
```env
VITE_TELEGRAM_BOT_TOKEN=1234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
```

### 6.3 Настройка webhook (опционально)
Можно использовать Yandex Cloud Functions для обработки сообщений от бота.

---

## Этап 7: Обновление кода приложения

### 7.1 Установка новых зависимостей
```bash
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb node-telegram-bot-api
```

### 7.2 Файлы уже обновлены
- `client/src/lib/yandex-db.ts` - подключение к YDB
- `client/src/services/yandex-*.ts` - все сервисы переписаны для YDB
- `client/src/services/telegram-notifications.ts` - Telegram Bot интеграция
- `client/src/services/yandex-storage.ts` - загрузка в Object Storage

### 7.3 Обновление импортов
Все файлы уже обновлены для использования Yandex сервисов вместо Firebase.

---

## Этап 8: Деплой через GitHub Actions

### 8.1 Добавление secrets в GitHub
Перейдите в `Settings` → `Secrets and variables` → `Actions`

Добавьте новые secrets:
- `VITE_YDB_ENDPOINT`
- `VITE_YDB_ACCESS_KEY_ID`
- `VITE_YDB_SECRET_KEY`
- `VITE_YDB_DATABASE`
- `VITE_STORAGE_BUCKET` (имя бакета: `sweetdelights-images`)
- `VITE_STORAGE_REGION` (значение: `ru-central1`)
- `VITE_TELEGRAM_BOT_TOKEN`

### 8.2 Удаление старых Firebase secrets (опционально)
После успешной миграции можно удалить:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### 8.3 Обновление workflow
Файл `.github/workflows/deploy.yml` уже обновлен для работы с Yandex Cloud.

### 8.4 Запуск деплоя
```bash
git add .
git commit -m "Миграция на Yandex Cloud"
git push origin main
```

GitHub Actions автоматически соберет и задеплоит сайт с новыми настройками.

---

## 🎯 Чек-лист миграции

- [ ] Зарегистрирован в Yandex Cloud
- [ ] Создан сервисный аккаунт с ключами
- [ ] Создана база данных YDB
- [ ] Создан бакет Object Storage
- [ ] Экспортированы данные из Firebase
- [ ] Импортированы данные в YDB
- [ ] Создан Telegram Bot
- [ ] Добавлены секреты в GitHub
- [ ] Код обновлен для работы с Yandex Cloud
- [ ] Протестирован деплой
- [ ] Проверена работа сайта на production

---

## 💰 Стоимость

### Бесплатный tier (первый год):
- YDB Serverless: 1 ГБ бесплатно
- Object Storage: 1 ГБ бесплатно
- Грант 4000₽ на 60 дней

### После бесплатного периода:
- YDB: ~500-1000₽/мес
- Object Storage: ~200-500₽/мес  
- Telegram Bot: **Бесплатно навсегда**
- **ИТОГО: ~1000-1500₽/мес**

---

## 🆘 Поддержка

Если возникли проблемы:
1. Проверьте логи в Yandex Cloud Console
2. Убедитесь, что все секреты правильно настроены
3. Проверьте права доступа сервисного аккаунта
4. Документация YDB: https://cloud.yandex.ru/docs/ydb/
5. Документация Object Storage: https://cloud.yandex.ru/docs/storage/

---

## 🎉 Готово!

После завершения миграции ваш сайт будет полностью работать на российской инфраструктуре Yandex Cloud с соблюдением законодательства РФ о персональных данных.
