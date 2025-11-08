# Рулетка Желаний - Статус Реализации

## Описание системы

"Рулетка Желаний" (Wishlist Wheel) - система лояльности для магазина Sweet Delights, где пользователи зарабатывают спины за покупки и получают персонализированные призы, связанные с их избранным (wishlist).

### Основные характеристики:
- **Начисление спинов**: 1 спин за каждые потраченные 1000₽
- **Количество призов**: 6 типов с разной вероятностью
- **Персонализация**: Призы связаны с товарами из избранного пользователя
- **Архитектура**: Статический фронтенд (GitHub Pages) + Yandex Cloud Functions бэкенд

---

## ✅ ВЫПОЛНЕНО: Frontend

### 1. Типы и интерфейсы (`client/src/types/firebase-types.ts`)

Добавлены TypeScript типы для всех сущностей системы рулетки:

```typescript
// Типы призов
export type PrizeType = 
  | 'discount_10'      // 10% на весь заказ (30% вероятность)
  | 'discount_20'      // 20% на случайный товар из wishlist (25%)
  | 'points'           // +200 бонусных баллов (20%)
  | 'delivery'         // Бесплатная доставка (15%)
  | 'free_item'        // Бесплатно самый дешевый товар (8%)
  | 'jackpot';         // 40% скидка на весь wishlist (2%)

// Интерфейс приза
interface WheelPrize {
  id: string;
  userId: string;
  prizeType: PrizeType;
  promoCode: string;
  productId?: string;
  productName?: string;
  expiresAt: string;
  isUsed: boolean;
  wonAt: string;
}

// История выигрышей
interface WheelHistory {
  id: string;
  userId: string;
  prizeType: PrizeType;
  wonAt: string;
  productName?: string;
}

// Статистика
interface WheelStats {
  totalWins: number;
  winsByType: Record<PrizeType, number>;
}
```

### 2. API клиент (`client/src/services/api-client.ts`)

Реализованы методы для взаимодействия с backend:

```typescript
// Получение статуса рулетки
getWheelStatus(userId: string): Promise<WheelStatusResponse>

// Вращение рулетки
spinWheel(): Promise<SpinWheelResponse>

// История выигрышей
getWheelHistory(userId: string): Promise<WheelHistory[]>

// Активные призы
getActivePrizes(userId: string): Promise<WheelPrize[]>
```

**Конфигурация:**
- Base URL: `https://functions.yandexcloud.net/d4...` (из переменной окружения)
- Авторизация: Bearer token из localStorage
- Обработка ошибок с fallback сообщениями

### 3. Контекст состояния (`client/src/contexts/WheelContext.tsx`)

React Context для управления состоянием рулетки:

**Состояние:**
- `spins` - доступные спины
- `totalSpinsEarned` - всего заработано спинов
- `totalWheelSpins` - всего прокручено
- `loyaltyPoints` - баланс бонусных баллов
- `activePrizes` - активные (неиспользованные) призы
- `history` - история всех выигрышей
- `stats` - статистика по типам призов

**Методы:**
- `spin()` - выполнить вращение рулетки
- `refreshStatus()` - обновить статус из API

**Логика:**
- Автоматическая загрузка данных при авторизации
- Локальное обновление счетчиков после выигрыша
- Сброс состояния при выходе из аккаунта

### 4. Компонент рулетки (`client/src/components/WheelModal.tsx`)

Полнофункциональный модальный компонент с анимацией:

**Визуальные элементы:**
- Круговая рулетка с 6 цветными секторами
- Каждый сектор имеет:
  - Уникальный градиент (purple, pink, amber, blue, green, red-orange)
  - Иконку (Percent, Gift, Coins, Truck, Star, Trophy)
  - Название приза
  - Вероятность выпадения

**Анимация:**
- 5-8 полных оборотов при вращении
- Плавное замедление (cubic-bezier timing)
- 4 секунды длительность анимации
- Случайный угол финальной остановки

**Логика вращения:**
1. Проверка авторизации пользователя
2. Проверка наличия спинов
3. Проверка вишлиста (должен быть не пуст)
4. Запуск анимации вращения
5. Асинхронный запрос к API
6. Ожидание завершения анимации
7. Показ модального окна с результатом

