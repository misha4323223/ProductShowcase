# 🚀 Инструкция по настройке Yandex Cloud для Sweet Delights

## ✅ Что уже готово:

1. ✅ **Исправлены все git конфликты** - приложение запускается
2. ✅ **Cloud Functions созданы** (6 функций):
   - `get-categories` - получение категорий товаров
   - `get-products` - получение всех товаров
   - `get-product-by-id` - получение товара по ID
   - `save-cart` - сохранение корзины
   - `create-order` - создание заказа
   - `get-cart` - получение корзины пользователя

3. ✅ **API Client создан** - `client/src/services/api-client.ts`
4. ✅ **Хуки обновлены** - используют новый API вместо прямого подключения к YDB
5. ✅ **Документация готова** - `API_GATEWAY_SETUP.md` с OpenAPI спецификацией
6. ✅ **GitHub Actions обновлён** - использует переменную `VITE_API_GATEWAY_URL`

---

## 📋 ЧТО ВАМ НУЖНО СДЕЛАТЬ:

### Шаг 1: Создать API Gateway в Yandex Cloud Console

API Gateway объединяет все ваши Cloud Functions под одним URL.

#### 1.1. Откройте Yandex Cloud Console
- Перейдите: https://console.cloud.yandex.ru
- Выберите ваш каталог (folder)

#### 1.2. Создайте API Gateway
1. В меню слева найдите **"API Gateway"**
2. Нажмите **"Создать API-шлюз"**
3. Укажите параметры:
   - **Имя**: `sweet-delights-api`
   - **Описание**: API для Sweet Delights e-commerce
   - **Регион**: `ru-central1`

#### 1.3. Вставьте OpenAPI спецификацию

Скопируйте содержимое из файла `API_GATEWAY_SETUP.md` (раздел "OpenAPI Specification") и вставьте в поле спецификации.

**⚠️ ВАЖНО!** Замените placeholders на реальные ID ваших функций:

```yaml
x-yc-apigateway-integration:
  type: cloud_functions
  function_id: d4eXXXXXXXXXXXXXXXXX  # ← Замените на ID вашей функции
```

Где найти Function ID:
1. Откройте **Cloud Functions** в Yandex Cloud Console
2. Нажмите на функцию (например, `get-categories`)
3. Скопируйте **ID** из раздела "Общая информация"

Повторите для всех 6 функций.

#### 1.4. Создайте API Gateway
- Нажмите **"Создать"**
- Дождитесь создания (займёт ~30-60 секунд)

#### 1.5. Скопируйте URL API Gateway
После создания вы увидите URL вида:
```
https://d5dXXXXXXXXXXXXXXXXX.apigw.yandexcloud.net
```

**Сохраните этот URL!** Он понадобится в следующих шагах.

---

### Шаг 2: Настроить переменные окружения

#### 2.1. Локальная разработка

Создайте файл `.env` в корне проекта:

```bash
# Yandex Cloud API Gateway URL
VITE_API_GATEWAY_URL=https://d5dXXXXXXXXXXXXXXXXX.apigw.yandexcloud.net

# Firebase (оставьте как есть, если используете Firebase Auth)
FIREBASE_PROJECT_ID=ваш-проект-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@ваш-проект.iam.gserviceaccount.com
```

#### 2.2. GitHub Secrets для деплоя

Добавьте секрет в GitHub:

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **"New repository secret"**
4. Добавьте секрет:
   - **Name**: `VITE_API_GATEWAY_URL`
   - **Value**: `https://d5dXXXXXXXXXXXXXXXXX.apigw.yandexcloud.net`

---

### Шаг 3: Протестировать API Gateway

#### 3.1. Проверьте функции через API Gateway

Откройте терминал и выполните:

```bash
# Получить категории
curl https://ВАШ-API-GATEWAY-URL/categories

# Получить товары
curl https://ВАШ-API-GATEWAY-URL/products

# Получить товар по ID
curl https://ВАШ-API-GATEWAY-URL/products/PRODUCT_ID
```

Если всё настроено правильно, вы получите JSON-ответы.

#### 3.2. Проверьте приложение локально

1. Перезапустите приложение:
```bash
npm run dev
```

2. Откройте браузер: http://localhost:5000

3. Проверьте консоль браузера (F12) - ошибки API должны исчезнуть

---

### Шаг 4: Деплой на Yandex Cloud (опционально)

Если вы хотите задеплоить фронтенд на Yandex Object Storage:

