import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import { WaveDivider } from "@/components/WaveDivider";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { createWebsiteSchema, createOrganizationSchema } from "@/lib/seo-helpers";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useWheel } from "@/contexts/WheelContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { getProfile, isBirthdayToday } from "@/services/profile-api";
import { Cake } from "lucide-react";
import WheelModal from "@/components/WheelModal";
import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/services/api-client";
import { getHeroSlides, type HeroSlide } from "@/services/site-settings-client";
import type { Category } from "@/types/firebase-types";

import heroImage1 from '@assets/generated_images/Candy_characters_big_gift_box_7a7377e6.png';
import heroImage1WebP from '@assets/generated_images/Candy_characters_big_gift_box_7a7377e6.webp';
import heroImage2 from '@assets/generated_images/Lollipop_delivery_character_scene_9b1fad01.png';
import heroImage2WebP from '@assets/generated_images/Lollipop_delivery_character_scene_9b1fad01.webp';
import heroImage3 from '@assets/generated_images/Candy_box_explosion_celebration_bbc9c118.png';
import heroImage3WebP from '@assets/generated_images/Candy_box_explosion_celebration_bbc9c118.webp';
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
  const [wheelOpen, setWheelOpen] = useState(false);
  const [isBirthday, setIsBirthday] = useState(false);
  const [userName, setUserName] = useState("");
  const { toast } = useToast();
  const { theme, isDarkMode } = useTheme();
  const { user } = useAuth();
  const { products, isLoading: productsLoading } = useProducts();
  const { cartItems, addToCart, updateQuantity, removeItem, cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { spins } = useWheel();

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
    if (user) {
      checkBirthday();
    }
  }, [user]);

  const checkBirthday = async () => {
    try {
      const profile = await getProfile(user?.email || '');
      if (profile.firstName) {
        setUserName(profile.firstName);
      }
      if (isBirthdayToday(profile.birthDate)) {
        setIsBirthday(true);
      }
    } catch (error) {
      console.error('Ошибка проверки дня рождения:', error);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);

    // Проверяем флаг открытия рулетки из чатбота
    if (typeof window !== 'undefined' && localStorage.getItem('openWheelModal')) {
      localStorage.removeItem('openWheelModal');
      setWheelOpen(true);
    }

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

  // Слушаем событие открытия рулетки из чатбота
  useEffect(() => {
    const handleWheelOpen = () => {
      if (localStorage.getItem('openWheelModal')) {
        localStorage.removeItem('openWheelModal');
        setWheelOpen(true);
      }
    };

    window.addEventListener('wheelModalOpen', handleWheelOpen);
    return () => window.removeEventListener('wheelModalOpen', handleWheelOpen);
  }, []);

  const { data: heroSlidesData = [], isLoading: slidesLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides", theme],
    queryFn: () => getHeroSlides(theme),
    staleTime: 60000,
    gcTime: 300000,
  });

  // Использую слайды из YDB (которые управляются в админке отдельно для каждой темы)
  const slides = heroSlidesData.length > 0 ? heroSlidesData : [
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
      title: 'Ваши улыбки — наша награда!',
      subtitle: '',
    },
  ];

  // Используем ТОЛЬКО категории с изображениями из базы данных
  // Мемоизируем чтобы не пересчитывать каждый раз и не вызывать переапплаицирование CategoryCard
  const categoriesWithImages: CategoryWithImages[] = useMemo(() => 
    categories
      .filter((cat: Category) => cat.image) // Показываем только категории с загруженными изображениями
      .map((cat: Category) => {
        return {
          name: cat.name,
          slug: cat.slug,
          image: cat.image,
          webpImage: cat.image, // WebP формат уже загружен в Yandex Storage
          id: cat.id,
        };
      }),
    [categories]
  );

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

  const homeStructuredData = useMemo(() => 
    [createWebsiteSchema(), createOrganizationSchema()],
    []
  );

  return (
    <div className="min-h-screen flex flex-col relative candy-pattern">
      <SEO
        title="Sweet Delights - Магазин сладостей и аксессуаров | Доставка по России"
        description="Откройте для себя широкий ассортимент вкусных сладостей, премиального шоколада, конфет и стильных аксессуаров. Быстрая доставка по всей России. Скидки до 50%!"
        keywords="сладости купить, шоколад премиум, конфеты доставка, печенье купить, аксессуары для сладостей, подарочные наборы сладостей, Sweet Delights"
        type="website"
        structuredData={homeStructuredData}
      />
      <Header
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        wheelSpins={spins}
        onCartClick={() => setCartOpen(true)}
        onWheelClick={() => setWheelOpen(true)}
      />

      <main className="flex-1 relative z-10">
        {/* Баннер поздравления на день рождения */}
        {isBirthday && (
          <div className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 py-4 px-4 text-center border-b-2 border-pink-300">
            <div className="flex items-center justify-center gap-2 max-w-7xl mx-auto">
              <Cake className="h-6 w-6 text-white flex-shrink-0" />
              <div>
                <p className="text-white font-bold text-lg">
                  {userName ? `С днём рождения, ${userName}! 🎊` : "С днём рождения! 🎊"}
                </p>
                <p className="text-white text-sm">Дарим Вам скидку 15%</p>
              </div>
              <Cake className="h-6 w-6 text-white flex-shrink-0" />
            </div>
          </div>
        )}

        {/* Coming Soon Banner - скрыт в новогодней теме */}
        {theme !== 'new-year' && (
          <div className="relative overflow-hidden bg-gradient-to-br from-pink-300/90 via-purple-300/85 to-orange-200/90 py-2 sm:py-3 md:py-4 animate-gradient backdrop-blur-sm">
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
        )}

        <div className="md:max-w-7xl md:mx-auto">
          <HeroSlider slides={slides} />
          
          {/* Волнистый разделитель между слайдером и категориями */}
          <WaveDivider />
        </div>

        <section className={`py-16 ${['new-year', 'dark', 'light'].includes(theme) ? 'bg-transparent' : 'candy-stripe'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 
                className={theme === 'new-year' ? "font-serif text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg" : "font-serif text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm"}
                style={theme === 'new-year' ? { 
                  textShadow: '2px 2px 0 rgba(255, 0, 0, 0.8), -2px -2px 0 rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 0, 0, 0.5)',
                  fontWeight: '900'
                } : {}}
              >
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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square bg-muted animate-pulse rounded-3xl" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Категории не найдены</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-10">
                {categoriesWithImages.map((category: CategoryWithImages) => (
                  <CategoryCard
                    key={category.id}
                    name={category.name}
                    image={category.image}
                    webpImage={category.webpImage}
                    onClick={() => setLocation(`/category/${category.slug}`)}
                    theme={theme}
                    isDarkMode={isDarkMode}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={`py-16 ${['new-year', 'dark', 'light'].includes(theme) ? 'bg-transparent' : 'bg-gradient-to-b from-pink-50/30 via-purple-50/20 to-background'} relative ${['new-year', 'dark', 'light'].includes(theme) ? '' : 'pastel-dots'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 
                className={theme === 'new-year' ? "font-serif text-3xl md:text-4xl font-bold mb-2 text-white drop-shadow-lg" : "font-serif text-3xl md:text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm"}
                style={theme === 'new-year' ? { 
                  textShadow: '2px 2px 0 rgba(255, 0, 0, 0.8), -2px -2px 0 rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 0, 0, 0.5)',
                  fontWeight: '900'
                } : {}}
              >
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
                    description={product.description}
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
      
      <WheelModal
        open={wheelOpen}
        onClose={() => setWheelOpen(false)}
      />
    </div>
  );
}