**Модалка результата:**
- Анимированный emoji приза
- Название и описание
- Товар (если применимо)
- Промокод для применения
- Срок действия приза

**Отображение вишлиста:**
- Превью до 8 товаров
- Счетчик остальных товаров
- Подсказка при пустом вишлисте

### 5. Интеграция в Header (`client/src/components/Header.tsx`)

Добавлена иконка рулетки в хедер:

**Расположение:**
- Между ThemeToggle и Wishlist
- Только для авторизованных пользователей

**Визуал:**
- Желто-золотой градиент (from-yellow-400 via-amber-500 to-yellow-600)
- Иконка Sparkles из lucide-react
- Анимация pulse при наличии спинов
- Jelly-wobble эффект при наведении

**Бейдж спинов:**
- Красно-оранжевый градиент
- Показывается только при spins > 0
- Bounce анимация при получении нового спина
- Позиция: правый верхний угол иконки

**Поведение:**
- Отслеживание изменений `wheelSpins`
- Bounce анимация при увеличении спинов
- Клик открывает WheelModal

### 6. Глобальная интеграция

**App.tsx:**
- `WheelProvider` добавлен в дерево провайдеров
- Расположение: внутри `WishlistProvider`, до `TooltipProvider`

**Home.tsx:**
- Подключен `useWheel()` хук
- State для `wheelOpen`
- Передача `wheelSpins` и `onWheelClick` в Header
- Рендер `WheelModal` компонента

---

## 🔄 ТРЕБУЕТСЯ: Backend (Yandex Cloud Functions)

### API Endpoints

Необходимо реализовать следующие Cloud Functions:

#### 1. `GET /wheel/status`
**Описание:** Получение статуса рулетки пользователя

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "spins": 3,
  "totalSpinsEarned": 15,
  "totalWheelSpins": 12,
  "loyaltyPoints": 850,
  "activePrizes": [
    {
      "id": "prize_123",
      "userId": "user_456",
      "prizeType": "discount_10",
      "promoCode": "WHEEL10-ABC123",
      "expiresAt": "2025-12-08T00:00:00Z",
      "isUsed": false,
      "wonAt": "2025-11-08T10:30:00Z"
    }
  ],
  "stats": {
    "totalWins": 12,
    "winsByType": {
      "discount_10": 4,
      "discount_20": 3,
      "points": 2,
      "delivery": 2,
      "free_item": 1,
      "jackpot": 0
    }
  }
}
```

#### 2. `POST /wheel/spin`
**Описание:** Выполнить вращение рулетки

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{}
```

**Response (Success):**
```json
{
  "success": true,
  "prize": {
    "id": "prize_789",
    "userId": "user_456",
    "prizeType": "discount_20",
    "promoCode": "WHEEL20-XYZ789",
    "productId": "prod_111",
    "productName": "Шоколад Милка",
    "expiresAt": "2025-12-08T00:00:00Z",
    "isUsed": false,
    "wonAt": "2025-11-08T11:00:00Z"
  }
}
```

**Response (Error - No spins):**
```json
{
  "success": false,
  "error": "Недостаточно спинов"
}
```

**Response (Error - Empty wishlist):**
```json
{
  "success": false,
  "error": "Добавьте товары в избранное"
}
```

#### 3. `GET /wheel/history`
**Описание:** История выигрышей пользователя

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "history_1",
    "userId": "user_456",
    "prizeType": "jackpot",
    "wonAt": "2025-11-01T15:20:00Z",
    "productName": null
  },
  {
    "id": "history_2",
    "userId": "user_456",
    "prizeType": "discount_20",
    "wonAt": "2025-11-05T09:10:00Z",
    "productName": "Конфеты Raffaello"
  }
]
```

#### 4. `GET /wheel/prizes`
**Описание:** Активные призы пользователя (не использованные и не истекшие)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "prize_123",
    "userId": "user_456",
    "prizeType": "delivery",
    "promoCode": "WHEELDEL-ABC",
    "expiresAt": "2025-11-15T00:00:00Z",
    "isUsed": false,
    "wonAt": "2025-11-08T08:00:00Z"
  }
]
```