#### 4.1. Создайте бакет в Object Storage
1. Откройте **Object Storage** в Yandex Cloud Console
2. Создайте бакет:
   - **Имя**: `sweet-delights-app` (должно быть уникальным)
   - **Публичный доступ**: Включите чтение объектов
   - **Статический сайт**: Включите, укажите `index.html`

#### 4.2. Настройте GitHub Actions
Добавьте секреты в GitHub:

```
YC_SERVICE_ACCOUNT_KEY_JSON - JSON ключ сервисного аккаунта
YC_BUCKET_NAME - имя вашего бакета
```

#### 4.3. Запустите деплой
```bash
git push origin main
```

GitHub Actions автоматически:
1. Соберёт приложение с `VITE_API_GATEWAY_URL`
2. Загрузит файлы в Object Storage
3. Ваше приложение будет доступно по URL бакета

---

## 🔧 Troubleshooting (Решение проблем)

### Проблема: "Failed to fetch" в консоли браузера

**Причина**: API Gateway не настроен или URL неправильный

**Решение**:
1. Проверьте что `.env` содержит правильный `VITE_API_GATEWAY_URL`
2. Проверьте что API Gateway создан и работает (curl запросы)
3. Перезапустите приложение: `npm run dev`

### Проблема: API Gateway возвращает 404

**Причина**: Неправильные Function ID в OpenAPI спецификации

**Решение**:
1. Откройте API Gateway в Yandex Cloud Console
2. Нажмите "Редактировать"
3. Проверьте что все `function_id` соответствуют реальным ID функций
4. Сохраните изменения

### Проблема: API Gateway возвращает 403/500

**Причина**: У сервисного аккаунта нет прав на вызов функций

**Решение**:
1. Откройте каждую Cloud Function
2. Перейдите в "Права доступа"
3. Добавьте роль `functions.functionInvoker` для сервисного аккаунта API Gateway

### Проблема: CORS ошибки

**Причина**: OpenAPI спецификация не содержит CORS настройки

**Решение**: В файле `API_GATEWAY_SETUP.md` уже есть правильные CORS настройки в спецификации. Убедитесь что вы скопировали её полностью.

---

## 📊 Архитектура решения

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└──────┬──────┘
       │ HTTP
       ▼
┌─────────────────────┐
│   API Gateway       │ ← Единая точка входа
│ (Yandex Cloud)      │
└──────┬──────────────┘
       │
       ├─► get-categories     (Cloud Function)
       ├─► get-products       (Cloud Function)
       ├─► get-product-by-id  (Cloud Function)
       ├─► save-cart          (Cloud Function)
       ├─► create-order       (Cloud Function)
       └─► get-cart           (Cloud Function)
                │
                ▼
        ┌──────────────┐
        │  Yandex DB   │
        │   (YDB)      │
        └──────────────┘
```

**Преимущества этой архитектуры:**
- ✅ Безопасность: База данных недоступна напрямую из браузера
- ✅ Масштабируемость: Функции автомасштабируются
- ✅ Производительность: API Gateway кеширует ответы
- ✅ Единый URL: Все API под одним доменом (нет CORS проблем)
- ✅ Serverless: Платите только за использование

---

## 💰 Стоимость

При небольшом трафике (< 1000 запросов/день):
- API Gateway: ~0-50₽/месяц
- Cloud Functions: ~0-100₽/месяц
- YDB: ~0₽ (free tier 1GB)

**Итого**: ~50-150₽/месяц для небольшого магазина

---

## 📚 Полезные ссылки

- [Документация API Gateway](https://cloud.yandex.ru/docs/api-gateway/)
- [Документация Cloud Functions](https://cloud.yandex.ru/docs/functions/)
- [Документация YDB](https://cloud.yandex.ru/docs/ydb/)
- [OpenAPI спецификация](./API_GATEWAY_SETUP.md)

---

## ✅ Чек-лист завершения

- [ ] API Gateway создан в Yandex Cloud
- [ ] OpenAPI спецификация загружена с правильными Function ID
- [ ] URL API Gateway скопирован
- [ ] Файл `.env` создан с `VITE_API_GATEWAY_URL`
- [ ] GitHub Secret `VITE_API_GATEWAY_URL` добавлен
- [ ] Тестовые curl запросы работают
- [ ] Приложение запущено локально без ошибок API
- [ ] (Опционально) Деплой на Object Storage настроен

---

## 🎉 Готово!

После выполнения всех шагов ваш интернет-магазин Sweet Delights будет полностью работать на Yandex Cloud с serverless архитектурой!

Если возникнут вопросы - обращайтесь! 🍬
