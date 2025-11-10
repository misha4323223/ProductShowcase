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
  onCalculated?: (cost: number, days: number, tariffCode: number) => void;
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
      const res = await apiRequest('POST', '/api/delivery/cdek/calculate', {
        to_location: { code: cityCode },
        packages
      });
      return await res.json();
    },
    onSuccess: (data: any) => {
      if (data.success && data.data) {
        const tariffs = Array.isArray(data.data) ? data.data : [data.data];
        const tariff = tariffs[0];
        if (tariff) {
          setDeliveryCost(tariff.delivery_sum);
          setDeliveryDays(tariff.period_min);
          onCalculated?.(tariff.delivery_sum, tariff.period_min, tariff.tariff_code);
        }
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