### База данных (YDB)

Необходимо создать следующие таблицы:

#### Таблица `users_wheel_data`
```sql
CREATE TABLE users_wheel_data (
  userId TEXT PRIMARY KEY,
  spins INTEGER DEFAULT 0,
  totalSpinsEarned INTEGER DEFAULT 0,
  totalWheelSpins INTEGER DEFAULT 0,
  loyaltyPoints INTEGER DEFAULT 0,
  lastUpdated TIMESTAMP
);
```

#### Таблица `wheel_prizes`
```sql
CREATE TABLE wheel_prizes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  prizeType TEXT NOT NULL,
  promoCode TEXT NOT NULL UNIQUE,
  productId TEXT,
  productName TEXT,
  expiresAt TIMESTAMP NOT NULL,
  isUsed BOOLEAN DEFAULT false,
  wonAt TIMESTAMP NOT NULL,
  usedAt TIMESTAMP,
  INDEX idx_user_active (userId, isUsed, expiresAt)
);
```

#### Таблица `wheel_history`
```sql
CREATE TABLE wheel_history (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  prizeType TEXT NOT NULL,
  wonAt TIMESTAMP NOT NULL,
  productName TEXT,
  INDEX idx_user_date (userId, wonAt DESC)
);
```

### Бизнес-логика

#### Начисление спинов
- **Триггер**: После успешного оформления заказа
- **Формула**: `spins = Math.floor(orderTotal / 1000)`
- **Обновление**: `users_wheel_data.spins += earnedSpins`

Пример:
```javascript
// В Cloud Function обработки заказа
async function handleOrderComplete(order) {
  const earnedSpins = Math.floor(order.total / 1000);
  
  if (earnedSpins > 0) {
    await db.run(`
      UPDATE users_wheel_data 
      SET spins = spins + ${earnedSpins},
          totalSpinsEarned = totalSpinsEarned + ${earnedSpins}
      WHERE userId = '${order.userId}'
    `);
  }
}
```

#### Алгоритм выбора приза

```javascript
// Вероятности призов
const PRIZE_PROBABILITIES = [
  { type: 'discount_10', weight: 30 },    // 30%
  { type: 'discount_20', weight: 25 },    // 25%
  { type: 'points', weight: 20 },         // 20%
  { type: 'delivery', weight: 15 },       // 15%
  { type: 'free_item', weight: 8 },       // 8%
  { type: 'jackpot', weight: 2 },         // 2%
];

function selectPrize(wishlistItems) {
  const totalWeight = 100;
  const random = Math.random() * totalWeight;
  
  let cumulative = 0;
  for (const prize of PRIZE_PROBABILITIES) {
    cumulative += prize.weight;
    if (random < cumulative) {
      return createPrize(prize.type, wishlistItems);
    }
  }
}

function createPrize(prizeType, wishlistItems) {
  const prize = {
    id: generateId(),
    prizeType,
    promoCode: generatePromoCode(prizeType),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
    isUsed: false,
    wonAt: new Date(),
  };

  // Для призов, связанных с конкретным товаром
  if (['discount_20', 'free_item'].includes(prizeType)) {
    const targetProduct = prizeType === 'free_item' 
      ? getCheapestWishlistItem(wishlistItems)
      : getRandomWishlistItem(wishlistItems);
    
    prize.productId = targetProduct.id;
    prize.productName = targetProduct.name;
  }

  return prize;
}
```

#### Генерация промокодов

```javascript
function generatePromoCode(prizeType) {
  const prefixes = {
    'discount_10': 'WHEEL10',
    'discount_20': 'WHEEL20',
    'points': 'WHEELPTS',
    'delivery': 'WHEELDEL',
    'free_item': 'WHEELFREE',
    'jackpot': 'WHEELJACK',
  };
  
  const prefix = prefixes[prizeType];
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `${prefix}-${random}`;
}
```

#### Применение призов

При оформлении заказа необходимо проверять и применять промокоды из рулетки:

