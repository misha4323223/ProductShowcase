import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Вызываем CDEK API для поиска городов
  const { data: citiesData, isLoading, error: queryError } = useQuery<{ success: boolean; data: City[] }>({
    queryKey: ['/api/delivery/cdek/search-city', `?q=${searchQuery}`],
    enabled: searchQuery.length >= 2,
  });

  if (queryError) {
    console.error('🔴 Ошибка поиска городов:', queryError);
  }

  const cities = citiesData?.data || [];

  console.log('🔍 City Search:', { searchQuery, isLoading, citiesCount: cities.length });

  const handleSelectCity = (city: City) => {
    console.log('✅ CITY SELECTED:', city);
    setSelectedCity(city);
    setSearchQuery(city.name);
    setShowResults(false);
    onSelect(city);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-3" data-testid="city-search-selector" ref={containerRef}>
      <h3 className="text-lg font-semibold">Выберите ваш город</h3>
      
      <div className="relative z-40">
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
          <div className="absolute top-full left-0 right-0 mt-1 z-[9999] bg-white dark:bg-slate-950 border border-border rounded-lg shadow-lg overflow-hidden">
            {isLoading && (
              <div className="p-4 flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Поиск городов...
              </div>
            )}
            
            {!isLoading && searchQuery.length < 2 && (
              <div className="p-4 text-sm text-muted-foreground">
                Введите минимум 2 символа для поиска
              </div>
            )}
            
            {!isLoading && searchQuery.length >= 2 && cities.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                Город не найден. Попробуйте другое название
              </div>
            )}
            
            {!isLoading && cities.length > 0 && (
              <div className="max-h-[300px] overflow-y-auto">
                {cities.slice(0, 20).map((city, index) => (
                  <button
                    key={`${city.code || index}`}
                    type="button"
                    onClick={() => handleSelectCity(city)}
                    className="w-full p-3 text-left hover:bg-accent flex items-start gap-2 text-sm border-b border-border last:border-b-0 transition-colors"
                    data-testid={`city-option-${city.code || index}`}
                  >
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{city.name}</div>
                      {city.region && (
                        <div className="text-xs text-muted-foreground">{city.region}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
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
