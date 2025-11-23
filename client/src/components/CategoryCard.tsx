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
      <Card className="overflow-hidden rounded-lg shadow-md hover:shadow-lg transition-shadow border-0 bg-white dark:bg-slate-900">
        <div className="aspect-[4/3] overflow-hidden bg-white dark:bg-slate-800">
          <OptimizedImage
            src={image}
            webpSrc={webpImage}
            alt={`Купить ${name} в интернет-магазине Sweet Delights - каталог сладостей с доставкой по России`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className={`px-2 py-1 md:p-4 text-center ${isNewYear ? 'bg-gradient-to-r from-red-600 to-red-700 dark:from-red-900 dark:to-red-950' : ''}`}>
          <h3 className={`font-serif text-xs md:text-lg font-bold line-clamp-1 transition-colors whitespace-nowrap overflow-hidden text-ellipsis ${isNewYear ? 'text-white' : 'text-red-600 dark:text-red-500 group-hover:text-red-700 dark:group-hover:text-red-400'}`} data-testid={`text-category-name-${name.toLowerCase()}`}>
            {isNewYear && <Sparkles className="inline-block w-3 h-3 md:w-5 md:h-5 mr-0.5 md:mr-1 text-yellow-400 animate-pulse" />}
            {name}
            {isNewYear && <Sparkles className="inline-block w-3 h-3 md:w-5 md:h-5 ml-0.5 md:ml-1 text-yellow-400 animate-pulse" />}
          </h3>
        </div>
      </Card>
    </div>
  );
}

export default memo(CategoryCardComponent);
