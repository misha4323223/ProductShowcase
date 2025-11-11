# 🎨 Примеры компонентов для фронтенда

## React компоненты для интеграции с СДЭК

---

## 📦 1. Компонент выбора способа доставки

Создайте файл `client/src/components/DeliverySelector.tsx`:

```typescript
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Package, Truck } from 'lucide-react';

type DeliveryService = 'CDEK' | null;
type DeliveryType = 'COURIER' | 'PICKUP' | null;

interface DeliverySelectorProps {
  onSelect: (service: DeliveryService, type: DeliveryType) => void;
}

export function DeliverySelector({ onSelect }: DeliverySelectorProps) {
  const [selectedService, setSelectedService] = useState<DeliveryService>(null);
  const [selectedType, setSelectedType] = useState<DeliveryType>(null);

  const handleServiceChange = (service: DeliveryService) => {
    setSelectedService(service);
    setSelectedType(null);
    onSelect(service, null);
  };

  const handleTypeChange = (type: DeliveryType) => {
    setSelectedType(type);
    onSelect(selectedService, type);
  };

  return (
    <div className="space-y-4" data-testid="delivery-selector">
      <h3 className="text-lg font-semibold">Выберите способ доставки</h3>
      
      <RadioGroup 
        value={selectedService || ''} 
        onValueChange={(v) => handleServiceChange(v as DeliveryService)}
      >
        <Card className="p-4 hover-elevate cursor-pointer" data-testid="card-delivery-cdek">
          <Label className="flex items-center space-x-3 cursor-pointer">
            <RadioGroupItem value="CDEK" data-testid="radio-cdek" />
            <div className="flex-1">
              <div className="font-semibold">СДЭК</div>
              <div className="text-sm text-muted-foreground">Доставка по всей России от 1-3 дней</div>
            </div>
          </Label>
        </Card>
      </RadioGroup>

      {selectedService === 'CDEK' && (
        <RadioGroup 
          value={selectedType || ''} 
          onValueChange={(v) => handleTypeChange(v as DeliveryType)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4 hover-elevate cursor-pointer" data-testid="card-type-pickup">
              <Label className="flex items-center space-x-3 cursor-pointer">
                <RadioGroupItem value="PICKUP" data-testid="radio-pickup" />
                <Package className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-semibold">Пункт выдачи</div>
                  <div className="text-sm text-muted-foreground">Бесплатно или дешевле</div>
                </div>
              </Label>
            </Card>

            <Card className="p-4 hover-elevate cursor-pointer" data-testid="card-type-courier">
              <Label className="flex items-center space-x-3 cursor-pointer">
                <RadioGroupItem value="COURIER" data-testid="radio-courier" />
                <Truck className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-semibold">Курьером</div>
                  <div className="text-sm text-muted-foreground">До двери</div>
                </div>
              </Label>
            </Card>
          </div>
        </RadioGroup>
      )}
    </div>
  );
}
```

---

## 📍 2. Компонент выбора пункта выдачи СДЭК

