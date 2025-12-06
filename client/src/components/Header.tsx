import { Package, Search, Menu, X, User, Heart, Sparkles, Gift, MoreHorizontal, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/services/api-client";
import type { Category } from "@/types/firebase-types";
import { useTheme } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

// Кастомная иконка рулетки
const WheelIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M 12 12 L 12 1 A 11 11 0 0 1 23 12 Z" fill="#9333ea" />
    <path d="M 12 12 L 23 12 A 11 11 0 0 1 19.78 19.78 Z" fill="#ec4899" />
    <path d="M 12 12 L 19.78 19.78 A 11 11 0 0 1 12 23 Z" fill="#f59e0b" />
    <path d="M 12 12 L 12 23 A 11 11 0 0 1 4.22 19.78 Z" fill="#3b82f6" />
    <path d="M 12 12 L 4.22 19.78 A 11 11 0 0 1 1 12 Z" fill="#22c55e" />
    <path d="M 12 12 L 1 12 A 11 11 0 0 1 4.22 4.22 Z" fill="#ef4444" />
    <path d="M 12 12 L 4.22 4.22 A 11 11 0 0 1 12 1 Z" fill="#fbbf24" />
  </svg>
);

interface HeaderProps {
  cartCount: number;
  wishlistCount?: number;
  wheelSpins?: number;
  onCartClick: () => void;
  onWheelClick?: () => void;
}

// Цветовые схемы для категорий
const getCategoryStyle = (slug: string) => {
  const styles: Record<string, { gradient: string; shadow: string; emoji: string }> = {
    chocolates: {
      gradient: "from-amber-600 via-orange-500 to-amber-700",
      shadow: "0 4px 0 rgba(180, 83, 9, 0.4), 0 6px 12px rgba(217, 119, 6, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
      emoji: "🍫"
    },
    candies: {
      gradient: "from-purple-400 via-purple-500 to-purple-600",
      shadow: "0 4px 0 rgba(126, 34, 206, 0.4), 0 6px 12px rgba(147, 51, 234, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
      emoji: "🍭"
    },
    napitki: {
      gradient: "from-teal-400 via-cyan-500 to-teal-600",
      shadow: "0 4px 0 rgba(13, 148, 136, 0.4), 0 6px 12px rgba(20, 184, 166, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
      emoji: "🥤"
    },
    marmalade: {
      gradient: "from-lime-400 via-green-500 to-lime-600",
      shadow: "0 4px 0 rgba(132, 204, 22, 0.4), 0 6px 12px rgba(34, 197, 94, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
      emoji: "🍬"
    },
    "gift-box": {
      gradient: "from-red-400 via-rose-500 to-red-600",
      shadow: "0 4px 0 rgba(220, 38, 38, 0.4), 0 6px 12px rgba(244, 63, 94, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
      emoji: "🎁"
    },
    "cookies-pastries": {
      gradient: "from-yellow-400 via-amber-500 to-yellow-600",
      shadow: "0 4px 0 rgba(234, 179, 8, 0.4), 0 6px 12px rgba(245, 158, 11, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
      emoji: "🍪"
    },
    "mochi-marshmallow": {
      gradient: "from-indigo-400 via-blue-500 to-indigo-600",
      shadow: "0 4px 0 rgba(79, 70, 229, 0.4), 0 6px 12px rgba(59, 130, 246, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
      emoji: "🧁"
    },
    accessories: {
      gradient: "from-cyan-400 via-blue-500 to-cyan-600",
      shadow: "0 4px 0 rgba(8, 145, 178, 0.4), 0 6px 12px rgba(14, 165, 233, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
      emoji: "🎀"
    },
    sale: {
      gradient: "from-red-500 via-orange-500 to-yellow-400",
      shadow: "0 4px 0 rgba(239, 68, 68, 0.4), 0 6px 12px rgba(249, 115, 22, 0.4), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.6)",
      emoji: "🔥"
    }
  };

  // Если категория известна, возвращаем её стиль, иначе дефолтный
  return styles[slug] || {
    gradient: "from-emerald-400 via-green-500 to-emerald-600",
    shadow: "0 4px 0 rgba(5, 150, 105, 0.4), 0 6px 12px rgba(34, 197, 94, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
    emoji: "✨"
  };
};

