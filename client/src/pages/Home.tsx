import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";

import heroImage1 from '@assets/generated_images/Colorful_macarons_hero_image_11795c3a.png';
import heroImage2 from '@assets/generated_images/Chocolate_gift_box_image_b558d06a.png';
import heroImage3 from '@assets/generated_images/Candy_store_display_image_21d1d54f.png';
import chocolateImage from '@assets/generated_images/Artisanal_chocolate_category_image_35f087de.png';
import candiesImage from '@assets/generated_images/Assorted_candies_category_image_ce151d27.png';
import accessoriesImage from '@assets/generated_images/Sweet_accessories_category_image_fb7f7e3a.png';
import cookiesImage from '@assets/generated_images/Cookies_and_biscuits_image_6375c6a9.png';
import saleImage from '@assets/generated_images/Sale_promotion_banner_image_d14d30e1.png';

export default function Home() {
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();
  const { products, isLoading } = useProducts();
  const { cartItems, addToCart, updateQuantity, removeItem, cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const slides = [
    {
      id: 1,
      image: heroImage1,
      title: 'Французские Макаронс',
      subtitle: 'Изысканные пирожные ручной работы',
    },
    {
      id: 2,
      image: heroImage2,
      title: 'Премиум Шоколад',
      subtitle: 'Бельгийское качество в каждом кусочке',
    },
    {
      id: 3,
      image: heroImage3,
      title: 'Яркие Сладости',
      subtitle: 'Радуга вкусов для всей семьи',
    },
  ];

  const categories = [
    { name: 'Шоколад', image: chocolateImage, slug: 'chocolates' },
    { name: 'Конфеты', image: candiesImage, slug: 'candies' },
    { name: 'Печенье', image: cookiesImage, slug: 'cookies' },
    { name: 'Аксессуары', image: accessoriesImage, slug: 'accessories' },
    { name: 'SALE', image: saleImage, slug: 'sale' },
  ];

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existing = cartItems.find(item => item.id === productId);
    const currentQuantityInCart = existing ? existing.quantity : 0;
    const newQuantity = currentQuantityInCart + 1;

    // Проверка наличия на складе
    if (product.stock !== undefined && product.stock < newQuantity) {
      toast({
        title: "Недостаточно товара",
        description: `На складе осталось только ${product.stock} шт.`,
        variant: "destructive",
      });
      return;
    }

    addToCart({
      id: product.id,
      name: product.name,
      price: product.salePrice || product.price,
      image: product.image,
    });

    toast({
      title: existing ? "Количество обновлено" : "Добавлено в корзину",
      description: existing ? `${product.name} - теперь ${newQuantity} шт.` : product.name,
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    const product = products.find(p => p.id === id);
    
    // Проверка наличия на складе при увеличении количества
    if (product && product.stock !== undefined && product.stock < quantity) {
      toast({
        title: "Недостаточно товара",
        description: `На складе осталось только ${product.stock} шт.`,
        variant: "destructive",
      });
      return;
    }
    
    updateQuantity(id, quantity);
  };

  const handleRemoveItem = (id: string) => {
    removeItem(id);
    toast({
      title: "Удалено из корзины",
      variant: "destructive",
    });
  };

  const handleCheckout = () => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    setLocation('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col relative candy-pattern">
      <Header 
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={() => setCartOpen(true)}
      />
      
      <main className="flex-1 relative z-10">
        {/* Coming Soon Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-300/90 via-purple-300/85 to-orange-200/90 py-6 sm:py-8 md:py-12 animate-gradient backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-200/40 via-purple-200/35 to-yellow-100/40"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')] animate-pulse-slow"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            {/* Floating candies decoration - показываем меньший размер на мобильных */}
            <div className="absolute left-[5%] sm:left-[10%] top-1/2 -translate-y-1/2 animate-float-slow">
              <div className="text-3xl sm:text-4xl md:text-6xl opacity-70 md:opacity-80">🍭</div>
            </div>
            <div className="absolute right-[5%] sm:right-[10%] top-1/2 -translate-y-1/2 animate-float-medium">
              <div className="text-3xl sm:text-4xl md:text-6xl opacity-70 md:opacity-80">🍬</div>
            </div>
            
            {/* Main heading */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="font-serif text-2xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-white drop-shadow-2xl animate-bounce-soft leading-tight">
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0s' }}>С</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.1s' }}>К</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.2s' }}>О</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.3s' }}>Р</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.4s' }}>О</span>
                <span className="inline-block mx-1.5 sm:mx-2 md:mx-3">✨</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.5s' }}>О</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.6s' }}>Т</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.7s' }}>К</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.8s' }}>Р</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '0.9s' }}>Ы</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '1s' }}>Т</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '1.1s' }}>И</span>
                <span className="inline-block animate-wiggle" style={{ animationDelay: '1.2s' }}>Е</span>
              </h1>
              
              {/* Decorative candies - адаптивный размер */}
              <div className="flex justify-center gap-2 sm:gap-3 text-xl sm:text-3xl md:text-4xl animate-sparkle flex-wrap">
                <span className="inline-block animate-rotate-slow">🍭</span>
                <span className="inline-block animate-rotate-slow" style={{ animationDelay: '1s' }}>🍬</span>
                <span className="inline-block animate-rotate-slow" style={{ animationDelay: '2s' }}>🧃</span>
                <span className="inline-block animate-rotate-slow" style={{ animationDelay: '3s' }}>🍡</span>
                <span className="inline-block animate-rotate-slow" style={{ animationDelay: '4s' }}>🍰</span>
              </div>
              
              <p className="text-sm sm:text-lg md:text-xl lg:text-2xl text-white/90 font-medium drop-shadow-lg px-2">
                Готовим для вас что-то очень вкусное! 🎉
              </p>
            </div>
          </div>
          
          {/* Bottom wave decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-6 sm:h-8">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-full">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="hsl(var(--background))"></path>
            </svg>
          </div>
        </div>
        
        <HeroSlider slides={slides} />
        
        <section className="py-16 candy-stripe">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm">
                Категории
              </h2>
              <div className="h-1.5 w-32 bg-gradient-to-r from-pink-400 via-primary to-purple-400 rounded-full mx-auto shadow-lg shadow-pink-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => (
                <CategoryCard
                  key={index}
                  name={category.name}
                  image={category.image}
                  onClick={() => setLocation(`/category/${category.slug}`)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-b from-pink-50/30 via-purple-50/20 to-background relative pastel-dots">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm">
                Популярные товары
              </h2>
              <div className="h-1.5 w-32 bg-gradient-to-r from-pink-400 via-primary to-purple-400 rounded-full mx-auto shadow-lg shadow-pink-200" />
            </div>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Загрузка товаров...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {products.map((product) => (
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
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
    </div>
  );
}