Создайте файл `client/src/components/CdekPointSelector.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CdekPoint {
  code: string;
  name: string;
  location: {
    city: string;
    address: string;
    address_full: string;
    city_code: number;
  };
  work_time: string;
  phones: Array<{ number: string }>;
}

interface CdekPointSelectorProps {
  cityCode?: number;
  onSelect: (point: CdekPoint) => void;
}

export function CdekPointSelector({ cityCode = 270, onSelect }: CdekPointSelectorProps) {
  const [selectedPoint, setSelectedPoint] = useState<CdekPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Получаем список пунктов выдачи
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/delivery/cdek/points', cityCode],
    enabled: !!cityCode,
  });

  const points: CdekPoint[] = data?.data || [];

  // Фильтрация по поиску
  const filteredPoints = points.filter(point => 
    point.location.address_full.toLowerCase().includes(searchQuery.toLowerCase()) ||
    point.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (point: CdekPoint) => {
    setSelectedPoint(point);
    onSelect(point);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">Загрузка пунктов выдачи...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-destructive">
          Ошибка загрузки пунктов выдачи
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="cdek-point-selector">
      <h3 className="text-lg font-semibold">Выберите пункт выдачи СДЭК</h3>

      {/* Поиск */}
      <Input
        type="text"
        placeholder="Поиск по адресу..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        data-testid="input-search-points"
      />

      {/* Список пунктов выдачи */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredPoints.map((point) => (
            <Card
              key={point.code}
              className={`p-4 cursor-pointer hover-elevate ${
                selectedPoint?.code === point.code ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => handleSelect(point)}
              data-testid={`card-point-${point.code}`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{point.name}</div>
                    <div className="text-sm text-muted-foreground flex items-start gap-1">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <span>{point.location.address_full}</span>
                    </div>
                  </div>
                </div>

                {point.work_time && (
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{point.work_time}</span>
                  </div>
                )}

                {selectedPoint?.code === point.code && (
                  <Button 
                    size="sm" 
                    className="w-full"
                    data-testid="button-confirm-point"
                  >
                    Выбрано
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="text-sm text-muted-foreground">
        Найдено пунктов: {filteredPoints.length}
      </div>
    </div>
  );
}
```

---

## 💰 3. Компонент калькулятора доставки

Создайте файл `client/src/components/DeliveryCalculator.tsx`:

```typescript
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Package {
  weight: number;
  height: number;
  width: number;
  length: number;
}

interface DeliveryCalculatorProps {
  cityCode: number;
  packages: Package[];
  onCalculated?: (cost: number, days: number) => void;
}

export function DeliveryCalculator({ 
  cityCode, 
  packages,
  onCalculated 
}: DeliveryCalculatorProps) {
  const [deliveryCost, setDeliveryCost] = useState<number | null>(null);
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/delivery/cdek/calculate', {
        method: 'POST',
        body: JSON.stringify({
          to_location: { code: cityCode },
          packages
        })
      });
    },
    onSuccess: (data) => {
      if (data.success && data.data) {
        const tariff = data.data;
        setDeliveryCost(tariff.delivery_sum);
        setDeliveryDays(tariff.period_min);
        onCalculated?.(tariff.delivery_sum, tariff.period_min);
      }
    }
  });

  return (
    <Card className="p-4" data-testid="delivery-calculator">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Стоимость доставки:</span>
          {calculateMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : deliveryCost ? (
            <span className="text-lg font-bold" data-testid="text-cost">
              {deliveryCost} ₽
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>

        {deliveryDays && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Срок доставки:</span>
            <span className="text-sm" data-testid="text-days">
              {deliveryDays} дней
            </span>
          </div>
        )}

        <Button
          onClick={() => calculateMutation.mutate()}
          disabled={calculateMutation.isPending}
          className="w-full"
          data-testid="button-calculate"
        >
          {calculateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Расчет...
            </>
          ) : (
            'Рассчитать доставку'
          )}
        </Button>

        {calculateMutation.error && (
          <div className="text-sm text-destructive">
            Ошибка расчета. Попробуйте еще раз.
          </div>
        )}
      </div>
    </Card>
  );
}
```

---

## 🛒 4. Интеграция в процесс оформления заказа

Создайте файл `client/src/pages/Checkout.tsx`:

```typescript
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { DeliverySelector } from '@/components/DeliverySelector';
import { CdekPointSelector } from '@/components/CdekPointSelector';
import { DeliveryCalculator } from '@/components/DeliveryCalculator';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Checkout() {
  const { toast } = useToast();
  const [deliveryService, setDeliveryService] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<any>(null);
  const [deliveryCost, setDeliveryCost] = useState<number>(0);

  // Мутация для создания заказа
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('/api/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    },
    onSuccess: () => {
      toast({
        title: 'Заказ оформлен!',
        description: 'Ваш заказ успешно создан'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    },
    onError: () => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать заказ',
        variant: 'destructive'
      });
    }
  });

  const handlePlaceOrder = () => {
    const orderData = {
      userId: 'current-user-id', // Получите из контекста
      userEmail: 'user@example.com',
      items: [], // Товары из корзины
      total: 5000 + deliveryCost,
      
      // Данные доставки
      deliveryService,
      deliveryType,
      deliveryPointCode: selectedPoint?.code,
      deliveryPointName: selectedPoint?.name,
      deliveryPointAddress: selectedPoint?.location?.address_full,
      cdekDeliveryCost: deliveryCost,
      deliveryCalculatedAt: new Date().toISOString(),
    };

    createOrderMutation.mutate(orderData);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Оформление заказа</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Выбор способа доставки */}
          <Card className="p-6">
            <DeliverySelector
              onSelect={(service, type) => {
                setDeliveryService(service);
                setDeliveryType(type);
                setSelectedPoint(null);
              }}
            />
          </Card>

          {/* Выбор пункта выдачи */}
          {deliveryService === 'CDEK' && deliveryType === 'PICKUP' && (
            <Card className="p-6">
              <CdekPointSelector
                cityCode={270}
                onSelect={setSelectedPoint}
              />
            </Card>
          )}
        </div>

        {/* Итого */}
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Итого</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Товары:</span>
                <span>5000 ₽</span>
              </div>
              <div className="flex justify-between">
                <span>Доставка:</span>
                <span>{deliveryCost > 0 ? `${deliveryCost} ₽` : '—'}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Всего:</span>
                <span>{5000 + deliveryCost} ₽</span>
              </div>
            </div>
          </Card>

          {selectedPoint && (
            <DeliveryCalculator
              cityCode={selectedPoint.location.city_code}
              packages={[{ weight: 1000, height: 10, width: 10, length: 10 }]}
              onCalculated={(cost) => setDeliveryCost(cost)}
            />
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!deliveryService || !deliveryType || createOrderMutation.isPending}
            onClick={handlePlaceOrder}
            data-testid="button-place-order"
          >
            Оформить заказ
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📝 Примечания

1. **API Endpoints**: Убедитесь, что все endpoints настроены в вашем API Gateway
2. **Authentication**: Добавьте обработку аутентификации пользователя
3. **Error Handling**: Расширьте обработку ошибок для production
4. **Loading States**: Добавьте skeleton loaders для лучшего UX
5. **Mobile Responsive**: Компоненты адаптивны, но проверьте на реальных устройствах

---

## 🎨 Стилизация

Компоненты используют shadcn/ui, поэтому они автоматически адаптируются к вашей теме (светлая/темная).

Дополнительная кастомизация доступна через Tailwind CSS классы.
