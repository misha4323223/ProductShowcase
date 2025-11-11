import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Package, Truck } from 'lucide-react';

type DeliveryService = 'CDEK' | null;
type DeliveryType = 'DOOR' | 'PICKUP' | null;

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
                <RadioGroupItem value="DOOR" data-testid="radio-courier" />
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
