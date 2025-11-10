# 🚀 ИНСТРУКЦИЯ ДЛЯ РУЧНОГО СОЗДАНИЯ CLOUD FUNCTIONS

## 📋 ОБЩАЯ ИНФОРМАЦИЯ

**Важно:** Все функции используют общую библиотеку `cdek-client.js`, которую нужно включить в каждую функцию.

**Runtime:** Node.js 18  
**Память:** 128 МБ  
**Таймаут:** 10 секунд  
**Сервисный аккаунт:** Ваш сервисный аккаунт с правами на выполнение функций

---

## 📦 БИБЛИОТЕКА CDEK-CLIENT.JS

Эту библиотеку нужно включить в **КАЖДУЮ** функцию.

### Путь в архиве: `lib/cdek-client.js`

```javascript
/**
 * Универсальный клиент для работы с CDEK API
 * Поддерживает OAuth 2.0 и автоматическое обновление токенов
 */

class CdekClient {
  constructor(clientId, clientSecret, isTest = false) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = isTest 
      ? 'https://api.edu.cdek.ru/v2' 
      : 'https://api.cdek.ru/v2';
    this.token = null;
    this.tokenExpiresAt = null;
  }

  async getToken() {
    if (this.token && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    
    const response = await fetch(`${this.baseUrl}/oauth/token?grant_type=client_credentials`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get CDEK token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000) - 60000;
    
    return this.token;
  }

  async makeRequest(endpoint, options = {}) {
    const token = await this.getToken();
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      const error = new Error(responseData.error || responseData.message || 'CDEK API request failed');
      error.statusCode = response.status;
      error.code = responseData.code;
      error.errors = responseData.errors;
      throw error;
    }

    return responseData;
  }

  async calculateDelivery(params) {
    return this.makeRequest('/calculator/tariff', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async calculateDeliveryList(params) {
    return this.makeRequest('/calculator/tarifflist', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async getDeliveryPoints(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/deliverypoints?${queryString}` : '/deliverypoints';
    return this.makeRequest(endpoint);
  }

  async createOrder(orderData) {
    return this.makeRequest('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async getOrder(uuid) {
    return this.makeRequest(`/orders/${uuid}`);
  }
}

module.exports = { CdekClient };
```

---

## 🔧 ФУНКЦИЯ 1: РАСЧЕТ СТОИМОСТИ ДОСТАВКИ

### Название функции: `calculate-delivery-cdek`
### Точка входа: `index.handler`

### Структура ZIP-архива:
```
calculate-delivery-cdek.zip
├── index.js
└── lib/
    └── cdek-client.js
```

### Файл: `index.js`

```javascript
/**
 * Функция расчета стоимости доставки СДЭК
 * Работает одинаково для самозанятых и ИП
 */

const { CdekClient } = require('./lib/cdek-client');

