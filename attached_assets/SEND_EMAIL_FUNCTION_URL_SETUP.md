# Переменная SEND_EMAIL_FUNCTION_URL - Полная инструкция

## Где нужна эта переменная?

`SEND_EMAIL_FUNCTION_URL` должна быть установлена в следующих Яндекс Cloud Functions:

### 1. **register-user** (Регистрация)
- Отправляет код верификации при регистрации
- Переменная окружения: `SEND_EMAIL_FUNCTION_URL`

### 2. **reset-password** (Сброс пароля)
- Отправляет код сброса пароля
- Переменная окружения: `SEND_EMAIL_FUNCTION_URL`

## Что это за переменная?

`SEND_EMAIL_FUNCTION_URL` - это URL-адрес функции **send-email** в Яндекс Cloud Functions.

Пример: `https://functions.yandexcloud.net/d4e3jqg0l7bh1j3ck10h`

## Как её установить?

1. Откройте Яндекс Cloud Console
2. Перейдите в Functions (Функции)
3. Для каждой функции (**register-user** и **reset-password**):
   - Нажмите на функцию
   - Перейдите в раздел **Параметры функции** → **Переменные окружения**
   - Добавьте:
     - Ключ: `SEND_EMAIL_FUNCTION_URL`
     - Значение: URL функции send-email (например: `https://functions.yandexcloud.net/d4e3jqg0l7bh1j3ck10h`)

## Обязательные переменные окружения для всех функций:

### register-user
- ✅ YDB_ENDPOINT
- ✅ YDB_ACCESS_KEY_ID  
- ✅ YDB_SECRET_KEY
- ✅ **SEND_EMAIL_FUNCTION_URL** ← ГЛАВНАЯ

### reset-password
- ✅ YDB_ENDPOINT
- ✅ YDB_ACCESS_KEY_ID
- ✅ YDB_SECRET_KEY
- ✅ **SEND_EMAIL_FUNCTION_URL** ← ГЛАВНАЯ

### send-email
- ✅ POSTBOX_ACCESS_KEY_ID
- ✅ POSTBOX_SECRET_ACCESS_KEY
- ✅ FROM_EMAIL (нореply@sweetdelights.store)

## Как найти URL функции send-email?

1. Откройте Яндекс Cloud Console
2. Перейдите в Functions
3. Откройте функцию **send-email**
4. В верхней части страницы будет указан HTTPS-URL функции
5. Скопируйте его полностью

## Проверка работы

Если письма не отправляются, проверьте логи функций:
- Откройте функцию
- Перейдите на вкладку **Логи**
- Поищите ошибки с текстом "SEND_EMAIL_FUNCTION_URL"

