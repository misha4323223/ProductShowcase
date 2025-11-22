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
      className={`group cursor-pointer transition-all duration-300 hover:-translate-y-2 ${isNewYear ? '' : ''}`}
      onClick={onClick}
      data-testid={`card-category-${name.toLowerCase()}`}
    >
      <Card className={`overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-0 ${isNewYear ? 'new-year-category-card-image' : 'hover:shadow-pink-300/50'}`}>
        <div className={`aspect-[4/3] overflow-hidden rounded-2xl ${isNewYear ? '' : 'sugar-crystals'}`}>
          <OptimizedImage
            src={image}
            webpSrc={webpImage}
            alt={`Купить ${name} в интернет-магазине Sweet Delights - каталог сладостей с доставкой по России`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </Card>
      
      <div className={`mt-4 text-center ${isNewYear ? 'new-year-category-title' : ''}`}>
        <h3 className={`font-serif text-xl md:text-2xl font-bold transition-transform duration-300 group-hover:scale-105 ${isNewYear ? 'text-white' : 'text-foreground'}`} data-testid={`text-category-name-${name.toLowerCase()}`}>
          {name}
        </h3>
        <div className={`h-1 w-16 rounded-full mx-auto mt-2 transition-all duration-300 ${isNewYear ? 'bg-gradient-to-r from-yellow-300 to-orange-300' : 'bg-gradient-to-r from-pink-400 via-yellow-300 to-purple-400'}`} />
      </div>
    </div>
  );
}

export default memo(CategoryCardComponent);