```javascript
async function applyWheelPromoCode(userId, promoCode, cart) {
  const prize = await db.get(`
    SELECT * FROM wheel_prizes 
    WHERE userId = '${userId}' 
    AND promoCode = '${promoCode}'
    AND isUsed = false
    AND expiresAt > NOW()
  `);
  
  if (!prize) {
    throw new Error('Промокод не найден или истек');
  }
  
  let discount = 0;
  
  switch (prize.prizeType) {
    case 'discount_10':
      discount = cart.total * 0.10;
      break;
      
    case 'discount_20':
      const item = cart.items.find(i => i.productId === prize.productId);
      if (item) {
        discount = item.price * 0.20;
      }
      break;
      
    case 'points':
      // Начислить баллы
      await creditPoints(userId, 200);
      break;
      
    case 'delivery':
      discount = cart.deliveryFee;
      break;
      
    case 'free_item':
      const freeItem = cart.items.find(i => i.productId === prize.productId);
      if (freeItem) {
        discount = freeItem.price;
      }
      break;
      
    case 'jackpot':
      // 40% на все товары из wishlist в корзине
      const wishlistItemsInCart = cart.items.filter(item => 
        userWishlist.includes(item.productId)
      );
      discount = wishlistItemsInCart.reduce((sum, item) => 
        sum + (item.price * 0.40), 0
      );
      break;
  }
  
  // Пометить приз как использованный
  await db.run(`
    UPDATE wheel_prizes 
    SET isUsed = true, usedAt = NOW()
    WHERE id = '${prize.id}'
  `);
  
  return discount;
}
```

### Интеграция с существующей системой

#### 1. Модуль заказов
При успешном создании заказа начислять спины:

```javascript
// В Cloud Function создания заказа
exports.createOrder = async (req, res) => {
  const order = await saveOrder(req.body);
  
  // Начислить спины
  const spins = Math.floor(order.total / 1000);
  if (spins > 0) {
    await addSpins(order.userId, spins);
  }
  
  res.json({ success: true, order });
};
```

#### 2. Модуль промокодов
Добавить поддержку рулеточных промокодов:

```javascript
exports.validatePromoCode = async (req, res) => {
  const { code, userId, cart } = req.body;
  
  // Проверить обычные промокоды
  let promo = await db.get(`SELECT * FROM promo_codes WHERE code = ?`, code);
  
  // Если не найден, проверить рулеточные
  if (!promo) {
    promo = await db.get(`
      SELECT * FROM wheel_prizes 
      WHERE promoCode = ? AND userId = ? AND isUsed = false
    `, code, userId);
    
    if (promo) {
      promo.isWheelPrize = true;
    }
  }
  
  res.json(promo);
};
```

---

## 🎨 Дизайн и UX

### Цветовая схема секторов

Каждый сектор рулетки имеет уникальный градиент:

1. **Скидка 10%** (30%): `from-purple-400 via-purple-500 to-purple-600`
2. **Товар -20%** (25%): `from-pink-400 via-pink-500 to-pink-600`
3. **+200 баллов** (20%): `from-amber-400 via-amber-500 to-amber-600`
4. **Доставка** (15%): `from-blue-400 via-blue-500 to-blue-600`
5. **Подарок** (8%): `from-green-400 via-green-500 to-green-600`
6. **ДЖЕКПОТ** (2%): `from-red-500 via-orange-500 to-yellow-400`

### Анимации

- **Вращение**: 4 секунды, cubic-bezier(0.17, 0.67, 0.12, 0.99)
- **Bounce бейджа**: При получении нового спина
- **Pulse иконки**: Когда есть доступные спины
- **Heart-melt**: При клике на иконку рулетки

### Адаптивность

- Рулетка полностью responsive
- Модальное окно адаптируется под мобильные устройства
- Иконка в хедере оптимизирована для всех экранов

---

## 📊 Мониторинг и аналитика

Рекомендуется отслеживать:

1. **Метрики использования:**
   - Количество спинов в день/неделю/месяц
   - Средний чек до и после запуска рулетки
   - Процент возврата пользователей

2. **Метрики призов:**
   - Распределение выигранных призов по типам
   - Процент использованных промокодов
   - Средняя скидка по рулеточным промокодам

