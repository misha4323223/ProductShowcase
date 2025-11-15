# 🎨 ПРИМЕРЫ ИНТЕГРАЦИИ РОБОКАССЫ НА ФРОНТЕНДЕ

Эти примеры показывают, как интегрировать Робокассу на вашем статическом сайте (GitHub Pages).

---

## 📦 1. Кнопка "Оплатить заказ" на странице Checkout

```javascript
// client/src/pages/Checkout.tsx или ваш аналог

async function handlePayment() {
  try {
    // 1. Получаем данные заказа
    const orderData = {
      userId: currentUser?.id || 'guest',
      items: cartItems,
      total: calculateTotal(),
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      shippingAddress: formData.address,
      
      // Информация о доставке (если используется СДЭК)
      deliveryService: selectedDeliveryService, // 'CDEK' или null
      deliveryType: selectedDeliveryType, // 'PICKUP' или 'DOOR'
      deliveryPointCode: selectedPoint?.code,
      // ... другие поля доставки
    };

    // 2. Создаем заказ в базе данных
    const orderResponse = await fetch('https://ваш-api-gateway.apigw.yandexcloud.net/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      throw new Error('Failed to create order');
    }

    const { orderId } = await orderResponse.json();
    console.log('Order created:', orderId);

    // 3. Инициируем платеж через Робокассу
    const paymentResponse = await fetch('https://ваш-api-gateway.apigw.yandexcloud.net/api/payment/robokassa/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: orderId,
        amount: orderData.total,
        email: orderData.customerEmail,
        description: `Оплата заказа #${orderId.substring(0, 8).toUpperCase()}`,
      }),
    });

    if (!paymentResponse.ok) {
      throw new Error('Failed to initialize payment');
    }

    const { paymentUrl } = await paymentResponse.json();
    console.log('Payment URL:', paymentUrl);

    // 4. Перенаправляем пользователя на страницу оплаты Робокассы
    window.location.href = paymentUrl;

  } catch (error) {
    console.error('Payment error:', error);
    alert('Ошибка при создании платежа. Попробуйте еще раз.');
  }
}
```

---

## ✅ 2. Страница успешной оплаты

Создайте файл `client/src/pages/PaymentSuccess.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получаем orderId из URL параметров
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('InvId') || urlParams.get('orderId');

    if (orderId) {
      // Проверяем статус платежа
      checkPaymentStatus(orderId);
    } else {
      setLoading(false);
    }
  }, []);

  async function checkPaymentStatus(orderId: string) {
    try {
      const response = await fetch(
        `https://ваш-api-gateway.apigw.yandexcloud.net/api/payment/robokassa/check?orderId=${orderId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setOrderInfo(data);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Проверяем статус платежа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        
        <h1 className="text-3xl font-bold mb-4">
          Оплата прошла успешно! 🎉
        </h1>
        
        {orderInfo && (
          <div className="mb-6 text-left bg-muted p-4 rounded-md">
            <p className="mb-2">
              <strong>Заказ:</strong> #{orderInfo.orderId.substring(0, 8).toUpperCase()}
            </p>
            <p className="mb-2">
              <strong>Сумма:</strong> {orderInfo.total} ₽
            </p>
            <p className="mb-2">
              <strong>Статус:</strong> {
                orderInfo.isPaid 
                  ? '✅ Оплачен' 
                  : '⏳ Ожидает подтверждения'
              }
            </p>
            {orderInfo.paidAt && (
              <p>
                <strong>Дата оплаты:</strong>{' '}
                {new Date(orderInfo.paidAt).toLocaleString('ru-RU')}
              </p>
            )}
          </div>
        )}
        
        <p className="text-muted-foreground mb-6">
          Мы получили ваш платёж и начали обработку заказа.
          <br />
          На ваш email отправлено подтверждение.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Button 
            variant="default" 
            onClick={() => setLocation('/orders')}
            data-testid="button-view-orders"
          >
            Мои заказы
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/')}
            data-testid="button-home"
          >
            На главную
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

---

## ❌ 3. Страница неудачной оплаты

Создайте файл `client/src/pages/PaymentFailed.tsx`:

```tsx
import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailed() {
  const [, setLocation] = useLocation();
  const [retrying, setRetrying] = useState(false);

  // Получаем orderId из URL, если есть
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('InvId') || urlParams.get('orderId');

  async function retryPayment() {
    if (!orderId) {
      setLocation('/cart');
      return;
    }

    setRetrying(true);

    try {
      // Получаем информацию о заказе
      const orderResponse = await fetch(
        `https://ваш-api-gateway.apigw.yandexcloud.net/api/payment/robokassa/check?orderId=${orderId}`
      );

      if (!orderResponse.ok) {
        throw new Error('Order not found');
      }

      const orderInfo = await orderResponse.json();

      // Создаем новую ссылку на оплату
      const paymentResponse = await fetch(
        'https://ваш-api-gateway.apigw.yandexcloud.net/api/payment/robokassa/init',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            amount: orderInfo.total,
            description: `Повторная оплата заказа #${orderId.substring(0, 8)}`,
          }),
        }
      );

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment');
      }

      const { paymentUrl } = await paymentResponse.json();
      window.location.href = paymentUrl;

    } catch (error) {
      console.error('Retry payment error:', error);
      alert('Не удалось повторить оплату. Попробуйте оформить новый заказ.');
      setLocation('/cart');
    } finally {
      setRetrying(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="p-8 text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        
        <h1 className="text-3xl font-bold mb-4">
          Оплата не прошла
        </h1>
        
        <p className="text-muted-foreground mb-6">
          К сожалению, платёж не был завершён.
          <br />
          Это могло произойти по следующим причинам:
        </p>
        
        <ul className="text-left mb-6 space-y-2 max-w-md mx-auto">
          <li>• Отмена оплаты</li>
          <li>• Недостаточно средств на карте</li>
          <li>• Технические проблемы банка</li>
          <li>• Неверные данные карты</li>
        </ul>
        
        <div className="flex gap-4 justify-center">
          <Button 
            variant="default" 
            onClick={retryPayment}
            disabled={retrying || !orderId}
            data-testid="button-retry-payment"
          >
            {retrying ? 'Загрузка...' : 'Попробовать снова'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/cart')}
            data-testid="button-back-cart"
          >
            Вернуться в корзину
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

---

## 🔍 4. Компонент отслеживания статуса платежа

Полезно для админки или личного кабинета:

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

interface PaymentStatusProps {
  orderId: string;
}

export function PaymentStatus({ orderId }: PaymentStatusProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [`/api/payment/robokassa/check`, orderId],
    queryFn: async () => {
      const response = await fetch(
        `https://ваш-api-gateway.apigw.yandexcloud.net/api/payment/robokassa/check?orderId=${orderId}`
      );
      if (!response.ok) throw new Error('Failed to fetch payment status');
      return response.json();
    },
    // Автоматическое обновление каждые 10 секунд для ожидающих платежей
    refetchInterval: (data) => 
      data?.paymentStatus === 'pending' ? 10000 : false,
  });

  if (isLoading) {
    return <div>Загрузка статуса платежа...</div>;
  }

  if (error) {
    return <div className="text-red-500">Ошибка загрузки статуса</div>;
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: { variant: 'default', label: '✅ Оплачен' },
      pending: { variant: 'secondary', label: '⏳ Ожидает оплаты' },
      failed: { variant: 'destructive', label: '❌ Не оплачен' },
      refunded: { variant: 'outline', label: '↩️ Возвращен' },
    };
    
    return variants[status] || { variant: 'outline', label: status };
  };

  const statusInfo = getStatusBadge(data.paymentStatus);

  return (
    <Card className="p-4" data-testid="card-payment-status">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Статус оплаты</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          data-testid="button-refresh-status"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Статус:</span>
          <Badge variant={statusInfo.variant}>
            {statusInfo.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Сумма:</span>
          <span className="font-semibold">{data.total} ₽</span>
        </div>

        {data.paymentService && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Система оплаты:</span>
            <span>{data.paymentService}</span>
          </div>
        )}

        {data.paidAt && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Дата оплаты:</span>
            <span className="text-sm">
              {new Date(data.paidAt).toLocaleString('ru-RU')}
            </span>
          </div>
        )}
      </div>

      {data.paymentStatus === 'pending' && (
        <p className="text-xs text-muted-foreground mt-4">
          Статус обновляется автоматически...
        </p>
      )}
    </Card>
  );
}
```

---

## 🔄 5. Добавление маршрутов в App.tsx

```tsx
// client/src/App.tsx