exports.handler = async (event) => {
  try {
    // Получаем параметры из переменных окружения
    const clientId = process.env.CDEK_CLIENT_ID;
    const clientSecret = process.env.CDEK_CLIENT_SECRET;
    const isTest = process.env.CDEK_TEST_MODE === 'true';

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'CDEK API credentials not configured' 
        }),
      };
    }

    // Парсим данные запроса
    const requestData = JSON.parse(event.body || '{}');
    const { 
      from_location, 
      to_location, 
      packages,
      tariff_code 
    } = requestData;

    // Валидация
    if (!to_location || !packages || packages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: to_location, packages' 
        }),
      };
    }

    // Инициализируем клиент СДЭК
    const cdek = new CdekClient(clientId, clientSecret, isTest);

    // Формируем запрос для расчета
    const calculationParams = {
      currency: 1, // RUB
      from_location: from_location || { code: 44 }, // По умолчанию Москва
      to_location,
      packages
    };

    // Выбираем правильный метод API в зависимости от наличия tariff_code
    let result;
    if (tariff_code) {
      // Расчет конкретного тарифа (требует tariff_code)
      calculationParams.tariff_code = tariff_code;
      result = await cdek.calculateDelivery(calculationParams);
    } else {
      // Получение списка всех доступных тарифов
      calculationParams.type = 1; // 1 - склад-склад
      result = await cdek.calculateDeliveryList(calculationParams);
    }

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
        data: result
      }),
    };

  } catch (error) {
    console.error('Error calculating CDEK delivery:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to calculate delivery cost',
      statusCode: error.statusCode,
      code: error.code
    };
    
    if (error.errors) {
      errorResponse.errors = error.errors;
    }
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorResponse),
    };
  }
};
```

### Переменные окружения:

| Ключ | Значение | Описание |
|------|----------|----------|
| `CDEK_CLIENT_ID` | `ваш_client_id` | Client ID из личного кабинета СДЭК |
| `CDEK_CLIENT_SECRET` | `ваш_client_secret` | Client Secret из личного кабинета СДЭК |
| `CDEK_TEST_MODE` | `true` или `false` | Тестовый режим (true для тестирования) |

### Настройки функции:
- **Runtime:** Node.js 18
- **Память:** 128 МБ
- **Таймаут:** 10 сек
- **HTTP:** Включить (публичная функция)

---

## 🔧 ФУНКЦИЯ 2: ПОЛУЧЕНИЕ ПУНКТОВ ВЫДАЧИ

### Название функции: `get-pvz-cdek`
### Точка входа: `index.handler`

### Структура ZIP-архива:
```
get-pvz-cdek.zip
├── index.js
└── lib/
    └── cdek-client.js
```

### Файл: `index.js`

```javascript
/**
 * Функция получения списка пунктов выдачи СДЭК
 * Работает одинаково для самозанятых и ИП
 */

const { CdekClient } = require('./lib/cdek-client');

exports.handler = async (event) => {
  try {
    // Получаем параметры из переменных окружения
    const clientId = process.env.CDEK_CLIENT_ID;
    const clientSecret = process.env.CDEK_CLIENT_SECRET;
    const isTest = process.env.CDEK_TEST_MODE === 'true';

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'CDEK API credentials not configured' 
        }),
      };
    }

    // Парсим query параметры
    const queryParams = event.queryStringParameters || {};
    
    // Инициализируем клиент СДЭК
    const cdek = new CdekClient(clientId, clientSecret, isTest);

    // Получаем список ПВЗ
    const deliveryPoints = await cdek.getDeliveryPoints(queryParams);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: deliveryPoints
      }),
    };

  } catch (error) {
    console.error('Error getting CDEK delivery points:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to get delivery points',
      statusCode: error.statusCode,
      code: error.code
    };
    
    if (error.errors) {
      errorResponse.errors = error.errors;
    }
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorResponse),
    };
  }
};
```

### Переменные окружения:

| Ключ | Значение | Описание |
|------|----------|----------|
| `CDEK_CLIENT_ID` | `ваш_client_id` | Client ID из личного кабинета СДЭК |
| `CDEK_CLIENT_SECRET` | `ваш_client_secret` | Client Secret из личного кабинета СДЭК |
| `CDEK_TEST_MODE` | `true` или `false` | Тестовый режим (true для тестирования) |

### Настройки функции:
- **Runtime:** Node.js 18
- **Память:** 128 МБ
- **Таймаут:** 10 сек
- **HTTP:** Включить (публичная функция)

---

## 🔧 ФУНКЦИЯ 3: СОЗДАНИЕ ЗАКАЗА

### Название функции: `create-cdek-order`
### Точка входа: `index.handler`

### Структура ZIP-архива:
```
create-cdek-order.zip
├── index.js
└── lib/
    └── cdek-client.js
```

### Файл: `index.js`

```javascript
/**
 * Функция создания заказа в СДЭК
 * Работает одинаково для самозанятых и ИП
 */

const { CdekClient } = require('./lib/cdek-client');

