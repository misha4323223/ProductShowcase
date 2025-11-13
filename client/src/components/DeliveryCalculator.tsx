import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Home, Package2, Warehouse, ArrowRight, Check } from 'lucide-react';

interface Package {
  weight: number;
  height: number;
  width: number;
  length: number;
}

interface CdekTariff {
  tariff_code: number;
  tariff_name: string;
  tariff_description?: string;
  delivery_mode: number;
  delivery_sum: number;
  period_min: number;
  period_max: number;
  delivery_date_range?: {
    min: string;
    max: string;
  };
}

interface DeliveryCalculatorProps {
  cityCode: number;
  packages: Package[];
  onCalculated?: (cost: number, days: number, tariffCode: number) => void;
}

const deliveryModeLabels: Record<number, { icon: any; label: string }> = {
  1: { icon: Home, label: 'Дверь - Дверь' },
  2: { icon: Home, label: 'Дверь - Склад' },
  3: { icon: Warehouse, label: 'Склад - Дверь' },
  4: { icon: Warehouse, label: 'Склад - Склад' },
};

export function DeliveryCalculator({ 
  cityCode, 
  packages,
  onCalculated 
}: DeliveryCalculatorProps) {
  const [availableTariffs, setAvailableTariffs] = useState<CdekTariff[]>([]);
  const [selectedTariff, setSelectedTariff] = useState<CdekTariff | null>(null);

  const calculateMutation = useMutation({
    mutationFn: async () => {
      console.log('🚚 Начинаем расчет доставки СДЭК');
      console.log('📍 Код города:', cityCode);
      console.log('📦 Посылки:', packages);
      
      const res = await apiRequest('POST', '/api/delivery/cdek/calculate', {
        to_location: { code: cityCode },
        packages
      });
      
      const data = await res.json();
      console.log('📥 Ответ от API СДЭК:', data);
      return data;
    },
    onSuccess: (data: any) => {
      console.log('✅ Успешный ответ от API СДЭК:', data);
      
      if (data.success && data.data) {
        // API возвращает либо массив тарифов напрямую, либо объект с tariff_codes
        let tariffs: CdekTariff[] = [];
        
        if (Array.isArray(data.data)) {
          // Формат: { success: true, data: [...] }
          tariffs = data.data;
        } else if (data.data.tariff_codes && Array.isArray(data.data.tariff_codes)) {
          // Формат: { success: true, data: { tariff_codes: [...] } }
          tariffs = data.data.tariff_codes;
        } else {
          // Формат: { success: true, data: { ... } } - один тариф
          tariffs = [data.data];
        }
        
        console.log('📋 Найдено тарифов:', tariffs.length);
        console.log('📋 Тарифы:', tariffs);
        
        // Фильтруем только нужные режимы доставки для покупателей:
        // delivery_mode: 3 - Склад-Дверь (продавец везет в ПВЗ → СДЭК доставляет до двери)
        // delivery_mode: 4 - Склад-Склад (продавец везет в ПВЗ → покупатель забирает из ПВЗ)
        const customerTariffs = tariffs.filter(t => 
          (t.delivery_mode === 3 || t.delivery_mode === 4) &&
          !t.tariff_name.toLowerCase().includes('супер-экспресс') &&
          !t.tariff_name.toLowerCase().includes('сборный груз')
        );
        
        // Берём только 2 варианта - самый дешевый для каждого типа доставки
        const pickupTariffs = customerTariffs.filter(t => t.delivery_mode === 4); // Склад-Склад
        const courierTariffs = customerTariffs.filter(t => t.delivery_mode === 3); // Склад-Дверь
        
        const filteredTariffs = [];
        
        // Добавляем самый дешевый вариант до пункта выдачи
        if (pickupTariffs.length > 0) {
          const cheapestPickup = pickupTariffs.sort((a, b) => a.delivery_sum - b.delivery_sum)[0];
          // Переименовываем для понятного отображения
          cheapestPickup.tariff_name = 'До пункта выдачи СДЭК';
          cheapestPickup.tariff_description = 'Заберите заказ в удобном пункте выдачи';
          filteredTariffs.push(cheapestPickup);
        }
        
        // Добавляем самый дешевый вариант курьерской доставки
        if (courierTariffs.length > 0) {
          const cheapestCourier = courierTariffs.sort((a, b) => a.delivery_sum - b.delivery_sum)[0];
          // Переименовываем для понятного отображения
          cheapestCourier.tariff_name = 'Курьером до двери';
          cheapestCourier.tariff_description = 'СДЭК доставит заказ по указанному адресу';
          filteredTariffs.push(cheapestCourier);
        }
        
        setAvailableTariffs(filteredTariffs);
        
        // Автоматически выбираем самый дешёвый тариф
        if (filteredTariffs.length > 0) {
          const cheapest = filteredTariffs.reduce((prev, curr) => 
            curr.delivery_sum < prev.delivery_sum ? curr : prev
          );
          setSelectedTariff(cheapest);
          onCalculated?.(cheapest.delivery_sum, cheapest.period_min, cheapest.tariff_code);
        }
      } else {
        console.warn('⚠️ Неожиданный формат ответа:', data);
      }
    },
    onError: (error: any) => {
      console.error('❌ Ошибка расчета доставки СДЭК:', error);
    }
  });

  const handleTariffSelect = (tariff: CdekTariff) => {
    setSelectedTariff(tariff);
    onCalculated?.(tariff.delivery_sum, tariff.period_min, tariff.tariff_code);
  };

  return (
    <div className="space-y-4" data-testid="delivery-calculator">
      <Button
        onClick={() => calculateMutation.mutate()}
        disabled={calculateMutation.isPending}
        className="w-full"
        data-testid="button-calculate"
      >
        {calculateMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Загрузка тарифов...
          </>
        ) : availableTariffs.length > 0 ? (
          'Обновить тарифы'
        ) : (
          'Показать доступные тарифы'
        )}
      </Button>

      {calculateMutation.error && (
        <Card className="p-4 bg-destructive/10">
          <p className="text-sm text-destructive">
            Ошибка расчета. Попробуйте еще раз.
          </p>
        </Card>
      )}

      {availableTariffs.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground">
            Выберите тариф доставки:
          </h3>
          
          {availableTariffs.map((tariff) => {
            const isSelected = selectedTariff?.tariff_code === tariff.tariff_code;
            const modeInfo = deliveryModeLabels[tariff.delivery_mode] || { 
              icon: Package2, 
              label: 'Доставка' 
            };
            const ModeIcon = modeInfo.icon;
            
            return (
              <Card
                key={tariff.tariff_code}
                className={`p-4 cursor-pointer transition-all hover-elevate ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleTariffSelect(tariff)}
                data-testid={`card-tariff-${tariff.tariff_code}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <ModeIcon className="w-4 h-4 text-muted-foreground" />
                      <h4 className="font-semibold text-sm" data-testid={`text-tariff-name-${tariff.tariff_code}`}>
                        {tariff.tariff_name}
                      </h4>
                      {isSelected && (
                        <Badge variant="default" className="ml-auto">
                          <Check className="w-3 h-3 mr-1" />
                          Выбран
                        </Badge>
                      )}
                    </div>
                    
                    {tariff.tariff_description && (
                      <p className="text-xs text-muted-foreground">
                        {tariff.tariff_description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        {modeInfo.label}
                      </Badge>
                      {tariff.period_min > 0 && (
                        <span>
                          • Доставка: {tariff.period_min}
                          {tariff.period_max && tariff.period_max !== tariff.period_min 
                            ? `-${tariff.period_max}` 
                            : ''} дн.
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xl font-bold" data-testid={`text-tariff-price-${tariff.tariff_code}`}>
                      {tariff.delivery_sum} ₽
                    </div>
                    {(tariff.period_max || tariff.period_min) && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {(() => {
                          const daysToAdd = tariff.period_max || tariff.period_min;
                          const deliveryDate = new Date();
                          deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
                          return `до ${deliveryDate.toLocaleDateString('ru-RU')}`;
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {selectedTariff && (
        <Card className="p-4 bg-primary/5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">Итого доставка:</span>
            <span className="text-lg font-bold text-primary" data-testid="text-selected-cost">
              {selectedTariff.delivery_sum} ₽
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
