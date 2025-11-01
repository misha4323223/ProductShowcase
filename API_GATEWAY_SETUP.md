# 🚀 Настройка API Gateway для Sweet Delights

## ✅ Что уже готово:
- ✅ Cloud Functions созданы в Yandex Cloud
- ✅ Код клиента обновлён для работы через HTTP
- ✅ Все данные в YDB

## 📋 Что нужно сделать (ШАГ ЗА ШАГОМ)

---

## ЭТАП 1: Получить Function ID для всех функций

### Шаг 1: Откройте каждую функцию и скопируйте её ID

1. Откройте Yandex Cloud Console → Serverless → Cloud Functions
2. Для каждой функции:
   - Откройте функцию
   - Скопируйте **ID функции** (формат: `d4e...`)

**Функции которые вам нужны:**
- `get-products` → скопируйте ID
- `get-categories` → скопируйте ID
- `get-product-by-id` → скопируйте ID
- `get-cart` → скопируйте ID
- `save-cart` → скопируйте ID
- `create-order` → скопируйте ID

Запишите их где-то, они понадобятся в следующем шаге!

---

## ЭТАП 2: Создать API Gateway

### Шаг 1: Создание API Gateway

1. В Yandex Cloud Console → **API Gateway**
2. Нажмите **"Создать API-шлюз"**
3. Параметры:
   - **Имя**: `sweetdelights-api`
   - **Описание**: API для интернет-магазина Sweet Delights

### Шаг 2: Конфигурация OpenAPI спецификации

**ВАЖНО!** Замените все `<FUNCTION_ID>` на реальные ID ваших функций!

```yaml
openapi: 3.0.0
info:
  title: Sweet Delights API
  version: 1.0.0
  description: API для интернет-магазина сладостей

paths:
  /products:
    get:
      summary: Получить все товары
      operationId: getAllProducts
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <FUNCTION_ID_get-products>
        service_account_id: <YOUR_SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Список товаров
          content:
            application/json:
              schema:
                type: array
    options:
      summary: CORS preflight
      x-yc-apigateway-integration:
        type: dummy
        http_code: 200
        http_headers:
          'Access-Control-Allow-Origin': '*'
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'

  /products/{id}:
    get:
      summary: Получить товар по ID
      operationId: getProductById
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <FUNCTION_ID_get-product-by-id>
        service_account_id: <YOUR_SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Товар
    options:
      summary: CORS preflight
      x-yc-apigateway-integration:
        type: dummy
        http_code: 200
        http_headers:
          'Access-Control-Allow-Origin': '*'
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'

  /categories:
    get:
      summary: Получить все категории
      operationId: getAllCategories
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <FUNCTION_ID_get-categories>
        service_account_id: <YOUR_SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Список категорий
    options:
      summary: CORS preflight
      x-yc-apigateway-integration:
        type: dummy
        http_code: 200
        http_headers:
          'Access-Control-Allow-Origin': '*'
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'

  /cart/{userId}:
    get:
      summary: Получить корзину пользователя
      operationId: getCart
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <FUNCTION_ID_get-cart>
        service_account_id: <YOUR_SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Корзина
    options:
      summary: CORS preflight
      x-yc-apigateway-integration:
        type: dummy
        http_code: 200
        http_headers:
          'Access-Control-Allow-Origin': '*'
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'

  /cart:
    post:
      summary: Сохранить корзину
      operationId: saveCart
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <FUNCTION_ID_save-cart>
        service_account_id: <YOUR_SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Корзина сохранена
    options:
      summary: CORS preflight
      x-yc-apigateway-integration:
        type: dummy
        http_code: 200
        http_headers:
          'Access-Control-Allow-Origin': '*'
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'

  /orders:
    post:
      summary: Создать заказ
      operationId: createOrder
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <FUNCTION_ID_create-order>
        service_account_id: <YOUR_SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Заказ создан
    options:
      summary: CORS preflight
      x-yc-apigateway-integration:
        type: dummy
        http_code: 200
        http_headers:
          'Access-Control-Allow-Origin': '*'
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

### Шаг 3: Замените значения

В конфигурации выше замените:

1. **`<FUNCTION_ID_get-products>`** → ID функции `get-products`
2. **`<FUNCTION_ID_get-categories>`** → ID функции `get-categories`
3. **`<FUNCTION_ID_get-product-by-id>`** → ID функции `get-product-by-id`
4. **`<FUNCTION_ID_get-cart>`** → ID функции `get-cart`
5. **`<FUNCTION_ID_save-cart>`** → ID функции `save-cart`
6. **`<FUNCTION_ID_create-order>`** → ID функции `create-order`
7. **`<YOUR_SERVICE_ACCOUNT_ID>`** → ID вашего сервисного аккаунта (в каждом месте!)

### Шаг 4: Вставьте конфигурацию

1. Вставьте отредактированную конфигурацию в поле **"Спецификация"**
2. Нажмите **"Создать"**

### Шаг 5: Получите URL API Gateway

После создания:
1. Скопируйте **"Служебный домен"**
2. Формат: `https://d5d...apigw.yandexcloud.net`
3. Это и есть ваш API Gateway URL! 🎉

