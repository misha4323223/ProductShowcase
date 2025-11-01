import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, Search } from "lucide-react";
import { Link } from "wouter";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function SearchPage() {
  const searchParams = useSearch();
  const query = new URLSearchParams(searchParams).get('q') || '';
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { products, isLoading } = useProducts();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const searchResults = products.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCartItems(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        toast({
          title: "Количество обновлено",
          description: `${product.name} - теперь ${existing.quantity + 1} шт.`,
        });
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast({
        title: "Добавлено в корзину",
        description: product.name,
      });
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.salePrice || product.price,
        quantity: 1,
        image: product.image,
      }];
    });
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const handleRemoveItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
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
    <div className="min-h-screen flex flex-col candy-pattern">
      <Header 
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
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
              <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 shadow-md" 
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  boxShadow: '0 3px 0 rgba(8, 145, 178, 0.4), 0 4px 8px rgba(14, 165, 233, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
                }}
                data-testid="breadcrumb-search"
              >
                Результаты поиска
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <Search className="h-8 w-8 text-primary" />
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm" data-testid="text-search-title">
                Поиск: "{query}"
              </h1>
            </div>
            <div className="h-1.5 w-32 bg-gradient-to-r from-pink-400 via-primary to-purple-400 rounded-full shadow-lg shadow-pink-200" />
          </div>
        </div>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Поиск товаров...</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-lg mb-2" data-testid="text-no-results">
                  По вашему запросу ничего не найдено
                </p>
                <p className="text-muted-foreground text-sm">
                  Попробуйте изменить поисковый запрос
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-muted-foreground" data-testid="text-results-count">
                    Найдено товаров: <span className="font-semibold text-foreground">{searchResults.length}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {searchResults.map((product) => (
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
              </>
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
