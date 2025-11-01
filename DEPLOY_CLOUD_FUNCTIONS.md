# 🚀 ИНСТРУКЦИЯ ПО ДЕПЛОЮ CLOUD FUNCTIONS

## 📋 ЧТО СОЗДАНО

Все Cloud Functions готовы в папке `yandex-functions/`:

### ✅ Уже задеплоенные (7 функций):
1. ✅ `create-product` - создание товара
2. ✅ `get-products` - получение всех товаров  
3. ✅ `get-product-by-id` - получение товара по ID
4. ✅ `get-categories` - получение категорий
5. ✅ `get-cart` - получение корзины
6. ✅ `save-cart` - сохранение корзины
7. ✅ `create-order` - создание заказа

### 🆕 НУЖНО ЗАДЕПЛОИТЬ (17 новых функций):

**ФАЗА 1: Products & Categories (4 функции)**
- `update-product` - обновление товара
- `delete-product` - удаление товара
- `create-category` - создание категории
- `delete-category` - удаление категории

**ФАЗА 2: Reviews (3 функции)**
- `get-reviews` - получение отзывов
- `create-review` - создание отзыва
- `delete-review` - удаление отзыва

**ФАЗА 3: Promo Codes (5 функций)** ⚠️ КРИТИЧНО для checkout!
- `validate-promo` - валидация промокода
- `get-all-promos` - получение всех промокодов
- `create-promo` - создание промокода
- `update-promo` - обновление промокода
- `delete-promo` - удаление промокода

**ФАЗА 4: Wishlist (2 функции)**
- `get-wishlist` - получение избранного
- `update-wishlist` - обновление избранного

**ФАЗА 5: Stock Notifications (3 функции)**
- `get-stock-notifications` - получение уведомлений
- `create-stock-notification` - создание уведомления
- `delete-stock-notification` - удаление уведомления

**ФАЗА 6: Push Subscriptions (3 функции)**
- `get-push-subscriptions` - получение подписок
- `save-push-subscription` - сохранение подписки
- `delete-push-subscription` - удаление подписки

---

## 🔧 СПОСОБ 1: ДЕПЛОЙ ЧЕРЕЗ YANDEX CLOUD CONSOLE (Рекомендую)

### Шаг 1: Открыть Cloud Functions
1. Перейти в https://console.cloud.yandex.ru
2. Выбрать ваш каталог (folder)
3. Открыть **Serverless → Cloud Functions**

### Шаг 2: Создать функцию
Для КАЖДОЙ из 17 функций:

1. **Нажать "Создать функцию"**

2. **Настройки функции:**
   - Имя: `update-product` (или другое из списка)
   - Описание: краткое описание
   - Окружение: `nodejs18`

3. **Код функции:**
   - Метод создания: **ZIP-архив** или **Редактор кода**
   - Точка входа: `index.handler`
   
   **Вариант A - Редактор кода:**
   - Скопировать содержимое `yandex-functions/update-product/index.js`
   - Скопировать содержимое `yandex-functions/update-product/package.json`
   
   **Вариант B - ZIP-архив:**
   - Заархивировать папку `yandex-functions/update-product/`
   - Загрузить архив

4. **Параметры:**
   - Таймаут: `10` сек
   - Память: `128` МБ
   - Сервисный аккаунт: `aje47rf2630q59equess` (тот же что и у других функций)

5. **Переменные окружения:**
   ```
   YDB_ENDPOINT=<ваш_endpoint>
   YDB_ACCESS_KEY_ID=<ваш_ключ>
   YDB_SECRET_KEY=<ваш_секрет>
   ```
   
   > ⚠️ Используйте те же значения, что и у существующих функций!

6. **Нажать "Создать версию"**

7. **ВАЖНО! Скопировать Function ID:**
   - После создания откроется страница функции
   - Найти **Function ID** (например: `d4e4idepedeld78laqoc`)
   - Записать его - он понадобится для API Gateway!

### Шаг 3: Повторить для всех 17 функций

Создать по очереди все функции из списка выше.

---

## 📝 ТАБЛИЦА ДЛЯ ЗАПИСИ FUNCTION IDs

После создания каждой функции, заполните эту таблицу:

| Функция | Function ID |
|---------|-------------|
| update-product | `________________` |
| delete-product | `________________` |
| create-category | `________________` |
| delete-category | `________________` |
| get-reviews | `________________` |
| create-review | `________________` |
| delete-review | `________________` |
| validate-promo | `________________` |
| get-all-promos | `________________` |
| create-promo | `________________` |
| update-promo | `________________` |
| delete-promo | `________________` |
| get-wishlist | `________________` |
| update-wishlist | `________________` |
| get-stock-notifications | `________________` |
| create-stock-notification | `________________` |
| delete-stock-notification | `________________` |
| get-push-subscriptions | `________________` |
| save-push-subscription | `________________` |
| delete-push-subscription | `________________` |

---

## 🌐 ОБНОВЛЕНИЕ API GATEWAY

После того как все функции созданы и у вас есть все Function IDs:

1. Открыть файл `API_GATEWAY_SPEC_FINAL.yaml` (будет создан агентом)
2. Заменить все `<FUNCTION_ID_...>` на реальные ID из таблицы выше
3. Перейти в **Serverless → API Gateway**
4. Выбрать ваш API Gateway
5. Нажать **"Изменить"**
6. Заменить весь YAML на содержимое из `API_GATEWAY_SPEC_FINAL.yaml`
7. Нажать **"Сохранить"**

---

## ✅ ПРОВЕРКА

После обновления API Gateway:

1. Открыть ваш сайт
2. Попробовать зайти в **Админку**
3. Попробовать создать товар
4. Попробовать создать категорию
5. Попробовать применить промокод при checkout

Если всё работает - миграция завершена успешно! 🎉

---

## 🆘 TROUBLESHOOTING

### Функция не работает
- Проверить переменные окружения (YDB_ENDPOINT, YDB_ACCESS_KEY_ID, YDB_SECRET_KEY)
- Проверить что сервисный аккаунт установлен правильно
- Посмотреть логи функции в Cloud Functions Console

### API Gateway возвращает 404
- Проверить что Function ID скопирован правильно
- Проверить что путь в спецификации совпадает с тем, что использует фронтенд

### Ошибки CORS
- Проверить что в функции есть заголовок `Access-Control-Allow-Origin: *`
- Проверить что в API Gateway есть OPTIONS методы для CORS preflight

---

## 🔄 АЛЬТЕРНАТИВА: ДЕПЛОЙ ЧЕРЕЗ YC CLI

Если у вас установлен Yandex Cloud CLI:

```bash
# Для каждой функции
cd yandex-functions/update-product
yc serverless function version create \
  --function-name=update-product \
  --runtime=nodejs18 \
  --entrypoint=index.handler \
  --memory=128m \
  --execution-timeout=10s \
  --source-path=. \
  --environment YDB_ENDPOINT=<endpoint> \
  --environment YDB_ACCESS_KEY_ID=<key> \
  --environment YDB_SECRET_KEY=<secret> \
  --service-account-id=aje47rf2630q59equess
```

Но через Console будет проще для первого раза!
