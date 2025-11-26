import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import ProductCard from "@/components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, ChevronRight, ArrowLeft } from "lucide-react";
import { getPublicWishlist } from "@/services/yandex-wishlist";

export default function SharedWishlistPage() {
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Пользователь");
  const [notFound, setNotFound] = useState(false);
  const { user } = useAuth();
  const { products } = useProducts();
  const { addToCart, cartItems, cartCount } = useCart();
  const { toast } = useToast();

  // Получить userId из URL
  const urlParts = window.location.pathname.split("/");
  const shareUserId = urlParts[urlParts.length - 1];

  useEffect(() => {
    window.scrollTo(0, 0);
    loadSharedWishlist();
  }, [shareUserId]);

  const loadSharedWishlist = async () => {
    try {
      setLoading(true);
      const items = await getPublicWishlist(shareUserId);
      setWishlistItems(items.map(item => item.productId));
      // Генерируем имя на основе userId (в реальном приложении это будет из профиля)
      setUserName(`Список желаний #${shareUserId.slice(0, 8)}`);
    } catch (error) {
      console.error("Ошибка загрузки списка:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const wishlistProducts = products.filter(p => wishlistItems.includes(p.id));

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cartItems.find(item => item.id === productId);
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.image,
    });

    toast({
      title: existing ? "Количество обновлено" : "Добавлено в корзину",
      description: existing ? `${product.name} - теперь ${existing.quantity + 1} шт.` : product.name,
    });
  };

  const handleCheckout = () => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    setLocation('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header 
          cartCount={cartCount}
          onCartClick={() => setCartOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header 
          cartCount={cartCount}
          onCartClick={() => setCartOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto px-4">
            <Heart className="h-24 w-24 mx-auto text-pink-300 mb-6 opacity-50" />
            <h1 className="text-3xl font-serif font-bold mb-4 text-foreground">
              Список не найден
            </h1>
            <p className="text-muted-foreground mb-8">
              К сожалению, этот список желаний больше не доступен
            </p>
            <Button 
              size="lg"
              onClick={() => setLocation('/')}
              className="rounded-full"
              data-testid="button-go-home"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              На главную
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col candy-pattern">
      <Header 
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />
      <ShoppingCart 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />
      
      <main className="flex-1 relative z-10">
        <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 py-12 candy-stripe">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center gap-2 mb-4">
              <Link 
                href="/" 
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 hover:scale-110 transition-all shadow-md hover:shadow-lg jelly-wobble" 
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  boxShadow: '0 3px 0 rgba(219, 39, 119, 0.4), 0 4px 8px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                }}
                data-testid="breadcrumb-home"
              >
                Главная
              </Link>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 shadow-md" 
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  boxShadow: '0 3px 0 rgba(219, 39, 119, 0.4), 0 4px 8px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                }}
                data-testid="breadcrumb-shared-wishlist"
              >
                Список желаний
              </span>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <Heart className="h-10 w-10 text-pink-500 fill-pink-500" />
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm" data-testid="text-shared-wishlist-title">
                {userName}
              </h1>
            </div>
            <p className="text-muted-foreground" data-testid="text-shared-wishlist-count">
              {wishlistProducts.length === 0 
                ? "Список пуст" 
                : `${wishlistProducts.length} ${wishlistProducts.length === 1 ? 'товар' : wishlistProducts.length < 5 ? 'товара' : 'товаров'}`
              }
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          {wishlistProducts.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 mx-auto text-pink-300 mb-4 opacity-50" />
              <p className="text-muted-foreground mb-8">В этом списке пока нет товаров</p>
              <Button 
                onClick={() => setLocation('/')}
                className="rounded-full"
                data-testid="button-browse-products"
              >
                Посмотреть каталог
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  isInWishlist={false}
                  onWishlistToggle={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
