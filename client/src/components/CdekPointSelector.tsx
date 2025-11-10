import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Clock } from 'lucide-react';
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
  work_time?: string;
  phones?: Array<{ number: string }>;
}

interface CdekPointSelectorProps {
  cityCode?: number;
  onSelect: (point: CdekPoint) => void;
}

export function CdekPointSelector({ cityCode = 270, onSelect }: CdekPointSelectorProps) {
  const [selectedPoint, setSelectedPoint] = useState<CdekPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error } = useQuery<{ success: boolean; data: CdekPoint[] }>({
    queryKey: ['/api/delivery/cdek/points', `?city_code=${cityCode}`],
    enabled: !!cityCode,
  });

  const points: CdekPoint[] = data?.data || [];

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

      <Input
        type="text"
        placeholder="Поиск по адресу..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        data-testid="input-search-points"
      />

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
