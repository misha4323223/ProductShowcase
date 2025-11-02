# 🔐 Инструкция по развертыванию аутентификации

## ✅ Что уже готово:
- ✅ 4 Cloud Functions созданы в папке `yandex-functions/`
- ✅ Фронтенд обновлен (AuthContext, AdminAuthContext)
- ✅ Firebase полностью удален
- ✅ Таблица `users` уже создана в YDB

---

## 📋 ШАГ 1: Загрузите Cloud Functions в Yandex Cloud

### 1.1 Создайте ZIP архивы для каждой функции

Выполните эти команды в корне проекта:

```bash
# Функция 1: register-user
cd yandex-functions/register-user
zip -r register-user.zip index.js ../lib/auth-utils.js ../lib/response-helper.js package.json
cd ../..

# Функция 2: login-user
cd yandex-functions/login-user
zip -r login-user.zip index.js ../lib/auth-utils.js ../lib/response-helper.js package.json
cd ../..

# Функция 3: reset-password
cd yandex-functions/reset-password
zip -r reset-password.zip index.js ../lib/auth-utils.js ../lib/response-helper.js package.json
cd ../..

# Функция 4: verify-token
cd yandex-functions/verify-token
zip -r verify-token.zip index.js ../lib/auth-utils.js ../lib/response-helper.js package.json
cd ../..
```

---

### 1.2 Загрузите функции в Yandex Cloud Console

Для КАЖДОЙ функции выполните:

1. Откройте [Yandex Cloud Console](https://console.cloud.yandex.ru/)
2. Перейдите в **Cloud Functions**
3. Нажмите **Создать функцию**
4. Имя функции: `register-user` (затем `login-user`, `reset-password`, `verify-token`)
5. **Создать версию**:
   - Runtime: `nodejs18`
   - Метод: `ZIP-архив`
   - Загрузите соответствующий ZIP файл
   - Точка входа: `index.handler`
   - Таймаут: `10 секунд`
   - Память: `128 MB`

---

### 1.3 Добавьте переменные окружения для каждой функции

#### **Для функции `register-user`:**
```
YDB_ENDPOINT=https://docapi.serverless.yandexcloud.net/ru-central1/b1gnp4ml7k5j7cquabad/etngc3d5gjae4oef9v48
YDB_ACCESS_KEY_ID=<ваш_ключ_YCAJE...>
YDB_SECRET_KEY=<ваш_секретный_ключ_YCM...>
JWT_SECRET=99a46a94a49b8bc25175c01cc98379345bd385f644f0cfb111d98e5a55c3efde
```

#### **Для функции `login-user`:**
```
YDB_ENDPOINT=https://docapi.serverless.yandexcloud.net/ru-central1/b1gnp4ml7k5j7cquabad/etngc3d5gjae4oef9v48
YDB_ACCESS_KEY_ID=<ваш_ключ_YCAJE...>
YDB_SECRET_KEY=<ваш_секретный_ключ_YCM...>
JWT_SECRET=99a46a94a49b8bc25175c01cc98379345bd385f644f0cfb111d98e5a55c3efde
```

#### **Для функции `reset-password`:**
```
YDB_ENDPOINT=https://docapi.serverless.yandexcloud.net/ru-central1/b1gnp4ml7k5j7cquabad/etngc3d5gjae4oef9v48
YDB_ACCESS_KEY_ID=<ваш_ключ_YCAJE...>
YDB_SECRET_KEY=<ваш_секретный_ключ_YCM...>
JWT_SECRET=99a46a94a49b8bc25175c01cc98379345bd385f644f0cfb111d98e5a55c3efde
SEND_EMAIL_FUNCTION_URL=<URL вашей функции send-email>
```

#### **Для функции `verify-token`:**
```
JWT_SECRET=99a46a94a49b8bc25175c01cc98379345bd385f644f0cfb111d98e5a55c3efde
```

---

### 1.4 Сделайте функции публичными

Для КАЖДОЙ функции:
1. Откройте функцию
2. Перейдите в **Права доступа**
3. Нажмите **Добавить привязку**
4. Роль: `functions.functionInvoker`
5. Субъект: `allUsers`
6. Сохраните

---

### 1.5 Скопируйте ID функций

После создания каждой функции, скопируйте её ID:
- `register-user` → ID: `d4e...`
- `login-user` → ID: `d4e...`
- `reset-password` → ID: `d4e...`
- `verify-token` → ID: `d4e...`

---

## 📋 ШАГ 2: Обновите API Gateway

### 2.1 Откройте ваш API Gateway в Yandex Cloud Console

### 2.2 Добавьте эти маршруты в спецификацию:

```yaml
  /auth/register:
    post:
      summary: Register new user
      operationId: registerUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                password:
                  type: string
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <ID_функции_register-user>
      responses:
        '200':
          description: Success

  /auth/login:
    post:
      summary: Login user
      operationId: loginUser
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                password:
                  type: string
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <ID_функции_login-user>
      responses:
        '200':
          description: Success

  /auth/reset-password:
    post:
      summary: Reset password
      operationId: resetPassword
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - action
              properties:
                email:
                  type: string
                action:
                  type: string
                  enum: [request, verify]
                resetCode:
                  type: string
                newPassword:
                  type: string
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <ID_функции_reset-password>
      responses:
        '200':
          description: Success

  /auth/verify:
    post:
      summary: Verify JWT token
      operationId: verifyToken
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - token
              properties:
                token:
                  type: string
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <ID_функции_verify-token>
      responses:
        '200':
          description: Success
```

### 2.3 Замените `<ID_функции_...>` на реальные ID из шага 1.5

### 2.4 Сохраните изменения API Gateway

---

## 📋 ШАГ 3: Добавьте GitHub Secrets

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings → Secrets and variables → Actions**
3. Нажмите **New repository secret**
4. Добавьте секрет:

```
Имя: VITE_JWT_SECRET
Значение: 99a46a94a49b8bc25175c01cc98379345bd385f644f0cfb111d98e5a55c3efde
```

---

## 📋 ШАГ 4: Создайте админа

После развертывания:

### 4.1 Зарегистрируйте админа через сайт
1. Откройте ваш сайт
2. Зарегистрируйте пользователя с email: `admin@sweetdelights.com`
3. Используйте любой пароль (запомните его!)

### 4.2 Установите роль admin в базе данных YDB

Откройте Yandex Cloud Console → YDB → Ваша база данных → SQL запросы:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@sweetdelights.com';
```

---

## 📋 ШАГ 5: Задеплойте на GitHub Pages

```bash
git add .
git commit -m "Миграция аутентификации на Yandex Cloud"
git push origin main
```

Дождитесь завершения GitHub Actions (3-5 минут).

---

## 🎉 ГОТОВО!

Ваша аутентификация теперь работает на Yandex Cloud:

✅ Регистрация пользователей
✅ Вход в систему  
✅ Сброс пароля через email
✅ JWT токены (30 дней)
✅ Админ панель
✅ 100% данных в России

---

## 🔍 Проверка работы

### Тест регистрации:
```bash
curl -X POST https://ваш-api-gateway.apigw.yandexcloud.net/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Тест входа:
```bash
curl -X POST https://ваш-api-gateway.apigw.yandexcloud.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## ❓ Возникли проблемы?

1. Проверьте логи Cloud Functions в Yandex Cloud Console
2. Убедитесь что все переменные окружения установлены правильно
3. Проверьте что функции публичные (allUsers имеет доступ)
4. Проверьте что API Gateway правильно настроен с ID функций
