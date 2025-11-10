# 🎨 Примеры React компонентов для Яндекс.Доставка

Эти компоненты помогут вам быстро интегрировать Яндекс.Доставку в ваш фронтенд.

---

## 📍 1. Компонент расчета стоимости доставки

Создайте файл `client/src/components/YandexDeliveryCalculator.tsx`:

```typescript
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Package } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface DeliveryCalculation {
  price: string;
  currency: string;
  delivery_time?: string;
}

interface YandexDeliveryCalculatorProps {
  onCalculated?: (result: DeliveryCalculation) => void;
}

export function YandexDeliveryCalculator({ onCalculated }: YandexDeliveryCalculatorProps) {
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [weight, setWeight] = useState('1');
  const [result, setResult] = useState<DeliveryCalculation | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async () => {
      // Преобразуем адреса в координаты (упрощенный пример)
      // В реальном приложении используйте Яндекс.Геокодер
      const response = await apiRequest('/api/delivery/yandex/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              quantity: 1,
              size: { length: 0.5, width: 0.5, height: 0.5 },
              weight: parseFloat(weight)
            }
          ],
          route_points: [
            {
              coordinates: [37.6156, 55.7558], // Координаты откуда (пример)
              type: 'source',
              address: fromAddress
            },
            {
              coordinates: [37.6492, 55.7558], // Координаты куда (пример)
              type: 'destination',
              address: toAddress
            }
          ]
        })
      });
      
      return response;
    },
    onSuccess: (data) => {
      setResult(data.data);
      onCalculated?.(data.data);
    }
  });

  const handleCalculate = () => {
    if (!fromAddress || !toAddress || !weight) {
      alert('Заполните все поля');
      return;
    }
    calculateMutation.mutate();
  };

  return (
    <Card className="w-full" data-testid="yandex-delivery-calculator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Расчет доставки Яндекс.Доставка
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Адрес отправления */}
        <div className="space-y-2">
          <Label htmlFor="from-address">Откуда</Label>
          <Input
            id="from-address"
            type="text"
            placeholder="Москва, ул. Ленина, 1"
            value={fromAddress}
            onChange={(e) => setFromAddress(e.target.value)}
            data-testid="input-from-address"
          />
        </div>

        {/* Адрес назначения */}
        <div className="space-y-2">
          <Label htmlFor="to-address">Куда</Label>
          <Input
            id="to-address"
            type="text"
            placeholder="Санкт-Петербург, Невский проспект, 1"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            data-testid="input-to-address"
          />
        </div>

        {/* Вес */}
        <div className="space-y-2">
          <Label htmlFor="weight">Вес (кг)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            min="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            data-testid="input-weight"
          />
        </div>

        {/* Кнопка расчета */}
        <Button
          onClick={handleCalculate}
          disabled={calculateMutation.isPending}
          className="w-full"
          data-testid="button-calculate"
        >
          {calculateMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Рассчитать стоимость
        </Button>

        {/* Результат */}
        {result && (
          <div className="mt-4 p-4 bg-secondary rounded-md" data-testid="delivery-result">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Стоимость доставки:</span>
                <span className="text-lg font-bold" data-testid="text-price">
                  {result.price} {result.currency}
                </span>
              </div>
              {result.delivery_time && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Время доставки:</span>
                  <span data-testid="text-delivery-time">{result.delivery_time}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ошибка */}
        {calculateMutation.isError && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md" data-testid="error-message">
            Ошибка расчета стоимости доставки
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 📦 2. Компонент создания заявки на доставку

Создайте файл `client/src/components/YandexDeliveryOrderForm.tsx`:

```typescript
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Truck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface YandexDeliveryOrderFormProps {
  onOrderCreated?: (claimId: string) => void;
}

