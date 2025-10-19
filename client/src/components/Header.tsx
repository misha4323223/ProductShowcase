import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

export default function Header({ cartCount, onCartClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b sticky-candy shadow-lg">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <button 
            className="lg:hidden hover-elevate rounded-full p-2 gummy-button bg-gradient-to-r from-pink-100 to-purple-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="font-serif text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-accent drop-shadow-lg">
            Sweet Delights
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <a href="#" className="text-sm font-medium hover:text-primary transition-all hover:scale-105 relative group" data-testid="link-catalog">
              Каталог
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full"></span>
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-all hover:scale-105 relative group" data-testid="link-chocolates">
              Шоколад
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full"></span>
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-all hover:scale-105 relative group" data-testid="link-candies">
              Конфеты
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full"></span>
            </a>
            <a href="#" className="text-sm font-medium hover:text-primary transition-all hover:scale-105 relative group" data-testid="link-accessories">
              Аксессуары
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all group-hover:w-full"></span>
            </a>
            <a href="#" className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-destructive to-orange-500 hover:scale-110 transition-all pulse-glow" data-testid="link-sale">
              SALE
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                <Input
                  type="search"
                  placeholder="Поиск..."
                  className="w-40 md:w-64 rounded-full border-2 border-pink-200 focus:border-primary sugar-crystals"
                  autoFocus
                  data-testid="input-search"
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSearchOpen(false)}
                  className="rounded-full hover-elevate"
                  data-testid="button-close-search"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSearchOpen(true)}
                className="rounded-full hover-elevate gummy-button bg-gradient-to-br from-pink-50 to-purple-50"
                data-testid="button-open-search"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}
            
            <button
              className="relative w-12 h-12 donut-shape donut-sprinkles hover:scale-110 transition-all jelly-wobble cursor-pointer"
              onClick={onCartClick}
              data-testid="button-cart"
              style={{ background: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)' }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-white z-10 drop-shadow-lg" />
              </div>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold flex items-center justify-center shadow-xl animate-bounce-soft border-2 border-white z-20" data-testid="text-cart-count">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav className="lg:hidden py-4 border-t animate-in slide-in-from-top-2 caramel-drip">
            <div className="flex flex-col gap-3">
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover-elevate" data-testid="link-mobile-catalog">
                Каталог
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover-elevate" data-testid="link-mobile-chocolates">
                Шоколад
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover-elevate" data-testid="link-mobile-candies">
                Конфеты
              </a>
              <a href="#" className="text-sm font-medium hover:text-primary transition-colors py-2 px-3 rounded-lg hover-elevate" data-testid="link-mobile-accessories">
                Аксессуары
              </a>
              <a href="#" className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors py-2 px-3 rounded-lg hover-elevate" data-testid="link-mobile-sale">
                SALE
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
