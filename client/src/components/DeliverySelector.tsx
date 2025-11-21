import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Package, Truck, Mail } from 'lucide-react';

type DeliveryService = 'CDEK' | 'POST' | null;
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
    <div className="space-y-0" data-testid="delivery-selector">
      <h3 className="text-lg font-semibold mb-4">Выберите способ доставки</h3>
      
      <div className="space-y-0">
        <RadioGroup 
          value={selectedService || ''} 
          onValueChange={(v) => handleServiceChange(v as DeliveryService)}
        >
          <Card className="p-4 hover-elevate cursor-pointer rounded-b-none border-b-0" data-testid="card-delivery-cdek">
            <Label className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem value="CDEK" data-testid="radio-cdek" />
              <div className="flex-1">
                <div className="font-semibold">СДЭК</div>
                <div className="text-sm text-muted-foreground">Доставка по всей России от 1-3 дней</div>
              </div>
            </Label>
          </Card>

          {selectedService === 'CDEK' && (
            <div className="bg-muted/30 border border-t-0 rounded-b-lg p-4 space-y-3">
              <p className="text-sm font-medium text-muted-foreground ml-8">Выберите тип доставки:</p>
              <RadioGroup 
                value={selectedType || ''} 
                onValueChange={(v) => handleTypeChange(v as DeliveryType)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-8">
                  <Card className="p-3 hover-elevate cursor-pointer" data-testid="card-type-pickup">
                    <Label className="flex items-center space-x-3 cursor-pointer">
                      <RadioGroupItem value="PICKUP" data-testid="radio-pickup" />
                      <Package className="w-5 h-5" />
                      <div className="flex-1">
                        <div className="font-semibold">Пункт выдачи</div>
                        <div className="text-sm text-muted-foreground">Бесплатно или дешевле</div>
                      </div>
                    </Label>
                  </Card>

                  <Card className="p-3 hover-elevate cursor-pointer" data-testid="card-type-courier">
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
            </div>
          )}

          <Card className="p-4 hover-elevate cursor-pointer" data-testid="card-delivery-post">
            <Label className="flex items-center space-x-3 cursor-pointer">
              <RadioGroupItem value="POST" data-testid="radio-post" />
              <Mail className="w-5 h-5" />
              <div className="flex-1">
                <div className="font-semibold">Почта России</div>
                <div className="text-sm text-muted-foreground">Доставка в течение 5-10 дней</div>
              </div>
            </Label>
          </Card>
        </RadioGroup>
      </div>
    </div>
  );
}
