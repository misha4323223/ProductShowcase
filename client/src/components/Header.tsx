import { Package, Search, Menu, X, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { getAllCategories } from "@/services/api-client";
import type { Category } from "@/types/firebase-types";

interface HeaderProps {
  cartCount: number;
  wishlistCount?: number;
  onCartClick: () => void;
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
    gradient: "from-pink-400 via-pink-500 to-pink-600",
    shadow: "0 4px 0 rgba(219, 39, 119, 0.4), 0 6px 12px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)",
    emoji: "✨"
  };
};

export default function Header({ cartCount, wishlistCount = 0, onCartClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartBounce, setCartBounce] = useState(false);
  const [wishlistBounce, setWishlistBounce] = useState(false);
  const prevCartCount = useRef(cartCount);
  const prevWishlistCount = useRef(wishlistCount);
  const [, setLocation] = useLocation();
  const { user } = useAuth();

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b sticky-candy shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-1.5 pt-2">
          <button 
            className="lg:hidden hover-elevate rounded-full p-1.5 gummy-button bg-gradient-to-r from-pink-100 to-purple-100 cursor-pointer active:scale-95"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setMobileMenuOpen(prev => !prev);
            }}
            data-testid="button-mobile-menu"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="logo-container-flex font-serif text-base md:text-xl lg:text-2xl font-bold cursor-pointer" data-testid="link-logo">
            <span className="logo-switching text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-accent drop-shadow-lg text-center leading-tight">
              <span className="block md:inline">Сладкие</span>
              <span className="block md:inline md:ml-1.5">Наслаждения</span>
            </span>
            <span className="logo-switching logo-alt text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-accent drop-shadow-lg text-center leading-tight">
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
            
            {user ? (
              <Link href="/account">
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-400 via-violet-500 to-indigo-600 hover:scale-110 transition-all shadow-lg hover:shadow-xl jelly-wobble"
                  style={{
                    boxShadow: '0 4px 0 rgba(99, 102, 241, 0.4), 0 6px 12px rgba(139, 92, 246, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                  }}
                  data-testid="button-account"
                >
                  <User className="h-4 w-4 text-white drop-shadow-lg" />
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button
                  className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-indigo-400 via-violet-500 to-indigo-600 hover:scale-110 transition-all shadow-lg hover:shadow-xl jelly-wobble hidden md:flex items-center gap-1.5"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                    boxShadow: '0 4px 0 rgba(99, 102, 241, 0.4), 0 6px 12px rgba(139, 92, 246, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                  }}
                  data-testid="button-login"
                >
                  Войти
                </button>
                <button
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-br from-indigo-400 via-violet-500 to-indigo-600 hover:scale-110 transition-all shadow-lg hover:shadow-xl jelly-wobble md:hidden"
                  style={{
                    boxShadow: '0 4px 0 rgba(99, 102, 241, 0.4), 0 6px 12px rgba(139, 92, 246, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                  }}
                  data-testid="button-login-mobile"
                >
                  <User className="h-4 w-4 text-white drop-shadow-lg" />
                </button>
              </Link>
            )}
            
            <Link href="/wishlist">
              <button
                className="relative w-9 h-9 rounded-full hover:scale-110 transition-all jelly-wobble cursor-pointer bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 shadow-lg flex items-center justify-center"
                style={{
                  boxShadow: '0 4px 0 rgba(219, 39, 119, 0.4), 0 6px 12px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                }}
                data-testid="button-wishlist"
              >
                <Heart className={`h-4 w-4 text-white z-10 drop-shadow-lg transition-all ${wishlistCount > 0 ? 'fill-white' : ''} ${wishlistBounce ? 'heart-melt-animation' : ''}`} />
                {wishlistCount > 0 && (
                  <span className={`absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-xl border-2 border-white z-20 ${wishlistBounce ? 'cart-badge-bounce' : ''}`} data-testid="text-wishlist-count">
                    {wishlistCount}
                  </span>
                )}
              </button>
            </Link>
            
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
