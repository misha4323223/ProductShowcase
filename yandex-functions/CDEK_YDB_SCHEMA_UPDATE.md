# 📊 Обновление схемы YDB для поддержки доставки

## Необходимые изменения в таблице `orders`

Чтобы поддержать интеграцию с СДЭК, нужно добавить новые поля в таблицу `orders`.

---

## 🔧 Шаг 1: Обновление схемы в YDB

### Новые поля для таблицы `orders`

Добавьте следующие поля в вашу таблицу `orders`:

```sql
-- Общие поля доставки
deliveryService: String        -- Служба доставки: "CDEK" | null
deliveryType: String           -- Тип доставки: "COURIER" | "PICKUP" | null
deliveryStatus: String         -- Статус доставки: "PENDING" | "IN_TRANSIT" | "DELIVERED" | null

-- Адрес доставки (для курьерской доставки)
deliveryAddress: String        -- Полный адрес доставки
deliveryCity: String           -- Город доставки
deliveryPostalCode: String     -- Почтовый индекс
deliveryRecipientName: String  -- ФИО получателя
deliveryRecipientPhone: String -- Телефон получателя

-- Данные пункта выдачи (для доставки в ПВЗ)
deliveryPointCode: String      -- Код ПВЗ
deliveryPointName: String      -- Название ПВЗ
deliveryPointAddress: String   -- Адрес ПВЗ

-- Данные СДЭК
cdekOrderUuid: String          -- UUID заказа в СДЭК
cdekOrderNumber: String        -- Номер накладной СДЭК
cdekTrackNumber: String        -- Трек-номер для отслеживания
cdekTariffCode: Number         -- Код тарифа СДЭК
cdekDeliveryCost: Number       -- Стоимость доставки СДЭК

-- Расчетная информация
estimatedDeliveryDays: Number  -- Примерный срок доставки (дней)
deliveryCalculatedAt: String   -- Когда был произведен расчет (ISO timestamp)
```

### Команда для YDB Console

Перейдите в **YDB Console** → ваша база → **Выполнить запрос**:

```sql
ALTER TABLE orders ADD COLUMN deliveryService String;
ALTER TABLE orders ADD COLUMN deliveryType String;
ALTER TABLE orders ADD COLUMN deliveryStatus String;

ALTER TABLE orders ADD COLUMN deliveryAddress String;
ALTER TABLE orders ADD COLUMN deliveryCity String;
ALTER TABLE orders ADD COLUMN deliveryPostalCode String;
ALTER TABLE orders ADD COLUMN deliveryRecipientName String;
ALTER TABLE orders ADD COLUMN deliveryRecipientPhone String;

ALTER TABLE orders ADD COLUMN deliveryPointCode String;
ALTER TABLE orders ADD COLUMN deliveryPointName String;
ALTER TABLE orders ADD COLUMN deliveryPointAddress String;

ALTER TABLE orders ADD COLUMN cdekOrderUuid String;
ALTER TABLE orders ADD COLUMN cdekOrderNumber String;
ALTER TABLE orders ADD COLUMN cdekTrackNumber String;
ALTER TABLE orders ADD COLUMN cdekTariffCode Int64;
ALTER TABLE orders ADD COLUMN cdekDeliveryCost Double;

ALTER TABLE orders ADD COLUMN estimatedDeliveryDays Int64;
ALTER TABLE orders ADD COLUMN deliveryCalculatedAt String;
```

⚠️ **Важно:** Выполняйте команды по одной, если получаете ошибки при пакетном выполнении.

---

## 📝 Шаг 2: Обновление функции `create-order`

Обновите файл `yandex-functions/create-order/index.js` чтобы сохранять данные доставки:

### Пример обновленного кода:

```javascript
// В обработчике создания заказа добавьте:

const order = {
  ...orderData,
  id,
  createdAt: new Date().toISOString(),
  status: 'pending',
  
  // Данные доставки
  deliveryService: orderData.deliveryService || null,
  deliveryType: orderData.deliveryType || null,
  deliveryStatus: 'PENDING',
  
  // Адрес доставки
  deliveryAddress: orderData.deliveryAddress || null,
  deliveryCity: orderData.deliveryCity || null,
  deliveryPostalCode: orderData.deliveryPostalCode || null,
  deliveryRecipientName: orderData.deliveryRecipientName || null,
  deliveryRecipientPhone: orderData.deliveryRecipientPhone || null,
  
  // Данные ПВЗ
  deliveryPointCode: orderData.deliveryPointCode || null,
  deliveryPointName: orderData.deliveryPointName || null,
  deliveryPointAddress: orderData.deliveryPointAddress || null,
  
  // Данные СДЭК
  cdekOrderUuid: orderData.cdekOrderUuid || null,
  cdekOrderNumber: orderData.cdekOrderNumber || null,
  cdekTrackNumber: orderData.cdekTrackNumber || null,
  cdekTariffCode: orderData.cdekTariffCode || null,
  cdekDeliveryCost: orderData.cdekDeliveryCost || null,
  
  // Расчетная информация
  estimatedDeliveryDays: orderData.estimatedDeliveryDays || null,
  deliveryCalculatedAt: orderData.deliveryCalculatedAt || null,
};

// Сохранить заказ в YDB
await docClient.send(new PutCommand({
  TableName: "orders",
  Item: order,
}));
```

