# Руководство по деплою Cloud Functions для Рулетки Желаний

## Шаг 1: Деплой функций в Yandex Cloud

### 1.1 Деплой spin-wheel

```bash
cd yandex-functions/spin-wheel
zip -r function.zip .
yc serverless function version create \
  --function-name=spin-wheel \
  --runtime=nodejs18 \
  --entrypoint=index.handler \
  --memory=128m \
  --execution-timeout=10s \
  --source-path=./function.zip \
  --environment YDB_ENDPOINT=$YDB_ENDPOINT \
  --environment YDB_ACCESS_KEY_ID=$YDB_ACCESS_KEY_ID \
  --environment YDB_SECRET_KEY=$YDB_SECRET_KEY \
  --environment JWT_SECRET=$JWT_SECRET
```

**Сохраните function_id из вывода команды!**

### 1.2 Деплой get-wheel-status

```bash
cd yandex-functions/get-wheel-status
zip -r function.zip .
yc serverless function version create \
  --function-name=get-wheel-status \
  --runtime=nodejs18 \
  --entrypoint=index.handler \
  --memory=128m \
  --execution-timeout=5s \
  --source-path=./function.zip \
  --environment YDB_ENDPOINT=$YDB_ENDPOINT \
  --environment YDB_ACCESS_KEY_ID=$YDB_ACCESS_KEY_ID \
  --environment YDB_SECRET_KEY=$YDB_SECRET_KEY \
  --environment JWT_SECRET=$JWT_SECRET
```

**Сохраните function_id из вывода команды!**

### 1.3 Деплой get-wheel-history

```bash
cd yandex-functions/get-wheel-history
zip -r function.zip .
yc serverless function version create \
  --function-name=get-wheel-history \
  --runtime=nodejs18 \
  --entrypoint=index.handler \
  --memory=128m \
  --execution-timeout=5s \
  --source-path=./function.zip \
  --environment YDB_ENDPOINT=$YDB_ENDPOINT \
  --environment YDB_ACCESS_KEY_ID=$YDB_ACCESS_KEY_ID \
  --environment YDB_SECRET_KEY=$YDB_SECRET_KEY \
  --environment JWT_SECRET=$JWT_SECRET
```

**Сохраните function_id из вывода команды!**

## Шаг 2: Обновление API Gateway спецификации

Откройте файл `api-gateway-spec.yaml` и замените плейсхолдеры на реальные function_id:

1. **Строка 755**: Замените `REPLACE_WITH_SPIN_WHEEL_FUNCTION_ID` на ID функции spin-wheel
2. **Строка 780**: Замените `REPLACE_WITH_GET_WHEEL_STATUS_FUNCTION_ID` на ID функции get-wheel-status
3. **Строка 818**: Замените `REPLACE_WITH_GET_WHEEL_HISTORY_FUNCTION_ID` на ID функции get-wheel-history

Пример:
```yaml
function_id: d4e1234567890abcdef  # Ваш реальный ID
```

## Шаг 3: Обновление API Gateway

```bash
yc serverless api-gateway update <your-api-gateway-id> \
  --spec=api-gateway-spec.yaml
```

## Шаг 4: Проверка работы эндпоинтов

### Проверка статуса рулетки
```bash
curl -X GET \
  https://<your-gateway-url>/wheel/status \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Вращение рулетки
```bash
curl -X POST \
  https://<your-gateway-url>/wheel/spin \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Получение истории
```bash
curl -X GET \
  https://<your-gateway-url>/wheel/history?limit=10&offset=0 \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Переменные окружения

Убедитесь, что следующие переменные окружения установлены:

- `YDB_ENDPOINT` - эндпоинт YDB базы данных
- `YDB_ACCESS_KEY_ID` - access key для YDB
- `YDB_SECRET_KEY` - secret key для YDB
- `JWT_SECRET` - секрет для подписи JWT токенов

## Следующие шаги

После успешного деплоя функций:

1. ✅ Создайте таблицы `wheelPrizes` и `wheelHistory` в YDB (см. `CREATE_TABLES.md`)
2. ✅ Создайте индексы на поле `userId` для обеих таблиц
3. ✅ Обновите функцию `create-order` для начисления спинов
4. ✅ Протестируйте все эндпоинты с реальными данными

## Troubleshooting

### Ошибка "Index not found"
Если видите ошибки о несуществующих индексах, не волнуйтесь - функции используют Scan fallback и будут работать, просто медленнее. Создайте индексы в YDB для улучшения производительности.

### Ошибка "Table not found"
Убедитесь, что таблицы `wheelPrizes` и `wheelHistory` созданы в YDB.

### Ошибка "Unauthorized"
Проверьте, что JWT_SECRET одинаковый во всех функциях и соответствует секрету, используемому для генерации токенов.