exports.handler = async (event) => {
  try {
    // Получаем параметры из переменных окружения
    const clientId = process.env.CDEK_CLIENT_ID;
    const clientSecret = process.env.CDEK_CLIENT_SECRET;
    const isTest = process.env.CDEK_TEST_MODE === 'true';

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'CDEK API credentials not configured' 
        }),
      };
    }

    // Парсим данные запроса
    const orderData = JSON.parse(event.body || '{}');
    
    // Валидация обязательных полей
    const {
      type,
      number,
      tariff_code,
      recipient,
      from_location,
      to_location,
      packages
    } = orderData;

    // Проверка основных полей
    if (!type || !number || !tariff_code || !recipient || !packages) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: type, number, tariff_code, recipient, packages' 
        }),
      };
    }

    // Проверка packages
    if (!Array.isArray(packages) || packages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'packages must be a non-empty array' 
        }),
      };
    }

    // Проверка каждого package
    for (const pkg of packages) {
      if (!pkg.number || !pkg.weight) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            error: 'Each package must have number and weight' 
          }),
        };
      }
    }

    // Проверка from_location или to_location
    if (!from_location && !to_location) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'At least one of from_location or to_location is required' 
        }),
      };
    }

    // Инициализируем клиент СДЭК
    const cdek = new CdekClient(clientId, clientSecret, isTest);

    // Создаем заказ в СДЭК
    const result = await cdek.createOrder(orderData);

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
        data: result
      }),
    };

  } catch (error) {
    console.error('Error creating CDEK order:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to create CDEK order',
      statusCode: error.statusCode,
      code: error.code
    };
    
    if (error.errors) {
      errorResponse.errors = error.errors;
    }
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorResponse),
    };
  }
};
```

### Переменные окружения:

| Ключ | Значение | Описание |
|------|----------|----------|
| `CDEK_CLIENT_ID` | `ваш_client_id` | Client ID из личного кабинета СДЭК |
| `CDEK_CLIENT_SECRET` | `ваш_client_secret` | Client Secret из личного кабинета СДЭК |
| `CDEK_TEST_MODE` | `true` или `false` | Тестовый режим (true для тестирования) |

### Настройки функции:
- **Runtime:** Node.js 18
- **Память:** 128 МБ
- **Таймаут:** 10 сек
- **HTTP:** Включить (публичная функция)

---

## 🔧 ФУНКЦИЯ 4: ОТСЛЕЖИВАНИЕ ЗАКАЗА

### Название функции: `track-cdek-order`
### Точка входа: `index.handler`

### Структура ZIP-архива:
```
track-cdek-order.zip
├── index.js
└── lib/
    └── cdek-client.js
```

### Файл: `index.js`

```javascript
/**
 * Функция отслеживания статуса заказа в СДЭК
 * Работает одинаково для самозанятых и ИП
 */

const { CdekClient } = require('./lib/cdek-client');