export function YandexDeliveryOrderForm({ onOrderCreated }: YandexDeliveryOrderFormProps) {
  const { toast } = useToast();
  
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [comment, setComment] = useState('');
  const [weight, setWeight] = useState('1');

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/delivery/yandex/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              quantity: 1,
              size: { length: 0.5, width: 0.5, height: 0.5 },
              weight: parseFloat(weight),
              title: 'Заказ'
            }
          ],
          route_points: [
            {
              coordinates: [37.6156, 55.7558],
              type: 'source',
              address: fromAddress,
              contact: {
                name: 'Отправитель',
                phone: '+79999999999'
              }
            },
            {
              coordinates: [37.6492, 55.7558],
              type: 'destination',
              address: toAddress,
              contact: {
                name: recipientName,
                phone: recipientPhone
              }
            }
          ],
          client_requirements: {
            taxi_class: 'express'
          },
          comment: comment
        })
      });
      
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: 'Заявка создана',
        description: `ID заявки: ${data.data.id}`,
      });
      onOrderCreated?.(data.data.id);
      
      // Очистка формы
      setFromAddress('');
      setToAddress('');
      setRecipientName('');
      setRecipientPhone('');
      setComment('');
      setWeight('1');
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать заявку на доставку',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromAddress || !toAddress || !recipientName || !recipientPhone) {
      toast({
        title: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }
    
    createOrderMutation.mutate();
  };

  return (
    <Card className="w-full" data-testid="yandex-delivery-order-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Создать заявку на доставку
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Адрес отправления */}
          <div className="space-y-2">
            <Label htmlFor="order-from">Адрес отправления</Label>
            <Input
              id="order-from"
              type="text"
              placeholder="Москва, ул. Ленина, 1"
              value={fromAddress}
              onChange={(e) => setFromAddress(e.target.value)}
              data-testid="input-order-from"
            />
          </div>

          {/* Адрес доставки */}
          <div className="space-y-2">
            <Label htmlFor="order-to">Адрес доставки</Label>
            <Input
              id="order-to"
              type="text"
              placeholder="Санкт-Петербург, Невский проспект, 1"
              value={toAddress}
              onChange={(e) => setToAddress(e.target.value)}
              data-testid="input-order-to"
            />
          </div>

          {/* Имя получателя */}
          <div className="space-y-2">
            <Label htmlFor="recipient-name">Имя получателя</Label>
            <Input
              id="recipient-name"
              type="text"
              placeholder="Иван Иванов"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              data-testid="input-recipient-name"
            />
          </div>

          {/* Телефон получателя */}
          <div className="space-y-2">
            <Label htmlFor="recipient-phone">Телефон получателя</Label>
            <Input
              id="recipient-phone"
              type="tel"
              placeholder="+79991234567"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              data-testid="input-recipient-phone"
            />
          </div>

          {/* Вес */}
          <div className="space-y-2">
            <Label htmlFor="order-weight">Вес (кг)</Label>
            <Input
              id="order-weight"
              type="number"
              step="0.1"
              min="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              data-testid="input-order-weight"
            />
          </div>

          {/* Комментарий */}
          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий (опционально)</Label>
            <Textarea
              id="comment"
              placeholder="Дополнительная информация о заказе"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              data-testid="input-comment"
            />
          </div>

          {/* Кнопка отправки */}
          <Button
            type="submit"
            disabled={createOrderMutation.isPending}
            className="w-full"
            data-testid="button-create-order"
          >
            {createOrderMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Создать заявку
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

---

## 🔍 3. Компонент отслеживания заявки

Создайте файл `client/src/components/YandexDeliveryTracker.tsx`:

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Search, MapPin, Clock, CheckCircle } from 'lucide-react';

interface YandexDeliveryTrackerProps {
  claimId?: string;
}

