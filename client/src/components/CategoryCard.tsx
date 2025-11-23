import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import { useMemo, memo } from "react";

interface CategoryCardProps {
  name: string;
  image: string;
  webpImage: string;
  onClick?: () => void;
  theme: string;
}

function CategoryCardComponent({ name, image, webpImage, onClick, theme }: CategoryCardProps) {
  const isNewYear = useMemo(() => theme === 'new-year', [theme]);
  
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer"
      data-testid={`card-category-${name.toLowerCase()}`}
    >
      <Card className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow border-0">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <OptimizedImage
            src={image}
            webpSrc={webpImage}
            alt={`Купить ${name} в интернет-магазине Sweet Delights - каталог сладостей с доставкой по России`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="p-3 text-center">
          <h3 className="font-serif text-base md:text-lg font-bold line-clamp-2 transition-colors group-hover:text-primary" data-testid={`text-category-name-${name.toLowerCase()}`}>
            {isNewYear && <Sparkles className="inline-block w-4 h-4 mr-1 text-yellow-400 animate-pulse" />}
            {name}
            {isNewYear && <Sparkles className="inline-block w-4 h-4 ml-1 text-yellow-400 animate-pulse" />}
          </h3>
        </div>
      </Card>
    </div>
  );
}

export default memo(CategoryCardComponent);
