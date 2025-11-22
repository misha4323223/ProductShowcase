# 🎨 Пошаговая инструкция по настройке сезонных тем

## 📋 Что мы сделали

Создали систему управления сезонными темами:
- ✅ Yandex Cloud Functions для сохранения/загрузки текущей темы
- ✅ API клиент для работы с настройками
- ✅ Обновили админку для сохранения темы на сервер
- ✅ Обновили сайт для загрузки темы с сервера при старте

---

## 🚀 Что нужно сделать ВАМ

### ШАГ 1: Деплой функции `get-site-settings`

#### 1.1. Перейдите в Yandex Cloud Console
Откройте: https://console.cloud.yandex.ru/

#### 1.2. Выберите ваш каталог и перейдите в Cloud Functions
- Нажмите на **Cloud Functions** в меню слева
- Нажмите кнопку **"Создать функцию"**

#### 1.3. Создайте функцию
- **Имя функции**: `get-site-settings`
- **Описание**: `Получение настроек сайта из YDB`
- Нажмите **"Создать"**

#### 1.4. Загрузите код
1. В редакторе выберите **"Редактор кода"**
2. **Среда выполнения**: `nodejs18`
3. **Точка входа**: `index.handler`
4. **Таймаут**: `10`

5. Создайте файл `index.js` и скопируйте туда код:

```javascript
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetItemCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

exports.handler = async (event) => {
  try {
    const settingKey = event.queryStringParameters?.key || 'current_theme';
    
    const result = await docClient.send(new GetItemCommand({
      TableName: "site_settings",
      Key: {
        settingKey: settingKey
      }
    }));
    
    if (!result.Item) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          settingKey: settingKey,
          settingValue: 'sakura'
        }),
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error("Error getting site settings:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

6. Создайте файл `package.json`:

```json
{
  "name": "get-site-settings",
  "version": "1.0.0",
  "description": "Get site settings from YDB",
  "main": "index.js",
  "dependencies": {
    "@aws-sdk/client-dynamodb": "^3.525.0",
    "@aws-sdk/lib-dynamodb": "^3.525.0"
  }
}
```

#### 1.5. Настройте переменные окружения
В разделе **"Параметры"** → **"Переменные окружения"** добавьте:
- `YDB_ENDPOINT` - ваш YDB endpoint (например: `https://ydb.serverless.yandexcloud.net/ru-central1/xxxxx`)
- `YDB_ACCESS_KEY_ID` - ваш access key
- `YDB_SECRET_KEY` - ваш secret key

#### 1.6. Сохраните и создайте версию
- Нажмите **"Создать версию"**
- Дождитесь завершения сборки

#### 1.7. Сделайте функцию публичной
1. Перейдите во вкладку **"Обзор"**
2. В разделе **"Права доступа"** нажмите **"Настроить"**
3. Добавьте роль **"functions.functionInvoker"** для **"allUsers"**
4. Сохраните

---

### ШАГ 2: Деплой функции `set-site-settings`

Повторите все шаги из ШАГ 1, но с другим кодом:

#### 2.1. Создайте функцию
- **Имя функции**: `set-site-settings`
- **Описание**: `Установка настроек сайта в YDB`

#### 2.2. Код для `index.js`:

```javascript
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutItemCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

exports.handler = async (event) => {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { settingKey, settingValue } = body;
    
    if (!settingKey || !settingValue) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'settingKey and settingValue are required' }),
      };
    }
    
    await docClient.send(new PutItemCommand({
      TableName: "site_settings",
      Item: {
        settingKey: settingKey,
        settingValue: settingValue
      }
    }));
    
    console.log(`Setting updated: ${settingKey} = ${settingValue}`);
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: true,
        settingKey,
        settingValue
      }),
    };
  } catch (error) {
    console.error("Error setting site settings:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
```

#### 2.3. Тот же `package.json` что и в шаге 1.5

#### 2.4. Настройте переменные окружения (такие же как в шаге 1.5)

#### 2.5. Создайте версию и сделайте публичной

---

### ШАГ 3: Обновите API Gateway

