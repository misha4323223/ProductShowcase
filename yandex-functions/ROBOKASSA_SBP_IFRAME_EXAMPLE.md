# Оплата через СБП с QR-кодом (iFrame режим)

Для отображения QR-кода СБП необходимо использовать **iFrame режим** Робокассы.
Обычный redirect (`paymentUrl`) **не показывает QR-код** для СБП.

---

## Как это работает

1. Бэкенд возвращает `iframeParams` — параметры для iFrame
2. Фронтенд загружает скрипт Робокассы и вызывает `Robokassa.StartPayment(iframeParams)`
3. Открывается модальное окно с QR-кодом СБП

---

## Пример кода для фронтенда

### 1. Добавьте скрипт Робокассы в HTML

```html
<!-- В index.html или в компоненте -->
<script src="https://auth.robokassa.ru/Merchant/bundle/robokassa_iframe.js"></script>
```

### 2. JavaScript код для оплаты

```javascript
// Функция инициализации оплаты
async function handlePayment(orderId, amount, email, paymentMethod = 'sbp') {
  try {
    // 1. Запрос к бэкенду для получения параметров
    const response = await fetch('https://ваш-api-gateway.apigw.yandexcloud.net/api/payment/robokassa/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId,
        amount: amount,
        email: email,
        description: `Оплата заказа #${orderId.substring(0, 8)}`,
        paymentMethod: paymentMethod  // 'sbp' для СБП, 'card' для карты
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize payment');
    }

    const data = await response.json();
    console.log('Payment data:', data);

    // 2. Выбор метода оплаты
    if (paymentMethod === 'sbp') {
      // СБП: используем iFrame для отображения QR-кода
      openRobokassaIframe(data.iframeParams);
    } else {
      // Карта: обычный redirect
      window.location.href = data.paymentUrl;
    }

  } catch (error) {
    console.error('Payment error:', error);
    alert('Ошибка при создании платежа. Попробуйте еще раз.');
  }
}

// Открытие iFrame Робокассы (для СБП с QR-кодом)
function openRobokassaIframe(iframeParams) {
  // Проверяем, что скрипт Робокассы загружен
  if (typeof Robokassa === 'undefined') {
    console.error('Robokassa script not loaded!');
    
    // Динамическая загрузка скрипта
    const script = document.createElement('script');
    script.src = 'https://auth.robokassa.ru/Merchant/bundle/robokassa_iframe.js';
    script.onload = () => {
      Robokassa.StartPayment(iframeParams);
    };
    document.head.appendChild(script);
    return;
  }

  // Запускаем платеж через iFrame
  Robokassa.StartPayment(iframeParams);
}
```

### 3. React компонент

```tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CreditCard, QrCode } from 'lucide-react';

// Добавьте в index.html:
// <script src="https://auth.robokassa.ru/Merchant/bundle/robokassa_iframe.js"></script>

declare global {
  interface Window {
    Robokassa?: {
      StartPayment: (params: any) => void;
    };
  }
}

interface PaymentButtonsProps {
  orderId: string;
  amount: number;
  email: string;
}

export function PaymentButtons({ orderId, amount, email }: PaymentButtonsProps) {
  const [loading, setLoading] = useState<'card' | 'sbp' | null>(null);

  async function initPayment(paymentMethod: 'card' | 'sbp') {
    setLoading(paymentMethod);

    try {
      const response = await fetch(
        'https://ваш-api-gateway.apigw.yandexcloud.net/api/payment/robokassa/init',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount,
            email,
            description: `Оплата заказа #${orderId.substring(0, 8)}`,
            paymentMethod,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to init payment');
      }

      const data = await response.json();

      if (paymentMethod === 'sbp') {
        // СБП: открываем iFrame с QR-кодом
        if (window.Robokassa) {
          window.Robokassa.StartPayment(data.iframeParams);
        } else {
          // Загружаем скрипт динамически
          const script = document.createElement('script');
          script.src = data.iframeScriptUrl;
          script.onload = () => {
            window.Robokassa?.StartPayment(data.iframeParams);
          };
          document.head.appendChild(script);
        }
      } else {
        // Карта: redirect
        window.location.href = data.paymentUrl;
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Ошибка при создании платежа');
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Выберите способ оплаты</h3>
      
      <div className="flex flex-col gap-3">
        {/* Оплата картой */}
        <Button
          onClick={() => initPayment('card')}
          disabled={loading !== null}
          className="w-full justify-start gap-3"
          variant="outline"
          data-testid="button-pay-card"
        >
          <CreditCard className="w-5 h-5" />
          {loading === 'card' ? 'Загрузка...' : 'Банковская карта'}
        </Button>

        {/* Оплата СБП (QR-код) */}
        <Button
          onClick={() => initPayment('sbp')}
          disabled={loading !== null}
          className="w-full justify-start gap-3"
          variant="outline"
          data-testid="button-pay-sbp"
        >
          <QrCode className="w-5 h-5" />
          {loading === 'sbp' ? 'Загрузка...' : 'СБП (QR-код)'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        Сумма к оплате: <strong>{amount} ₽</strong>
      </p>
    </Card>
  );
}
```

---

## Важные моменты

### 1. Скрипт Робокассы
Скрипт `robokassa_iframe.js` должен быть загружен **до** вызова `Robokassa.StartPayment()`.

Добавьте в `index.html`:
```html
<script src="https://auth.robokassa.ru/Merchant/bundle/robokassa_iframe.js"></script>
```

### 2. Параметр Settings
Бэкенд возвращает `iframeParams` с уже настроенным `Settings`:
```javascript
{
  PaymentMethods: ['SBP'],  // Только СБП
  Mode: 'modal'             // Модальное окно
}
```

### 3. Callback после оплаты
Робокасса автоматически закроет модальное окно после успешной оплаты.
Для отслеживания статуса используйте polling `/api/payment/robokassa/check`.

---

## Структура ответа от бэкенда

```json
{
  "success": true,
  "paymentUrl": "https://auth.robokassa.ru/...",
  "iframeParams": {
    "MerchantLogin": "your_login",
    "OutSum": "500.00",
    "InvId": "1733583600123",
    "Description": "Оплата заказа #abc12345",
    "SignatureValue": "ABC123...",
    "Culture": "ru",
    "Encoding": "utf-8",
    "Shp_OrderId": "abc123...",
    "Settings": "{\"PaymentMethods\":[\"SBP\"],\"Mode\":\"modal\"}"
  },
  "iframeScriptUrl": "https://auth.robokassa.ru/Merchant/bundle/robokassa_iframe.js",
  "orderId": "abc123...",
  "invId": 1733583600123,
  "amount": 500,
  "paymentMethod": "sbp",
  "isTest": false
}
```

---

## Тестирование

1. Используйте тестовый режим Робокассы (`ROBOKASSA_TEST_MODE=true`)
2. При тестовой оплате СБП отображается тестовый QR-код
3. После сканирования QR-кода платеж автоматически подтверждается

---

## Troubleshooting

### QR-код не отображается
- Убедитесь, что скрипт `robokassa_iframe.js` загружен
- Проверьте консоль браузера на ошибки
- Убедитесь, что `Settings` содержит `PaymentMethods: ['SBP']`

### Ошибка подписи
- Проверьте, что `ROBOKASSA_PASSWORD_1` в бэкенде совпадает с настройками в ЛК Робокассы
- Алгоритм хеширования должен совпадать (`sha256` по умолчанию)

### СБП не доступен
- Проверьте в ЛК Робокассы, что СБП подключен для вашего магазина
- СБП может быть недоступен в тестовом режиме для некоторых аккаунтов
