import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import OptimizedImage from "@/components/OptimizedImage";
import { useTheme } from "@/contexts/ThemeContext";

interface CategoryCardProps {
  name: string;
  image: string;
  webpImage: string;
  onClick?: () => void;
}

export default function CategoryCard({ name, image, webpImage, onClick }: CategoryCardProps) {
  const { theme } = useTheme();
  const isNewYear = theme === 'new-year';
  
  return (
    <Card 
      className={`group relative overflow-visible cursor-pointer border-0 rounded-3xl shadow-xl hover:shadow-2xl ${isNewYear ? 'hover:shadow-white/50 category-card-new-year' : 'hover:shadow-pink-300/50'} transition-all duration-300 hover:-translate-y-3 ${isNewYear ? '' : 'candy-wrapper metallic-wrapper'} jelly-wobble`}
      onClick={onClick}
      data-testid={`card-category-${name.toLowerCase()}`}
    >
      <div className={`aspect-[4/3] overflow-hidden rounded-3xl ${isNewYear ? '' : 'sugar-crystals'}`}>
        <OptimizedImage
          src={image}
          webpSrc={webpImage}
          alt={`Купить ${name} в интернет-магазине Sweet Delights - каталог сладостей с доставкой по России`}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115 group-hover:rotate-2"
        />
      </div>
      <div className={`absolute inset-0 ${isNewYear ? 'bg-gradient-to-t from-blue-900/40 via-transparent to-transparent' : 'bg-gradient-to-t from-pink-900/80 via-purple-900/40 to-transparent'} group-hover:${isNewYear ? 'from-blue-900/50' : 'from-pink-800/70'} rounded-3xl`} />
      <div className={`absolute top-4 right-4 ${isNewYear ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'} transition-opacity duration-300`}>
        <div className="w-10 h-10 rounded-full lollipop-swirl border-4 border-white shadow-2xl flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-white drop-shadow-lg" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 caramel-drip">
        <div className="relative">
          <h3 className="font-serif text-2xl md:text-3xl font-bold text-white drop-shadow-2xl transition-transform duration-300 group-hover:scale-110" data-testid={`text-category-name-${name.toLowerCase()}`}>
            {name}
          </h3>
          <div className={`h-1.5 w-20 rounded-full mt-2 ${isNewYear ? 'bg-white' : 'bg-gradient-to-r from-pink-400 via-yellow-300 to-purple-400'} transition-all duration-300 ${isNewYear ? 'shadow-lg shadow-white/50' : 'shadow-lg shadow-pink-300/50'} ${isNewYear ? '' : 'gummy-button'}`} style={isNewYear ? undefined : {boxShadow: '0 3px 0 -1px rgba(0,0,0,0.15), 0 4px 6px -1px rgba(0,0,0,0.2)'}} />
        </div>
      </div>
    </Card>
  );
}
