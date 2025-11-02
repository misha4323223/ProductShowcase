# Настройка Yandex Cloud Postbox для Sweet Delights

Это руководство поможет вам настроить email-уведомления через Yandex Cloud Postbox для вашего магазина Sweet Delights.

## Обзор архитектуры

1. **Статический сайт** (GitHub Pages) → вызывает
2. **Yandex Cloud Function** (`send-email`) → использует
3. **Yandex Cloud Postbox API** (совместим с AWS SES) → отправляет email

Эта архитектура необходима, так как статический сайт на GitHub Pages не может напрямую вызывать Postbox API (нужны приватные credentials).

## Шаг 1: Настройка Yandex Cloud Postbox

### 1.1 Создание аккаунта Postbox

1. Перейдите в [Yandex Cloud Console](https://console.yandex.cloud/)
2. Выберите ваш каталог (folder)
3. В списке сервисов найдите **Postbox**
4. Нажмите "Создать адрес"

### 1.2 Верификация домена

Для отправки email от вашего домена необходимо подтвердить владение:

1. **Добавьте домен** в Postbox (например: `sweetdelights.store`)
2. Вам будут предоставлены **DNS-записи** для верификации
3. Добавьте следующие записи в DNS вашего домена:
   ```
   Тип: TXT
   Имя: _yandex-verification
   Значение: [код от Yandex Cloud]
   ```
4. Дождитесь подтверждения (может занять до 24 часов)

### 1.3 Настройка DKIM и SPF (рекомендуется)

Для улучшения доставляемости писем настройте DKIM и SPF:

**SPF запись:**
```
Тип: TXT
Имя: @
Значение: v=spf1 include:_spf.yandex.net ~all
```

**DKIM запись:**
```
Тип: TXT
Имя: mail._domainkey
Значение: [предоставлено Yandex Cloud]
```

### 1.4 Создание email адреса отправителя

1. В Postbox создайте адрес: `noreply@sweetdelights.store`
2. Подтвердите адрес через email (если требуется)

## Шаг 2: Создание сервисного аккаунта

### 2.1 Создание SA

1. Перейдите в **IAM** → **Сервисные аккаунты**
2. Нажмите "Создать сервисный аккаунт"
3. Имя: `postbox-sender`
4. Роли:
   - `postbox.sender` - для отправки email
   - `postbox.admin` - для управления (опционально)

### 2.2 Создание статических ключей доступа

1. Откройте созданный сервисный аккаунт
2. Вкладка "Ключи доступа" → "Создать новый ключ"
3. Выберите **Статический ключ доступа**
4. Сохраните:
   - **Идентификатор ключа** (Access Key ID)
   - **Секретный ключ** (Secret Access Key)

⚠️ **Важно**: Секретный ключ показывается только один раз! Сохраните его надежно.

## Шаг 3: Настройка Yandex Cloud Function

### 3.1 Создание функции

1. Перейдите в **Cloud Functions**
2. Нажмите "Создать функцию"
3. Параметры:
   - Имя: `send-email`
   - Среда выполнения: `nodejs18`
   - Точка входа: `index.handler`
   - Таймаут: `30 сек`
   - Память: `128 МБ`

### 3.2 Загрузка кода функции

Используйте код из файла `yandex-functions/send-email/index.js`:

```javascript
const https = require('https');

const POSTBOX_ACCESS_KEY_ID = process.env.POSTBOX_ACCESS_KEY_ID;
const POSTBOX_SECRET_ACCESS_KEY = process.env.POSTBOX_SECRET_ACCESS_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@sweetdelights.store';
const REGION = 'ru-central1';

// Полный код см. в yandex-functions/send-email/index.js
```

### 3.3 Настройка переменных окружения

В настройках функции добавьте:

| Ключ | Значение |
|------|----------|
| `POSTBOX_ACCESS_KEY_ID` | [Access Key ID из шага 2.2] |
| `POSTBOX_SECRET_ACCESS_KEY` | [Secret Access Key из шага 2.2] |
| `FROM_EMAIL` | `noreply@sweetdelights.store` |
| `STORE_NAME` | `Sweet Delights` |

### 3.4 Тестирование функции

Создайте тестовый запрос:

```json
{
  "httpMethod": "POST",
  "body": "{\"to\":[\"your-email@example.com\"],\"subject\":\"Test\",\"htmlBody\":\"<p>Test message</p>\"}"
}
```

Нажмите "Запустить тест" и проверьте, что письмо доставлено.

## Шаг 4: Настройка API Gateway

### 4.1 Создание API Gateway

1. Перейдите в **API Gateway**
2. Нажмите "Создать API-шлюз"
3. Имя: `sweet-delights-api`
4. Тип: `HTTP API`

### 4.2 Спецификация OpenAPI

Используйте следующую спецификацию:

```yaml
openapi: 3.0.0
info:
  title: Sweet Delights Email API
  version: 1.0.0

paths:
  /send-email:
    post:
      summary: Send email via Postbox
      x-yc-apigateway-integration:
        type: cloud_functions
        function_id: [ID вашей функции send-email]
        service_account_id: [ID сервисного аккаунта]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - to
                - subject
              properties:
                to:
                  type: array
                  items:
                    type: string
                subject:
                  type: string
                htmlBody:
                  type: string
                textBody:
                  type: string
      responses:
        '200':
          description: Email sent successfully
        '400':
          description: Bad request
        '500':
          description: Internal server error
```

### 4.3 Получение URL API Gateway

После создания скопируйте **Служебный домен**:
```
https://[gateway-id].apigw.yandexcloud.net
```

Полный URL для отправки email:
```
https://[gateway-id].apigw.yandexcloud.net/send-email
```

## Шаг 5: Настройка клиента в GitHub Pages

### 5.1 Добавление URL в GitHub Secrets

1. Перейдите в настройки вашего GitHub репозитория
2. **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret**
4. Добавьте:
   - Name: `VITE_API_GATEWAY_URL`
   - Value: `https://[gateway-id].apigw.yandexcloud.net`

### 5.2 Настройка GitHub Actions

Убедитесь, что ваш `.github/workflows/deploy.yml` использует секрет:

```yaml
- name: Build
  env:
    VITE_API_GATEWAY_URL: ${{ secrets.VITE_API_GATEWAY_URL }}
  run: npm run build
```

### 5.3 Перезапуск деплоя

1. Перейдите в **Actions**
2. Запустите workflow вручную или сделайте новый commit
3. После деплоя проверьте, что переменная доступна

## Шаг 6: Тестирование всей системы

### 6.1 Проверка подписки на рассылку

1. Откройте ваш сайт на GitHub Pages
2. Прокрутите вниз до футера
3. Введите email в форму "Подписка на новости"
4. Нажмите "Подписаться"
5. Проверьте email - должно прийти подтверждение

### 6.2 Проверка уведомлений о заказе

1. Добавьте товар в корзину
2. Оформите заказ с вашим email
3. Проверьте - должно прийти письмо с подтверждением заказа

### 6.3 Проверка уведомлений о наличии

1. Подпишитесь на товар, которого нет в наличии
2. В админ-панели увеличьте stock товара
3. Проверьте email - должно прийти уведомление о появлении товара

## Шаг 7: Мониторинг и логи

### 7.1 Просмотр логов функции

1. Откройте **Cloud Functions** → `send-email`
2. Вкладка **Логи**
3. Здесь вы увидите все вызовы функции и ошибки

### 7.2 Мониторинг Postbox

1. Откройте **Postbox** → **Мониторинг**
2. Проверьте статистику отправки:
   - Отправлено писем
   - Доставлено писем
   - Отказы (bounces)
   - Жалобы (complaints)

### 7.3 Квоты и лимиты

Yandex Cloud Postbox имеет лимиты:
- **Песочница (sandbox)**: 200 писем/день
- **Продуктивный режим**: до 50,000 писем/день (требует запроса)

Для перехода в продуктивный режим:
1. Откройте тикет в поддержке Yandex Cloud
2. Укажите назначение (транзакционные письма для магазина)
3. Дождитесь одобрения

## Типичные проблемы

### Проблема: "Access Denied" при вызове функции

**Решение:**
1. Проверьте, что сервисный аккаунт имеет роль `postbox.sender`
2. Проверьте, что переменные окружения установлены корректно
3. Убедитесь, что Access Key ID и Secret Access Key правильные

### Проблема: Письма не доставляются

**Решение:**
1. Проверьте, что домен подтвержден в Postbox
2. Настройте SPF и DKIM записи
3. Проверьте папку "Спам" в почте
4. Убедитесь, что вы не в режиме песочницы (или получатель в белом списке)

### Проблема: "Signature does not match"

**Решение:**
1. Убедитесь, что системное время в Cloud Function корректное
2. Проверьте правильность Secret Access Key
3. Попробуйте пересоздать статический ключ доступа

### Проблема: CORS ошибки

**Решение:**
API Gateway автоматически обрабатывает CORS. Если проблема сохраняется:
1. Убедитесь, что запрос идет через API Gateway, а не напрямую к функции
2. Проверьте, что функция возвращает правильные CORS-заголовки

## Дополнительная настройка

### Настройка шаблонов писем

Шаблоны находятся в `client/src/services/postbox-client.ts`. Вы можете изменить:
- Дизайн email (CSS стили)
- Текст сообщений
- Логотип магазина
- Контактную информацию

### Массовая рассылка

Для отправки массовых рассылок используйте админ-панель:
1. Войдите в `/admin`
2. Перейдите на вкладку "Рассылка"
3. Заполните тему и текст
4. Нажмите "Отправить рассылку всем подписчикам"

⚠️ **Внимание**: Соблюдайте лимиты Postbox при массовых рассылках!

### Отписка от рассылки

Каждое письмо рассылки содержит ссылку "Отписаться". При клике:
1. Пользователь попадает на страницу с формой отписки
2. После отписки его email удаляется из YDB таблицы `newsletterSubscriptions`
3. Он больше не получает массовые рассылки

## Безопасность

1. **Никогда** не коммитьте ключи доступа в Git
2. Используйте GitHub Secrets для хранения API Gateway URL
3. Регулярно ротируйте статические ключи доступа
4. Проверяйте логи на подозрительную активность
5. Ограничьте доступ к админ-панели (она требует Firebase Authentication)

## Поддержка

Если возникли проблемы:
1. Проверьте логи Cloud Function
2. Проверьте мониторинг Postbox
3. Обратитесь в поддержку Yandex Cloud: https://yandex.cloud/ru/support

---

**Готово!** Ваша система email-уведомлений через Yandex Cloud Postbox настроена и работает.