---

## ЭТАП 3: Настройка переменных окружения

### Для локальной разработки (файл `.env`)

Создайте файл `.env` в корне проекта:

```env
# Yandex API Gateway
VITE_API_GATEWAY_URL=https://ваш-домен.apigw.yandexcloud.net
```

### Для GitHub Actions (GitHub Secrets)

1. Откройте ваш репозиторий на GitHub
2. Settings → Secrets and variables → Actions
3. Нажмите **"New repository secret"**
4. Добавьте:
   - **Name**: `VITE_API_GATEWAY_URL`
   - **Value**: `https://ваш-домен.apigw.yandexcloud.net`

---

## ЭТАП 4: Обновление GitHub Actions Workflow

Файл `.github/workflows/firebase-hosting-merge.yml` уже настроен правильно!

Проверьте что там есть:

```yaml
env:
  VITE_API_GATEWAY_URL: ${{ secrets.VITE_API_GATEWAY_URL }}
```

---

## 🧪 ЭТАП 5: Тестирование

### Тест 1: Проверка API Gateway вручную

Откройте в браузере:
```
https://ваш-домен.apigw.yandexcloud.net/products
```

Должен вернуться JSON с товарами! 🎉

### Тест 2: Проверка категорий

```
https://ваш-домен.apigw.yandexcloud.net/categories
```

Должен вернуться JSON с категориями!

### Тест 3: Локальный запуск

```bash
npm run dev
```

Сайт должен загрузить товары и категории!

---

## 📝 Чеклист выполнения

- [ ] Получены ID всех 6 функций
- [ ] Создан API Gateway
- [ ] Вставлена и отредактирована OpenAPI конфигурация
- [ ] Скопирован URL API Gateway
- [ ] Создан `.env` файл с `VITE_API_GATEWAY_URL`
- [ ] Добавлен GitHub Secret `VITE_API_GATEWAY_URL`
- [ ] API Gateway возвращает товары при GET запросе
- [ ] API Gateway возвращает категории при GET запросе
- [ ] Локальный сайт загружает товары
- [ ] Сайт задеплоен через GitHub Actions и работает!

---

## ❓ Возможные проблемы

### Проблема: "403 Forbidden"
**Решение**: Убедитесь что:
- Все функции имеют "Публичная функция" = включено
- Service Account ID правильный во всех местах конфигурации

### Проблема: "CORS error"
**Решение**: Убедитесь что OPTIONS endpoints настроены правильно в конфигурации

### Проблема: Сайт не загружает товары
**Решение**: 
1. Проверьте что `.env` файл создан
2. Проверьте что `VITE_API_GATEWAY_URL` без слэша в конце
3. Перезапустите сервер разработки

---

## ✅ Готово!

После выполнения всех шагов:
- ✅ Сайт будет получать товары из Cloud Functions
- ✅ Данные защищены (ключи YDB только в функциях)
- ✅ Всё работает на задеплоенном сайте через GitHub Actions

🎉 **Успехов!**