3. **Метрики вишлиста:**
   - Увеличение размера вишлиста после запуска
   - Конверсия вишлист → корзина
   - Популярные товары в вишлисте

---

## 🚀 Развертывание

### Frontend (уже выполнено)
1. ✅ Код интегрирован в существующий проект
2. ✅ Типы добавлены
3. ✅ Компоненты созданы
4. ✅ Контекст подключен

### Backend (требуется)

1. **Создать Cloud Functions:**
   ```bash
   yc serverless function create --name wheel-status
   yc serverless function create --name wheel-spin
   yc serverless function create --name wheel-history
   yc serverless function create --name wheel-prizes
   ```

2. **Настроить YDB:**
   - Создать таблицы из схемы выше
   - Настроить индексы для оптимизации запросов

3. **Развернуть функции:**
   ```bash
   yc serverless function version create \
     --function-name wheel-status \
     --runtime nodejs18 \
     --entrypoint index.handler \
     --memory 128m \
     --execution-timeout 3s \
     --source-path ./functions/wheel-status
   ```

4. **Настроить переменные окружения:**
   - `YDB_ENDPOINT` - эндпоинт базы данных
   - `YDB_DATABASE` - имя базы данных
   - `JWT_SECRET` - секрет для проверки токенов

5. **Обновить API Gateway:**
   - Добавить роуты для новых функций
   - Настроить CORS
   - Добавить rate limiting

---

## 🔒 Безопасность

### Важные моменты:

1. **Авторизация:**
   - Все запросы требуют JWT токен
   - Проверка userId из токена
   - Запрет на изменение чужих данных

2. **Валидация:**
   - Проверка наличия спинов перед вращением
   - Проверка существования вишлиста
   - Проверка срока действия призов

3. **Ограничения:**
   - Rate limiting на эндпоинт spin (напр. 10 запросов в минуту)
   - Проверка на fraud (слишком частые спины)
   - Логирование всех операций

4. **Промокоды:**
   - Уникальность промокодов
   - Проверка срока действия
   - Одноразовое использование

---

## 📝 Тестирование

### Frontend тесты (рекомендуется)
```typescript
describe('WheelModal', () => {
  it('показывает количество спинов', () => {
    // test implementation
  });
  
  it('блокирует вращение при spins = 0', () => {
    // test implementation
  });
  
  it('показывает модалку с призом после выигрыша', () => {
    // test implementation
  });
});
```

### Backend тесты (необходимо)
```javascript
describe('POST /wheel/spin', () => {
  it('возвращает приз при наличии спинов', async () => {
    // test implementation
  });
  
  it('возвращает ошибку при отсутствии спинов', async () => {
    // test implementation
  });
  
  it('корректно распределяет призы по вероятностям', async () => {
    // test implementation - 1000 спинов для проверки распределения
  });
});
```

---

## 🎯 Roadmap

### Фаза 1: MVP (выполнена)
- ✅ Frontend интерфейс
- ✅ Базовая логика
- ✅ Интеграция с UI

### Фаза 2: Backend (в работе)
- ⏳ Cloud Functions
- ⏳ База данных YDB
- ⏳ Интеграция с заказами

### Фаза 3: Улучшения (планируется)
- ⏳ Push-уведомления о новых спинах
- ⏳ Реферальная программа (пригласи друга - получи спин)
- ⏳ Специальные события (двойные шансы в праздники)
- ⏳ История выигрышей в личном кабинете
- ⏳ Социальные шеры выигрышей

---

## 📞 Контакты и поддержка

При возникновении вопросов по реализации backend:

1. Проверьте типы в `firebase-types.ts` для понимания структуры данных
2. Изучите API endpoints в разделе "ТРЕБУЕТСЯ: Backend"
3. Обратите внимание на бизнес-логику начисления спинов и выбора призов
4. Следуйте примерам кода для Cloud Functions

---

**Дата обновления**: 8 ноября 2025  
**Версия**: 1.0  
**Статус Frontend**: ✅ Готово  
**Статус Backend**: ⏳ Требуется реализация
