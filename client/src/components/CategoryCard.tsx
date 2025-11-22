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
    <Card 
      className={`group relative overflow-hidden cursor-pointer border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 jelly-wobble ${isNewYear ? 'new-year-category-card hover:shadow-red-400/40' : 'hover:shadow-pink-300/50 candy-wrapper metallic-wrapper'}`}
      onClick={onClick}
      data-testid={`card-category-${name.toLowerCase()}`}
    >
      <div className={`aspect-[4/3] overflow-hidden rounded-3xl ${isNewYear ? 'new-year-category-bg' : 'sugar-crystals'}`}>
        <OptimizedImage
          src={image}
          webpSrc={webpImage}
          alt={`Купить ${name} в интернет-магазине Sweet Delights - каталог сладостей с доставкой по России`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115 group-hover:rotate-2"
        />
      </div>
      {isNewYear && <div className="category-card-new-year-snow-before"></div>}
      {isNewYear && <div className="category-card-new-year-snow-after"></div>}
      <div className={`absolute inset-0 rounded-3xl ${isNewYear ? 'new-year-category-overlay' : 'bg-gradient-to-t from-pink-900/80 via-purple-900/40 to-transparent group-hover:from-pink-800/70'}`} />
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
        <div className="relative">
          <h3 className={`font-serif text-2xl md:text-3xl font-bold transition-transform duration-300 group-hover:scale-110 drop-shadow-2xl ${isNewYear ? 'text-white new-year-text-outline' : 'text-white'}`} data-testid={`text-category-name-${name.toLowerCase()}`}>
            {name}
          </h3>
          <div className={`h-1.5 w-20 rounded-full mt-2 transition-all duration-300 ${isNewYear ? 'bg-gradient-to-r from-yellow-300 via-yellow-200 to-orange-300 shadow-lg shadow-yellow-400/60 new-year-line-glow' : `bg-gradient-to-r from-pink-400 via-yellow-300 to-purple-400 shadow-lg shadow-pink-300/50 ${!isNewYear && 'gummy-button'}`}`} style={!isNewYear ? {boxShadow: '0 3px 0 -1px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.2)'} : undefined} />
        </div>
      </div>
    </Card>
  );
}

export default memo(CategoryCardComponent);
