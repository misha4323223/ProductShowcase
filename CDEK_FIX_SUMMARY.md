# Исправление интеграции СДЭК - Резюме

## Проблема
Когда пользователь выбирал доставку СДЭК и нажимал "Выбрать ПВЗ", в браузере возникала ошибка:
```
Failed to load resource: the server responded with a status of 404 ()
api/delivery/cdek/points/?city_code=270:1
```

## Причина
Фронтенд делал запросы к **относительным путям** (например, `/api/delivery/cdek/points`), которые пытались обратиться к GitHub Pages (статический хостинг), вместо того чтобы идти на бэкенд в Яндекс Облако.

## Решение

### 1. Исправлен файл `client/src/lib/queryClient.ts`

**Было:**
```typescript
const res = await fetch(queryKey.join("/") as string, {
  credentials: "include",
});
```

**Стало:**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

function getFullUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return API_BASE_URL + path;
}

const path = queryKey.join("/") as string;
const fullUrl = getFullUrl(path);

const res = await fetch(fullUrl, {
  credentials: "include",
});
```

Теперь все API запросы автоматически добавляют префикс `VITE_API_GATEWAY_URL` из `.env` файла.

### 2. Проверена спецификация API Gateway

Ваша задеплоенная спецификация API Gateway **уже содержит все необходимые маршруты СДЭК**:

✅ `GET /api/delivery/cdek/points` → функция `get-pvz-cdek` (d4el2qd1ihlbmguis1iv)  
✅ `POST /api/delivery/cdek/calculate` → функция `calculate-delivery-cdek` (d4e97hu512s5fr3e8j0l)  
✅ `POST /api/delivery/cdek/order` → функция `create-cdek-order` (d4eucofr7pvms8rfc9us)  
✅ `GET /api/delivery/cdek/track` → функция `track-cdek-order` (d4e21ufg8q98n5o0nlti)

## Как работает исправление

### В локальной разработке (Replit)
```
Фронтенд → queryClient.ts → 
  VITE_API_GATEWAY_URL + /api/delivery/cdek/points →
  https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net/api/delivery/cdek/points
```

### На GitHub Pages (после деплоя)
То же самое! GitHub Actions добавит `VITE_API_GATEWAY_URL` в build, и все запросы будут идти на ваш бэкенд в Яндекс Облаке.

## Следующие шаги

### 1. Локальное тестирование ✅
Изменения уже применены в этом проекте и работают.

### 2. Деплой на GitHub Pages
Выполните коммит и push:
```bash
git add .
git commit -m "fix: добавлен VITE_API_GATEWAY_URL в queryClient для СДЭК интеграции"
git push origin main
```

GitHub Actions автоматически:
1. Соберет проект с вашим `VITE_API_GATEWAY_URL` из GitHub Secrets
2. Задеплоит на GitHub Pages
3. Теперь СДЭК будет работать на продакшене!

### 3. Проверка на GitHub Pages
После деплоя:
1. Откройте ваш сайт на GitHub Pages
2. Добавьте товар в корзину
3. Перейдите в Checkout
4. Выберите доставку "СДЭК"
5. Нажмите "Выбрать ПВЗ"
6. Вы должны увидеть список пунктов выдачи СДЭК!

## Проверка переменной окружения в GitHub

Убедитесь, что в GitHub Secrets есть `VITE_API_GATEWAY_URL`:

1. Откройте репозиторий на GitHub
2. Settings → Secrets and variables → Actions
3. Проверьте наличие секрета `VITE_API_GATEWAY_URL` со значением:
   ```
   https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net
   ```

## Что НЕ нужно делать

❌ **НЕ нужно** обновлять API Gateway - он уже правильно настроен  
❌ **НЕ нужно** пересоздавать функции СДЭК - они уже работают  
❌ **НЕ нужно** менять `.env` файл - он уже правильный

## Проверка работы СДЭК в консоли браузера

После деплоя откройте консоль браузера (F12) и проверьте Network tab:

**Было (ошибка):**
```
Request URL: https://your-site.github.io/api/delivery/cdek/points?city_code=270
Status: 404
```

**Стало (успех):**
```
Request URL: https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net/api/delivery/cdek/points?city_code=270
Status: 200
```

## Тестовые ключи СДЭК

Напоминание: сейчас используются тестовые ключи СДЭК. Для продакшена нужно:
1. Зарегистрироваться на СДЭК
2. Получить боевые ключи
3. Обновить переменные окружения `CDEK_CLIENT_ID` и `CDEK_CLIENT_SECRET` в Яндекс Functions

---

✅ **Исправление завершено!** Интеграция СДЭК готова к работе после деплоя на GitHub Pages.
