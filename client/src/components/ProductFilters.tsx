import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

interface ProductFiltersProps {
  onSortChange: (sort: string) => void;
  onPriceRangeChange: (min: number, max: number) => void;
  onSaleOnlyChange: (saleOnly: boolean) => void;
  maxPrice: number;
  currentSort: string;
  currentPriceRange: [number, number];
  saleOnly: boolean;
  totalProducts: number;
  filteredCount: number;
}

export default function ProductFilters({
  onSortChange,
  onPriceRangeChange,
  onSaleOnlyChange,
  maxPrice,
  currentSort,
  currentPriceRange,
  saleOnly,
  totalProducts,
  filteredCount,
}: ProductFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleReset = () => {
    onSortChange('default');
    onPriceRangeChange(0, maxPrice);
    onSaleOnlyChange(false);
  };

  const hasActiveFilters = currentSort !== 'default' || 
    currentPriceRange[0] > 0 || 
    currentPriceRange[1] < maxPrice || 
    saleOnly;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
            data-testid="button-toggle-filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2"
              data-testid="button-reset-filters"
            >
              <X className="h-4 w-4" />
              Сбросить
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Label htmlFor="sort-select" className="text-sm whitespace-nowrap">
            Сортировка:
          </Label>
          <Select value={currentSort} onValueChange={onSortChange}>
            <SelectTrigger id="sort-select" className="w-full sm:w-[200px]" data-testid="select-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default" data-testid="option-sort-default">По умолчанию</SelectItem>
              <SelectItem value="price-asc" data-testid="option-sort-price-asc">Цена: по возрастанию</SelectItem>
              <SelectItem value="price-desc" data-testid="option-sort-price-desc">Цена: по убыванию</SelectItem>
              <SelectItem value="name-asc" data-testid="option-sort-name-asc">Название: А-Я</SelectItem>
              <SelectItem value="name-desc" data-testid="option-sort-name-desc">Название: Я-А</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showFilters && (
        <div className="bg-card border rounded-lg p-6 space-y-6 animate-in fade-in-50 slide-in-from-top-2" data-testid="container-filters">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Диапазон цен</Label>
              <div className="space-y-4">
                <Slider
                  min={0}
                  max={maxPrice}
                  step={10}
                  value={currentPriceRange}
                  onValueChange={(value) => onPriceRangeChange(value[0], value[1])}
                  className="w-full"
                  data-testid="slider-price"
                />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    От: <span className="font-semibold text-foreground" data-testid="text-price-min">{currentPriceRange[0]} ₽</span>
                  </span>
                  <span className="text-muted-foreground">
                    До: <span className="font-semibold text-foreground" data-testid="text-price-max">{currentPriceRange[1]} ₽</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Специальные предложения</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={saleOnly ? "default" : "outline"}
                  size="sm"
                  onClick={() => onSaleOnlyChange(!saleOnly)}
                  className="gap-2"
                  data-testid="button-sale-filter"
                >
                  {saleOnly && <X className="h-4 w-4" />}
                  Только со скидкой
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Показано товаров: <span className="font-semibold text-foreground" data-testid="text-filtered-count">{filteredCount}</span> из {totalProducts}
            </div>
            {hasActiveFilters && (
              <Badge variant="secondary" data-testid="badge-active-filters">
                Активные фильтры
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