exports.handler = async (event) => {
  try {
    // Получаем параметры из переменных окружения
    const clientId = process.env.CDEK_CLIENT_ID;
    const clientSecret = process.env.CDEK_CLIENT_SECRET;
    const isTest = process.env.CDEK_TEST_MODE === 'true';

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'CDEK API credentials not configured' 
        }),
      };
    }

    // Получаем UUID заказа из query параметров
    const uuid = event.queryStringParameters?.uuid;

    if (!uuid) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing required parameter: uuid' 
        }),
      };
    }

    // Инициализируем клиент СДЭК
    const cdek = new CdekClient(clientId, clientSecret, isTest);

    // Получаем информацию о заказе
    const result = await cdek.getOrder(uuid);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: result
      }),
    };

  } catch (error) {
    console.error('Error tracking CDEK order:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to track CDEK order',
      statusCode: error.statusCode,
      code: error.code
    };
    
    if (error.errors) {
      errorResponse.errors = error.errors;
    }
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorResponse),
    };
  }
};
```

### Переменные окружения:

| Ключ | Значение | Описание |
|------|----------|----------|
| `CDEK_CLIENT_ID` | `ваш_client_id` | Client ID из личного кабинета СДЭК |
| `CDEK_CLIENT_SECRET` | `ваш_client_secret` | Client Secret из личного кабинета СДЭК |
| `CDEK_TEST_MODE` | `true` или `false` | Тестовый режим (true для тестирования) |

### Настройки функции:
- **Runtime:** Node.js 18
- **Память:** 128 МБ
- **Таймаут:** 10 сек
- **HTTP:** Включить (публичная функция)

---

## 📝 ПОШАГОВАЯ ИНСТРУКЦИЯ ПО СОЗДАНИЮ ФУНКЦИЙ

### Для каждой из 4 функций выполните:

1. **Создайте папку на компьютере** (например, `calculate-delivery-cdek`)

2. **Создайте подпапку `lib`** внутри неё

3. **Скопируйте код библиотеки** из раздела "БИБЛИОТЕКА CDEK-CLIENT.JS" в файл `lib/cdek-client.js`

4. **Скопируйте код функции** из соответствующего раздела в файл `index.js`

5. **Создайте ZIP-архив** со следующей структурой:
   ```
   функция.zip
   ├── index.js
   └── lib/
       └── cdek-client.js
   ```
   
   **Важно:** Архивируйте сами файлы, а не папку!

6. **Загрузите в Yandex Cloud Functions:**
   - Откройте Cloud Functions в консоли Yandex Cloud
   - Нажмите "Создать функцию"
   - Укажите название функции
   - Выберите Runtime: **Node.js 18**
   - Загрузите ZIP-архив
   - Укажите точку входа: **index.handler**
   - Добавьте переменные окружения (см. таблицу для каждой функции)
   - Установите память: **128 МБ**
   - Установите таймаут: **10 секунд**
   - Сохраните функцию

7. **Включите HTTP-доступ:**
   - В настройках функции включите "Публичная функция"
   - Скопируйте URL функции (понадобится для API Gateway)

---

## 🎯 ТЕСТИРОВАНИЕ ФУНКЦИЙ

После создания всех функций протестируйте их:

### Тест 1: Расчет стоимости доставки
```bash
curl -X POST "https://ваша-функция.apigw.yandexcloud.net/calculate-delivery-cdek" \
  -H "Content-Type: application/json" \
  -d '{
    "to_location": {"code": 44},
    "packages": [{"weight": 1000, "length": 30, "width": 20, "height": 10}]
  }'
```

### Тест 2: Получение ПВЗ
```bash
curl "https://ваша-функция.apigw.yandexcloud.net/get-pvz-cdek?city_code=44"
```

### Тест 3: Отслеживание заказа
```bash
curl "https://ваша-функция.apigw.yandexcloud.net/track-cdek-order?uuid=ваш-uuid"
```

---

## ✅ ЧЕКЛИСТ

- [ ] Создана функция `calculate-delivery-cdek`
- [ ] Создана функция `get-pvz-cdek`
- [ ] Создана функция `create-cdek-order`
- [ ] Создана функция `track-cdek-order`
- [ ] Все функции имеют правильные переменные окружения
- [ ] Все функции публичные (HTTP включен)
- [ ] Получены URL всех функций для API Gateway

---

## 💡 ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **Библиотека `cdek-client.js` должна быть в каждой функции!**
2. **Переменные окружения одинаковые для всех функций**
3. **Для тестирования используйте `CDEK_TEST_MODE=true`**
4. **После тестирования переключите на боевой режим: `CDEK_TEST_MODE=false`**
5. **При переходе с самозанятого на ИП - просто обновите ключи в переменных окружения**

---

## 🆘 ЧАСТЫЕ ОШИБКИ

### Ошибка: "Cannot find module './lib/cdek-client'"
**Решение:** Проверьте структуру ZIP-архива. Библиотека должна быть в `lib/cdek-client.js`

### Ошибка: "CDEK API credentials not configured"
**Решение:** Добавьте переменные окружения `CDEK_CLIENT_ID` и `CDEK_CLIENT_SECRET`

### Ошибка: "Failed to get CDEK token"
**Решение:** Проверьте правильность Client ID и Client Secret

### Ошибка 401 Unauthorized
**Решение:** Убедитесь, что используете правильные учетные данные и включили тестовый режим для тестирования

---

Готово! Теперь у вас есть вся информация для создания функций методом copy-paste! 🎉
