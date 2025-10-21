import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Sparkles, Heart } from "lucide-react";
import { useState } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  image: string;
  onAddToCart: (id: string) => void;
  onClick: (id: string) => void;
}

export default function ProductCard({ 
  id, 
  name, 
  price, 
  salePrice, 
  image, 
  onAddToCart,
  onClick 
}: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const hasDiscount = salePrice && salePrice < price;
  const discount = hasDiscount ? Math.round(((price - salePrice) / price) * 100) : 0;
  const inWishlist = isInWishlist(id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAdding(true);
    onAddToCart(id);
    setTimeout(() => setIsAdding(false), 500);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт чтобы добавлять товары в избранное",
        variant: "destructive",
      });
      return;
    }

    try {
      await toggleWishlist(id);
      toast({
        title: inWishlist ? "Удалено из избранного" : "Добавлено в избранное",
        description: inWishlist ? `${name} удалён` : `${name} добавлен`,
      });
    } catch (error) {
      console.error("Ошибка wishlist:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="group overflow-visible cursor-pointer rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-200/50 candy-wrapper jelly-wobble border-2 border-pink-100 relative" data-testid={`card-product-${id}`}>
      <Button
        size="icon"
        variant="ghost"
        className={`absolute top-2 left-2 w-10 h-10 rounded-full backdrop-blur-md transition-all duration-300 z-40 shadow-lg ${
          inWishlist 
            ? 'bg-pink-500 hover:bg-pink-600 text-white' 
            : 'bg-white hover:bg-white text-pink-500'
        }`}
        onClick={handleToggleWishlist}
        data-testid={`button-wishlist-${id}`}
      >
        <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
      </Button>
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-t-3xl sugar-crystals" onClick={() => onClick(id)}>
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 group-hover:rotate-1"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <ShoppingCart className="h-16 w-16" />
          </div>
        )}
        
        {hasDiscount && (
          <div className="absolute top-3 right-3 w-16 h-16 lollipop-swirl-badge rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50 animate-rotate-slow border-4 border-white" data-testid={`badge-discount-${id}`}>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
            <span className="relative z-10 text-white font-bold text-sm drop-shadow-lg">-{discount}%</span>
          </div>
        )}
        {isAdding && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-purple-500/30 backdrop-blur-sm drip-animation">
            <Sparkles className="h-12 w-12 text-white animate-sparkle drop-shadow-2xl" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-3 bg-gradient-to-b from-white via-pink-50/20 to-white relative caramel-drip">
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] text-foreground" data-testid={`text-product-name-${id}`}>
          {name}
        </h3>
        <div className="flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm" data-testid={`text-sale-price-${id}`}>
                {salePrice}₽
              </span>
              <span className="text-sm text-muted-foreground line-through" data-testid={`text-original-price-${id}`}>
                {price}₽
              </span>
            </>
          ) : (
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm" data-testid={`text-price-${id}`}>
              {price}₽
            </span>
          )}
        </div>
        <Button 
          className="w-full rounded-full gummy-button squish-active bg-gradient-to-r from-primary via-pink-500 to-accent hover:from-pink-600 hover:via-primary hover:to-purple-500 text-white font-semibold text-sm py-6" 
          onClick={handleAddToCart}
          data-testid={`button-add-to-cart-${id}`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          В корзину
        </Button>
      </div>
    </Card>
  );
}