#### 3.1. Найдите ваш API Gateway
В Yandex Cloud Console перейдите в **API Gateway** и откройте ваш gateway.

#### 3.2. Добавьте новые роуты
В спецификацию OpenAPI добавьте следующие роуты:

```yaml
  /site-settings:
    get:
      summary: Get site settings
      operationId: getSiteSettings
      parameters:
        - name: key
          in: query
          required: false
          schema:
            type: string
            default: current_theme
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <ВАШ_ID_ФУНКЦИИ_get-site-settings>
        service_account_id: <ВАШ_SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Site settings retrieved
          content:
            application/json:
              schema:
                type: object
    post:
      summary: Set site settings
      operationId: setSiteSettings
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - settingKey
                - settingValue
              properties:
                settingKey:
                  type: string
                settingValue:
                  type: string
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: <ВАШ_ID_ФУНКЦИИ_set-site-settings>
        service_account_id: <ВАШ_SERVICE_ACCOUNT_ID>
      responses:
        '200':
          description: Setting saved successfully
```

#### 3.3. Как найти ID функций:
1. Откройте функцию в консоли Yandex Cloud
2. ID функции находится вверху страницы (начинается с `d4e...`)
3. Скопируйте его и вставьте вместо `<ВАШ_ID_ФУНКЦИИ_...>`

#### 3.4. Сохраните изменения API Gateway

---

### ШАГ 4: Проверьте переменную окружения на фронтенде

В GitHub Actions или в вашем `.env` файле проверьте:

```bash
VITE_API_BASE_URL=https://d5dqs08iq55f8bu3s0pf.apigw.yandexcloud.net
```

Замените на ваш адрес API Gateway если отличается.

---

### ШАГ 5: Деплой на GitHub Pages

#### 5.1. Соберите и задеплойте сайт
```bash
npm run build
```

#### 5.2. Загрузите на GitHub
```bash
git add .
git commit -m "Added theme synchronization with backend"
git push
```

GitHub Actions автоматически задеплоит изменения.

---

## ✅ Тестирование

### Проверка работы:

1. **Откройте админку** на вашем сайте
2. **Перейдите во вкладку "Темы"** (иконка 🎨 Palette)
3. **Выберите тему**, например "Новогодняя"
4. **Должно появиться уведомление**: "Тема сохранена на сервере! Все пользователи увидят эту тему."
5. **Откройте сайт в режиме инкогнито** или на другом устройстве
6. **Обновите страницу** - должна загрузиться новогодняя тема!

---

## 🔧 Отладка

### Если тема не применяется:

#### Проверка 1: Функции работают
Откройте в браузере:
```
https://ВАШ_API_GATEWAY_URL/site-settings?key=current_theme
```
Должен вернуться JSON с темой.

#### Проверка 2: Консоль браузера
Откройте DevTools (F12) → Console
Должны быть логи:
- `Theme saved to server: ...`
- При загрузке сайта должна загружаться тема

#### Проверка 3: YDB
Откройте YDB в Yandex Cloud Console
Проверьте таблицу `site_settings`:
- Должна быть запись с `settingKey = "current_theme"`
- `settingValue` должно быть название темы

### Если видите ошибки CORS:
Проверьте что в функциях есть заголовки:
```javascript
'Access-Control-Allow-Origin': '*'
```

---

## 📱 Как это работает теперь

1. **Админ выбирает тему** в админке
2. **Тема сохраняется** в YDB таблицу `site_settings`
3. **Все пользователи** при загрузке сайта запрашивают тему с сервера
4. **Тема применяется** автоматически для всех!

---

## 💡 Дополнительные возможности

Теперь вы можете использовать таблицу `site_settings` для хранения других настроек:
- Баннеры
- Акции
- Режим работы магазина
- И многое другое!

Просто используйте функции `getSiteSetting()` и `setSiteSetting()` из API клиента.

---

## 📞 Если что-то не работает

Напишите мне:
1. Какой шаг не получается
2. Текст ошибки из консоли браузера
3. Скриншот проблемы

Я помогу разобраться! 🚀