export function YandexDeliveryTracker({ claimId: initialClaimId }: YandexDeliveryTrackerProps) {
  const [claimId, setClaimId] = useState(initialClaimId || '');
  const [searchClaimId, setSearchClaimId] = useState(initialClaimId || '');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/delivery/yandex/track', searchClaimId],
    enabled: !!searchClaimId,
  });

  const handleSearch = () => {
    if (!claimId) {
      alert('Введите ID заявки');
      return;
    }
    setSearchClaimId(claimId);
    refetch();
  };

  const claimInfo = data?.data;

  return (
    <Card className="w-full" data-testid="yandex-delivery-tracker">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Отслеживание заявки
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Поиск */}
        <div className="flex gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="claim-id">ID заявки</Label>
            <Input
              id="claim-id"
              type="text"
              placeholder="Введите ID заявки"
              value={claimId}
              onChange={(e) => setClaimId(e.target.value)}
              data-testid="input-claim-id"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading}
            className="mt-8"
            data-testid="button-search"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Результат */}
        {claimInfo && (
          <div className="space-y-4 mt-6" data-testid="claim-info">
            {/* Статус */}
            <div className="flex items-center gap-2 p-4 bg-secondary rounded-md">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-semibold">Статус</div>
                <div className="text-sm text-muted-foreground" data-testid="text-status">
                  {claimInfo.status}
                </div>
              </div>
            </div>

            {/* Маршрут */}
            {claimInfo.route_points && (
              <div className="space-y-2">
                <div className="font-semibold flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Маршрут
                </div>
                {claimInfo.route_points.map((point: any, idx: number) => (
                  <div key={idx} className="pl-6 text-sm" data-testid={`route-point-${idx}`}>
                    <div className="font-medium">{point.type === 'source' ? 'Откуда' : 'Куда'}</div>
                    <div className="text-muted-foreground">{point.address}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Время создания */}
            {claimInfo.created_ts && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4" />
                <span>Создано: {new Date(claimInfo.created_ts).toLocaleString('ru-RU')}</span>
              </div>
            )}
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md" data-testid="error-message">
            Заявка не найдена
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 🎯 4. Комплексный компонент выбора доставки

Создайте файл `client/src/components/DeliverySelector.tsx`:

```typescript
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YandexDeliveryCalculator } from './YandexDeliveryCalculator';
import { CdekPointSelector } from './CdekPointSelector';

export function DeliverySelector() {
  const [selectedMethod, setSelectedMethod] = useState<'cdek' | 'yandex'>('yandex');

  return (
    <div className="w-full" data-testid="delivery-selector">
      <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="yandex" data-testid="tab-yandex">
            Яндекс.Доставка
          </TabsTrigger>
          <TabsTrigger value="cdek" data-testid="tab-cdek">
            СДЭК
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yandex">
          <YandexDeliveryCalculator />
        </TabsContent>

        <TabsContent value="cdek">
          <CdekPointSelector 
            onSelect={(point) => console.log('Selected CDEK point:', point)} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 📱 5. Использование в вашем приложении

Добавьте компоненты на нужные страницы:

```typescript
// В вашей странице оформления заказа
import { DeliverySelector } from '@/components/DeliverySelector';
import { YandexDeliveryOrderForm } from '@/components/YandexDeliveryOrderForm';

export default function CheckoutPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>
      
      {/* Выбор способа доставки */}
      <DeliverySelector />
      
      {/* Форма создания заявки */}
      <div className="mt-6">
        <YandexDeliveryOrderForm 
          onOrderCreated={(claimId) => {
            console.log('Заявка создана:', claimId);
            // Перенаправление или обновление состояния
          }}
        />
      </div>
    </div>
  );
}
```

---

## ⚠️ Важные замечания

1. **Геокодирование адресов**: В примерах используются статические координаты. В реальном приложении используйте Яндекс.Геокодер API для преобразования адресов в координаты.

2. **Обработка ошибок**: Добавьте подробную обработку ошибок в зависимости от вашего приложения.

3. **Валидация**: Добавьте валидацию полей формы (телефон, адрес и т.д.).

4. **API URL**: Замените `https://ваш-api-gateway.apigw.yandexcloud.net` на ваш реальный URL API Gateway.

---

Готово! Теперь у вас есть полный набор компонентов для работы с Яндекс.Доставкой! 🎉
