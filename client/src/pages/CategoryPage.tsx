import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import { useProducts, useProductsByCategory } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

export default function CategoryPage() {
  const [, params] = useRoute("/category/:slug");
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();
  const { cartItems, addToCart, updateQuantity, removeItem, cartCount } = useCart();

  const categorySlug = params?.slug || '';
  const { categories, products: allProducts } = useProducts();
  const { products: categoryProducts, isLoading } = useProductsByCategory(categorySlug);
  const category = categories.find(c => c.slug === categorySlug);

  const handleAddToCart = (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
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

  const handleUpdateQuantity = (id: string, quantity: number) => {
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

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header 
          cartCount={cartCount}
          onCartClick={() => setCartOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Категория не найдена
            </h1>
            <Link href="/" className="text-primary hover:underline" data-testid="link-home">
              Вернуться на главную
            </Link>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-primary transition-colors" data-testid="breadcrumb-home">
                Главная
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium" data-testid="breadcrumb-category">
                {category.name}
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm" data-testid="text-category-title">
              {category.name}
            </h1>
            <div className="h-1.5 w-32 bg-gradient-to-r from-pink-400 via-primary to-purple-400 rounded-full mt-4 shadow-lg shadow-pink-200" />
          </div>
        </div>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Загрузка товаров...</p>
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg" data-testid="text-no-products">
                  В этой категории пока нет товаров
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-muted-foreground" data-testid="text-product-count">
                    Найдено товаров: <span className="font-semibold text-foreground">{categoryProducts.length}</span>
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      salePrice={product.salePrice}
                      image={product.image}
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
