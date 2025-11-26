import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface City {
  code: number;
  name: string;
  region?: string;
}

interface CitySearchSelectorProps {
  onSelect: (city: City) => void;
}

export function CitySearchSelector({ onSelect }: CitySearchSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Вызываем CDEK API для поиска городов
  const { data: citiesData, isLoading } = useQuery<{ success: boolean; data: City[] }>({
    queryKey: ['/api/delivery/cdek/search-city', searchQuery],
    enabled: searchQuery.length >= 2,
  });

  const cities = citiesData?.data || [];

  const handleSelectCity = (city: City) => {
    setSelectedCity(city);
    setSearchQuery(city.name);
    setShowResults(false);
    onSelect(city);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3" data-testid="city-search-selector">
      <h3 className="text-lg font-semibold">Выберите ваш город</h3>
      
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Введите название города..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          data-testid="input-search-city"
          className="w-full"
        />

        {showResults && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 p-0 shadow-lg">
            {isLoading ? (
              <div className="p-4 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Поиск городов...
              </div>
            ) : searchQuery.length < 2 ? (
              <div className="p-4 text-sm text-muted-foreground">
                Введите минимум 2 символа для поиска
              </div>
            ) : cities.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">
                Город не найден. Попробуйте другое название
              </div>
            ) : (
              <ScrollArea className="h-[300px]">
                <div className="space-y-1 p-2">
                  {cities.slice(0, 20).map((city) => (
                    <div
                      key={city.code}
                      className="p-3 rounded-md cursor-pointer hover:bg-accent flex items-start gap-2 text-sm"
                      onClick={() => handleSelectCity(city)}
                      data-testid={`city-option-${city.code}`}
                    >
                      <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{city.name}</div>
                        {city.region && (
                          <div className="text-xs text-muted-foreground">{city.region}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </Card>
        )}
      </div>

      {selectedCity && (
        <Card className="p-3 bg-accent/50 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-medium">Выбран город:</div>
            <div className="text-sm">{selectedCity.name}</div>
          </div>
        </Card>
      )}
    </div>
  );
}