import { Switch, Route } from "wouter";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentFailed from "@/pages/PaymentFailed";
// ... другие импорты

function Router() {
  return (
    <Switch>
      {/* Существующие маршруты */}
      <Route path="/" component={Home} />
      <Route path="/cart" component={Cart} />
      <Route path="/checkout" component={Checkout} />
      
      {/* Новые маршруты для Робокассы */}
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/payment-failed" component={PaymentFailed} />
      
      <Route component={NotFound} />
    </Switch>
  );
}
```

---

## 📝 6. Пример полного процесса оплаты

```typescript
// Полный процесс оплаты заказа

interface CheckoutFlow {
  // 1. Собираем данные заказа
  collectOrderData: () => OrderData;
  
  // 2. Создаем заказ в базе
  createOrder: (orderData: OrderData) => Promise<string>; // возвращает orderId
  
  // 3. Инициируем платеж
  initPayment: (orderId: string, amount: number) => Promise<string>; // возвращает paymentUrl
  
  // 4. Перенаправляем на оплату
  redirectToPayment: (paymentUrl: string) => void;
}

// Реализация
const checkoutFlow: CheckoutFlow = {
  collectOrderData: () => ({
    userId: currentUser?.id || 'guest',
    items: cartItems,
    total: calculateTotal(),
    // ... остальные поля
  }),

  createOrder: async (orderData) => {
    const response = await fetch('https://api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    const { orderId } = await response.json();
    return orderId;
  },

  initPayment: async (orderId, amount) => {
    const response = await fetch('https://api/payment/robokassa/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, amount }),
    });
    const { paymentUrl } = await response.json();
    return paymentUrl;
  },

  redirectToPayment: (paymentUrl) => {
    window.location.href = paymentUrl;
  },
};

// Использование
async function handleCheckout() {
  try {
    const orderData = checkoutFlow.collectOrderData();
    const orderId = await checkoutFlow.createOrder(orderData);
    const paymentUrl = await checkoutFlow.initPayment(orderId, orderData.total);
    checkoutFlow.redirectToPayment(paymentUrl);
  } catch (error) {
    console.error('Checkout failed:', error);
    alert('Ошибка оформления заказа');
  }
}
```

---

## 🎯 ВАЖНЫЕ ЗАМЕЧАНИЯ

1. **Замените URL API Gateway** на ваш реальный URL во всех примерах
2. **Добавьте обработку ошибок** в продакшн коде
3. **Используйте loading states** для улучшения UX
4. **Тестируйте в тестовом режиме** Робокассы перед продакшн
5. **Логируйте события** для отладки процесса оплаты

---

## 🔗 ПОЛЕЗНЫЕ ССЫЛКИ

- Документация Робокассы: https://docs.robokassa.ru/
- Тестовые карты: указаны в личном кабинете
- Проверка статуса: через endpoint `/api/payment/robokassa/check`