---

## 🔄 Интеграция с СДЭК при оформлении заказа

### Полный процесс оформления заказа с доставкой СДЭК:

```javascript
// 1. Пользователь выбирает товары и переходит к оформлению

// 2. Пользователь выбирает способ доставки
const deliveryService = "CDEK";
const deliveryType = "PICKUP"; // или "COURIER"

// 3. Если PICKUP - выбирает ПВЗ
// Запрос к API для получения списка ПВЗ
const response = await fetch(
  'https://your-api-gateway.apigw.yandexcloud.net/api/delivery/cdek/points?city_code=270'
);
const { data: points } = await response.json();

// Пользователь выбирает ПВЗ из списка
const selectedPoint = points[0];

// 4. Расчет стоимости доставки
const calcResponse = await fetch(
  'https://your-api-gateway.apigw.yandexcloud.net/api/delivery/cdek/calculate',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to_location: { code: selectedPoint.location.city_code },
      packages: [{
        weight: 1000, // вес в граммах
        height: 10,
        width: 10,
        length: 10
      }]
    })
  }
);

const { data: tariffs } = await calcResponse.json();
const selectedTariff = tariffs[0];

// 5. Создание заказа в вашей системе
const orderData = {
  userId: currentUser.id,
  userEmail: currentUser.email,
  items: cartItems,
  total: cartTotal + selectedTariff.delivery_sum,
  
  // Данные доставки
  deliveryService: "CDEK",
  deliveryType: "PICKUP",
  deliveryPointCode: selectedPoint.code,
  deliveryPointName: selectedPoint.name,
  deliveryPointAddress: selectedPoint.location.address_full,
  deliveryRecipientName: recipientName,
  deliveryRecipientPhone: recipientPhone,
  
  // Данные СДЭК
  cdekTariffCode: selectedTariff.tariff_code,
  cdekDeliveryCost: selectedTariff.delivery_sum,
  estimatedDeliveryDays: selectedTariff.period_min,
  deliveryCalculatedAt: new Date().toISOString(),
};

// Создать заказ
const createOrderResponse = await fetch(
  'https://your-api-gateway.apigw.yandexcloud.net/api/orders',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  }
);

const { orderId } = await createOrderResponse.json();

// 6. Создание заказа в СДЭК (опционально - можно делать позже)
const cdekOrderData = {
  type: 1, // доставка до склада
  number: orderId, // ваш номер заказа
  tariff_code: selectedTariff.tariff_code,
  recipient: {
    name: recipientName,
    phones: [{ number: recipientPhone }]
  },
  to_location: {
    code: selectedPoint.location.city_code
  },
  delivery_point: selectedPoint.code,
  packages: [{
    number: "1",
    weight: 1000,
    height: 10,
    width: 10,
    length: 10
  }]
};

const cdekResponse = await fetch(
  'https://your-api-gateway.apigw.yandexcloud.net/api/delivery/cdek/order',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cdekOrderData)
  }
);

const { data: cdekOrder } = await cdekResponse.json();

// 7. Обновить заказ с данными СДЭК
await fetch(
  `https://your-api-gateway.apigw.yandexcloud.net/api/orders/${orderId}`,
  {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cdekOrderUuid: cdekOrder.entity.uuid,
      cdekOrderNumber: cdekOrder.entity.cdek_number,
      deliveryStatus: 'IN_TRANSIT'
    })
  }
);
```

---

## ✅ Проверка

После обновления схемы проверьте:

1. ✅ Все поля добавлены в таблицу `orders`
2. ✅ Функция `create-order` обновлена для сохранения данных доставки
3. ✅ Тестовый заказ создается с полями доставки
4. ✅ Данные корректно сохраняются и читаются из YDB

---

## 📚 Дополнительная информация

**Коды тарифов СДЭК:**
- `136` - Посылка склад-склад
- `137` - Посылка склад-дверь
- `138` - Посылка дверь-склад
- `139` - Посылка дверь-дверь
- `234` - Экономичная посылка склад-склад
- `233` - Экономичная посылка склад-дверь

Полный список: https://api-docs.cdek.ru/63345519.html
