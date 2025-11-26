import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ShoppingCart from "@/components/ShoppingCart";
import ProductCard from "@/components/ProductCard";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag, ChevronRight, Share2, Check } from "lucide-react";

export default function WishlistPage() {
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const { wishlistItems } = useWishlist();
  const { products } = useProducts();
  const { addToCart, updateQuantity, removeItem, cartItems, cartCount } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleShareWishlist = () => {
    const shareLink = `${window.location.origin}/shared-wishlist/${user?.userId}`;
    
    // Попробовать Clipboard API (для современных браузеров)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(shareLink).then(() => {
        setCopied(true);
        toast({
          title: "Ссылка скопирована!",
          description: "Поделитесь ссылкой на ваше избранное с друзьями",
        });
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        // Fallback если Clipboard API не сработал
        copyToClipboardFallback(shareLink);
      });
    } else {
      // Fallback для старых браузеров
      copyToClipboardFallback(shareLink);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      toast({
        title: "Ссылка скопирована!",
        description: "Поделитесь ссылкой на ваше избранное с друзьями",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать ссылку",
        variant: "destructive",
      });
    } finally {
      document.body.removeChild(textarea);
    }
  };

  const wishlistProducts = products.filter(p => 
    wishlistItems.some(item => item.productId === p.id)
  );

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

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header 
          cartCount={cartCount}
          onCartClick={() => setCartOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center max-w-md mx-auto px-4">
            <Heart className="h-24 w-24 mx-auto text-pink-300 mb-6" />
            <h1 className="text-3xl font-serif font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600">
              Избранное доступно только авторизованным пользователям
            </h1>
            <p className="text-muted-foreground mb-8">
              Войдите в свой аккаунт чтобы сохранять любимые товары
            </p>
            <Button 
              size="lg"
              className="rounded-full gummy-button bg-gradient-to-r from-primary via-pink-500 to-accent"
              onClick={() => setLocation('/login')}
              data-testid="button-go-login"
            >
              Войти в аккаунт
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
                data-testid="breadcrumb-wishlist"
              >
                Избранное
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
              <div className="flex items-center gap-4">
                <Heart className="h-10 w-10 text-pink-500 fill-pink-500" />
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm" data-testid="text-page-title">
                  Избранное
                </h1>
              </div>
              <Button
                onClick={handleShareWishlist}
                className="gap-2 bg-gradient-to-r from-pink-500 to-primary hover:shadow-lg"
                data-testid="button-share-wishlist"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    Скопирована!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4" />
                    Поделиться
                  </>
                )}
              </Button>
            </div>
            <p className="text-muted-foreground" data-testid="text-wishlist-count">
              {wishlistProducts.length === 0 
                ? "Пока пусто" 
                : `${wishlistProducts.length} ${wishlistProducts.length === 1 ? 'товар' : wishlistProducts.length < 5 ? 'товара' : 'товаров'}`
              }
            </p>
            <div className="h-1.5 w-32 bg-gradient-to-r from-pink-400 via-primary to-purple-400 rounded-full mt-4 shadow-lg shadow-pink-200" />
          </div>
        </div>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {wishlistProducts.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingBag className="h-24 w-24 mx-auto text-muted-foreground mb-6" />
                <h2 className="text-2xl font-bold mb-4">
                  Ваше избранное пусто
                </h2>
                <p className="text-muted-foreground mb-8">
                  Добавляйте товары которые вам нравятся, нажимая на ❤️
                </p>
                <Button
                  size="lg"
                  className="rounded-full gummy-button bg-gradient-to-r from-primary via-pink-500 to-accent"
                  onClick={() => setLocation('/')}
                  data-testid="button-go-home"
                >
                  Перейти к покупкам
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {wishlistProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    salePrice={product.salePrice}
                    image={product.image}
                    stock={product.stock}
                    onAddToCart={handleAddToCart}
                    onClick={(id) => setLocation(`/product/${id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />

      <ShoppingCart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