export default function Header({ cartCount, wishlistCount = 0, wheelSpins = 0, onCartClick, onWheelClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartBounce, setCartBounce] = useState(false);
  const [wishlistBounce, setWishlistBounce] = useState(false);
  const [wheelBounce, setWheelBounce] = useState(false);
  const prevCartCount = useRef(cartCount);
  const prevWishlistCount = useRef(wishlistCount);
  const prevWheelSpins = useRef(wheelSpins);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { theme, setTheme, preferredTheme } = useTheme();

  const themeNames: Record<string, string> = {
    'sakura': '🌸 Сакура',
    'new-year': '🎄 Новый год',
    'spring': '🌼 Весна',
    'autumn': '🍂 Осень',
    'dark': '🌙 Тёмная'
  };

  const isDarkMode = theme === 'dark';

  // Загрузка категорий из API
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 1000 * 60 * 5, // Кэшировать на 5 минут
  });

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 600);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    if (wishlistCount > prevWishlistCount.current) {
      setWishlistBounce(true);
      setTimeout(() => setWishlistBounce(false), 700);
    }
    prevWishlistCount.current = wishlistCount;
  }, [wishlistCount]);

  useEffect(() => {
    if (wheelSpins > prevWheelSpins.current) {
      setWheelBounce(true);
      setTimeout(() => setWheelBounce(false), 700);
    }
    prevWheelSpins.current = wheelSpins;
  }, [wheelSpins]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b sticky-candy shadow-lg header-themed">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-1.5 pt-2">
          <button 
            className="lg:hidden rounded-full p-1.5 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-600 dark:to-purple-600 cursor-pointer active:scale-95 transition-all shadow-md hover:shadow-lg active:shadow-sm"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setMobileMenuOpen(prev => !prev);
            }}
            data-testid="button-mobile-menu"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-gray-800 dark:text-white" /> : <Menu className="h-5 w-5 text-gray-800 dark:text-white" />}
          </button>

          <Link href="/" className="logo-container-flex font-serif text-base md:text-xl lg:text-2xl font-bold cursor-pointer" data-testid="link-logo">
            <span className="logo-switching text-white drop-shadow-lg text-center leading-tight header-text">
              <span className="block md:inline">Сладкие</span>
              <span className="block md:inline md:ml-1.5">Наслаждения</span>
            </span>
            <span className="logo-switching logo-alt text-white drop-shadow-lg text-center leading-tight header-text">
              <span className="block md:inline">Sweet</span>
              <span className="block md:inline md:ml-1.5">Delights</span>
            </span>
          </Link>


          <div className="flex items-center gap-1">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                <Input
                  type="search"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-32 md:w-64 rounded-full border-2 border-pink-200 focus:border-primary sugar-crystals text-sm"
                  autoFocus
                  data-testid="input-search"
                />
                <Button
                  type="submit"
                  size="icon"
                  variant="ghost"
                  className="rounded-full hover-elevate h-8 w-8"
                  data-testid="button-submit-search"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="rounded-full hover-elevate h-8 w-8"
                  data-testid="button-close-search"
                >
                  <X className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 hover:scale-110 transition-all shadow-lg hover:shadow-xl jelly-wobble"
                style={{
                  boxShadow: '0 4px 0 rgba(22, 163, 74, 0.4), 0 6px 12px rgba(34, 197, 94, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                }}
                data-testid="button-open-search"
              >
                <Search className="h-4 w-4 text-white drop-shadow-lg" />
              </button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="relative w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 hover:scale-110 transition-all shadow-lg hover:shadow-xl jelly-wobble"
                  style={{
                    boxShadow: '0 4px 0 rgba(147, 51, 234, 0.4), 0 6px 12px rgba(139, 92, 246, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                  }}
                  data-testid="button-more-menu"
                  title="Дополнительные функции"
                >
                  <MoreHorizontal className="h-4 w-4 text-white drop-shadow-lg" />
                  {user && wheelSpins > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-gradient-to-r from-red-500 to-orange-500 border border-white z-20" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Функции</DropdownMenuLabel>
                
                {user && onWheelClick && (
                  <DropdownMenuItem onClick={onWheelClick} className="cursor-pointer" data-testid="menu-item-wheel">
                    <div className="flex items-center gap-2 w-full">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span>Рулетка Желаний</span>
                      {wheelSpins > 0 && (
                        <span className="ml-auto bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {wheelSpins}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem asChild>
                  <Link href="/certificates" className="cursor-pointer" data-testid="menu-item-certificates">
                    <div className="flex items-center gap-2 w-full">
                      <Gift className="h-4 w-4 text-pink-500" />
                      <span>Сертификаты</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem asChild>
                  <Link href="/wishlist" className="cursor-pointer" data-testid="menu-item-wishlist">
                    <div className="flex items-center gap-2 w-full">
                      <Heart className="h-4 w-4 text-pink-500" />
                      <span>Избранное</span>
                      {wishlistCount > 0 && (
                        <span className="ml-auto bg-pink-100 text-pink-700 text-xs font-bold px-2 py-0.5 rounded-full">
                          {wishlistCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <div className="flex items-center gap-2 w-full">
                      <Moon className="h-4 w-4 text-purple-500" />
                      <span>Тема</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {themeNames[isDarkMode ? 'dark' : preferredTheme]?.split(' ')[0]}
                      </span>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="theme-submenu" sideOffset={2} alignOffset={-20}>
                    {/* Показываем только текущую сезонную тему */}
                    <DropdownMenuItem 
                      onClick={() => setTheme(preferredTheme)}
                      className="cursor-pointer"
                      data-testid={`theme-${preferredTheme}`}
                    >
                      <span className={!isDarkMode ? 'font-bold' : ''}>
                        {themeNames[preferredTheme]}
                      </span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {/* Показываем тёмную тему */}
                    <DropdownMenuItem 
                      onClick={() => {
                        if (isDarkMode) {
                          setTheme(preferredTheme);
                        } else {
                          setTheme('dark');
                        }
                      }}
                      className="cursor-pointer"
                      data-testid="theme-dark"
                    >
                      <span className={isDarkMode ? 'font-bold' : ''}>
                        {themeNames['dark']}
                      </span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                
                <DropdownMenuSeparator />
                
                {user ? (
                  <DropdownMenuItem asChild>
                    <Link href="/account" className="cursor-pointer" data-testid="menu-item-account">
                      <div className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4 text-indigo-500" />
                        <span>Личный кабинет</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="cursor-pointer" data-testid="menu-item-login">
                      <div className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4 text-indigo-500" />
                        <span>Войти</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <button
              className="relative w-10 h-10 rounded-full hover:scale-110 transition-all jelly-wobble cursor-pointer bg-gradient-to-br from-orange-400 via-amber-500 to-orange-600 shadow-lg flex items-center justify-center"
              onClick={onCartClick}
              data-testid="button-cart"
              style={{
                boxShadow: '0 4px 0 rgba(217, 119, 6, 0.4), 0 6px 12px rgba(245, 158, 11, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
              }}
            >
              <Package className="h-5 w-5 text-white z-10 drop-shadow-lg" />
              {cartCount > 0 && (
                <span className={`absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-xl border-2 border-white z-20 ${cartBounce ? 'cart-badge-bounce' : ''}`} data-testid="text-cart-count">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t animate-in slide-in-from-top-2 caramel-drip">
            <div className="flex flex-col gap-3">
              <Link href="/" onClick={() => setMobileMenuOpen(false)}>
                <button 
                  className="w-full px-4 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 active:scale-95 transition-all shadow-lg jelly-wobble text-left"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    boxShadow: '0 4px 0 rgba(219, 39, 119, 0.4), 0 6px 12px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                  }}
                  data-testid="link-mobile-catalog"
                >
                  🍬 Каталог
                </button>
              </Link>
              
              {categories.map((category) => {
                const style = getCategoryStyle(category.slug);
                const isSale = category.slug === 'sale';
                return (
                  <Link key={category.id} href={`/category/${category.slug}`} onClick={() => setMobileMenuOpen(false)}>
                    <button 
                      className={`w-full px-4 py-3 rounded-full text-sm ${isSale ? 'font-bold' : 'font-semibold'} text-white bg-gradient-to-br ${style.gradient} active:scale-95 transition-all shadow-lg ${isSale ? 'animate-pulse-soft' : ''} jelly-wobble text-left`}
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        boxShadow: style.shadow
                      }}
                      data-testid={`link-mobile-${category.slug}`}
                    >
                      {style.emoji} {category.name}
                    </button>
                  </Link>
                );
              })}
              
              {user && (
                <>
                  <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}>
                    <button 
                      className="w-full px-4 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 active:scale-95 transition-all shadow-lg jelly-wobble text-left flex items-center gap-2"
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        boxShadow: '0 4px 0 rgba(219, 39, 119, 0.4), 0 6px 12px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                      }}
                      data-testid="link-mobile-wishlist"
                    >
                      <Heart className="h-4 w-4" />
                      Избранное
                      {wishlistCount > 0 && (
                        <span className="ml-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md border border-white/30">
                          {wishlistCount}
                        </span>
                      )}
                    </button>
                  </Link>
                  
                  <Link href="/certificates" onClick={() => setMobileMenuOpen(false)}>
                    <button 
                      className="w-full px-4 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-rose-400 via-pink-500 to-rose-600 active:scale-95 transition-all shadow-lg jelly-wobble text-left flex items-center gap-2"
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        boxShadow: '0 4px 0 rgba(244, 63, 94, 0.4), 0 6px 12px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                      }}
                      data-testid="link-mobile-certificates"
                    >
                      <Gift className="h-4 w-4" />
                      Сертификаты
                    </button>
                  </Link>
                  
                  <Link href="/account" onClick={() => setMobileMenuOpen(false)}>
                    <button 
                      className="w-full px-4 py-3 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-indigo-400 via-violet-500 to-indigo-600 active:scale-95 transition-all shadow-lg jelly-wobble text-left"
                      style={{
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        boxShadow: '0 4px 0 rgba(99, 102, 241, 0.4), 0 6px 12px rgba(139, 92, 246, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                      }}
                      data-testid="link-mobile-account"
                    >
                      👤 Личный кабинет
                    </button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
