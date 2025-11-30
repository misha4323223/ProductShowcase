# 🔌 API Gateway Настройка для Telegram

## Конечная точка (используй в коде):
```
https://d4efkrvud5o73t4cskgk.functions.yandexcloud.net
```

## Действия (actions):
1. `get_subscribers` - получить список всех подписчиков
2. `send` - отправить рассылку

## Примеры запросов:

### Получить подписчиков:
```bash
curl -X POST https://d4efkrvud5o73t4cskgk.functions.yandexcloud.net \
  -H "Content-Type: application/json" \
  -d '{"action":"get_subscribers"}'
```

### Отправить рассылку:
```bash
curl -X POST https://d4efkrvud5o73t4cskgk.functions.yandexcloud.net \
  -H "Content-Type: application/json" \
  -d '{
    "action":"send",
    "title":"Новые скидки!",
    "message":"У нас новые скидки на конфеты"
  }'
```

## В Replit используй:
```typescript
const response = await fetch("https://d4efkrvud5o73t4cskgk.functions.yandexcloud.net", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "get_subscribers" })
});
```
