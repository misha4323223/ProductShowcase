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
import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/services/api-client";
import type { Category } from "@/types/firebase-types";

import heroImage1 from '@assets/generated_images/Candy_characters_big_gift_box_7a7377e6.png';
import heroImage1WebP from '@assets/generated_images/Candy_characters_big_gift_box_7a7377e6.webp';
import heroImage2 from '@assets/generated_images/Lollipop_delivery_character_scene_9b1fad01.png';
import heroImage2WebP from '@assets/generated_images/Lollipop_delivery_character_scene_9b1fad01.webp';
import heroImage3 from '@assets/generated_images/Chocolate_gift_box_image_b558d06a.png';
import heroImage3WebP from '@assets/generated_images/Chocolate_gift_box_image_b558d06a.webp';
import heroImage4 from '@assets/generated_images/Candy_store_display_image_21d1d54f.png';
import heroImage4WebP from '@assets/generated_images/Candy_store_display_image_21d1d54f.webp';
import chocolateImage from '@assets/generated_images/Artisanal_chocolate_category_image_35f087de.png';
import chocolateImageWebP from '@assets/generated_images/Artisanal_chocolate_category_image_35f087de.webp';
import candiesImage from '@assets/generated_images/Assorted_candies_category_image_ce151d27.png';
import candiesImageWebP from '@assets/generated_images/Assorted_candies_category_image_ce151d27.webp';
import accessoriesImage from '@assets/generated_images/Sweet_accessories_category_image_fb7f7e3a.png';
import accessoriesImageWebP from '@assets/generated_images/Sweet_accessories_category_image_fb7f7e3a.webp';
import cookiesImage from '@assets/generated_images/Cookies_and_biscuits_image_6375c6a9.png';
import cookiesImageWebP from '@assets/generated_images/Cookies_and_biscuits_image_6375c6a9.webp';
import saleImage from '@assets/generated_images/Sale_promotion_banner_image_d14d30e1.png';
import saleImageWebP from '@assets/generated_images/Sale_promotion_banner_image_d14d30e1.webp';

interface CategoryWithImages {
  id: string;
  name: string;
  slug: string;
  image: string;
  webpImage: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();
  const { products, isLoading: productsLoading } = useProducts();
  const { cartItems, addToCart, updateQuantity, removeItem, cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      try {
        const cats = await getAllCategories();
        console.log("✅ Категории загружены:", cats);
        return cats;
      } catch (error) {
        console.error("❌ Ошибка загрузки категорий:", error);
        throw error;
      }
    },
    retry: 3,
    staleTime: 0, // Всегда запрашивать свежие данные
    gcTime: 0, // Не кэшировать данные вообще
    refetchOnMount: true,
    refetchOnWindowFocus: true, // Обновлять при возврате на вкладку
  });

  useEffect(() => {
    window.scrollTo(0, 0);

    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'image';
    preloadLink.type = 'image/webp';
    preloadLink.href = heroImage1WebP;
    preloadLink.fetchPriority = 'high';
    document.head.appendChild(preloadLink);

    return () => {
      document.head.removeChild(preloadLink);
    };
  }, []);

  const slides = [
    {
      id: 1,
      image: heroImage1,
      webpImage: heroImage1WebP,
      title: 'Sweet Delights',
      subtitle: 'Мир сладостей и радости',
    },
    {
      id: 2,
      image: heroImage2,
      webpImage: heroImage2WebP,
      title: 'Доставим сладость в каждый дом',
      subtitle: '',
    },
    {
      id: 3,
      image: heroImage3,
      webpImage: heroImage3WebP,
      title: 'Яркие Сладости',
      subtitle: 'Радуга вкусов для всей семьи',
    },
  ];

  // Используем ТОЛЬКО категории с изображениями из базы данных
  const categoriesWithImages: CategoryWithImages[] = categories
    .filter((cat: Category) => cat.image) // Показываем только категории с загруженными изображениями
    .map((cat: Category) => {
      // Добавляем timestamp для обхода кэша браузера
      const timestamp = new Date().getTime();
      const imageWithCacheBust = `${cat.image}?v=${timestamp}`;
      
      return {
        name: cat.name,
        slug: cat.slug,
        image: imageWithCacheBust,
        webpImage: imageWithCacheBust, // WebP формат уже загружен в Yandex Storage
        id: cat.id,
      };
    });

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
        <div className="relative overflow-hidden bg-gradient-to-br from-pink-300/90 via-purple-300/85 to-orange-200/90 py-4 sm:py-6 md:py-8 animate-gradient backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-200/40 via-purple-200/35 to-yellow-100/40"></div>
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIgZmlsbD0id2hpdGUiLz48L3N2Zz4=')] animate-pulse-slow"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
            {/* Main heading */}
            <div className="space-y-2 sm:space-y-3">
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

            {categoriesError ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">❌ Ошибка загрузки категорий</p>
                <p className="text-sm text-muted-foreground">{String(categoriesError)}</p>
              </div>
            ) : categoriesLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Категории не найдены</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {categoriesWithImages.map((category: CategoryWithImages) => (
                  <CategoryCard
                    key={category.id}
                    name={category.name}
                    image={category.image}
                    webpImage={category.webpImage}
                    onClick={() => setLocation(`/category/${category.slug}`)}
                  />
                ))}
              </div>
            )}
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
            {productsLoading ? (
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