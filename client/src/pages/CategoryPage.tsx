import { useState, useMemo, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEO from "@/components/SEO";
import { createBreadcrumbSchema } from "@/lib/seo-helpers";
import { useProducts, useProductsByCategory } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { Link } from "wouter";

export default function CategoryPage() {
  const [, params] = useRoute("/category/:slug");
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();
  const { cartItems, addToCart, updateQuantity, removeItem, cartCount } = useCart();
  const { wishlistCount } = useWishlist();

  const categorySlug = params?.slug || '';
  const { categories, products: allProducts } = useProducts();
  const { products: categoryProducts, isLoading } = useProductsByCategory(categorySlug);
  const category = categories.find(c => c.slug === categorySlug);

  const [sortBy, setSortBy] = useState('default');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [saleOnly, setSaleOnly] = useState(false);

  const maxPrice = useMemo(() => {
    if (categoryProducts.length === 0) return 10000;
    return Math.max(...categoryProducts.map(p => p.price));
  }, [categoryProducts]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...categoryProducts];

    filtered = filtered.filter(p => {
      const price = p.salePrice || p.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (saleOnly) {
      filtered = filtered.filter(p => p.salePrice !== undefined && p.salePrice !== null);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return (a.salePrice || a.price) - (b.salePrice || b.price);
        case 'price-desc':
          return (b.salePrice || b.price) - (a.salePrice || a.price);
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [categoryProducts, sortBy, priceRange, saleOnly]);

  const handleAddToCart = (productId: string) => {
    const product = allProducts.find(p => p.id === productId);
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
    const product = allProducts.find(p => p.id === id);
    
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

  // Move hooks before conditional returns
  const breadcrumbItems = useMemo(() => 
    category ? [{ name: category.name, url: `/category/${category.slug}` }] : [],
    [category?.name, category?.slug]
  );

  const breadcrumbSchema = useMemo(() => 
    category ? createBreadcrumbSchema([
      { name: 'Главная', url: 'https://sweetdelights.store' },
      { name: category.name, url: `https://sweetdelights.store/category/${category.slug}` }
    ]) : null,
    [category?.name, category?.slug]
  );

  if (!category) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header 
          cartCount={cartCount}
          wishlistCount={wishlistCount}
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
      <SEO
        title={`${category.name} - купить в интернет-магазине Sweet Delights`}
        description={`Широкий выбор ${category.name.toLowerCase()} в интернет-магазине Sweet Delights. ${categoryProducts.length} товаров с быстрой доставкой по России. Скидки и акции!`}
        keywords={`${category.name}, купить ${category.name.toLowerCase()}, интернет-магазин сладостей, Sweet Delights`}
        image={category.image || '/default-category.jpg'}
        type="website"
        structuredData={breadcrumbSchema || undefined}
      />
      <Header 
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCartClick={() => setCartOpen(true)}
      />
      
      <main className="flex-1 relative z-10">
        <div className="bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 py-12 candy-stripe">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <Breadcrumbs items={breadcrumbItems} />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600 drop-shadow-sm mt-4" data-testid="text-category-title">
              {category.name}
            </h1>
            <div className="h-1.5 w-32 bg-gradient-to-r from-pink-400 via-primary to-purple-400 rounded-full mt-4 shadow-lg shadow-pink-200" />
          </div>
        </div>

        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-primary to-purple-500 animate-pulse">
                  Достаём вкусняшки... 🍪
                </p>
              </div>
            ) : categoryProducts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg" data-testid="text-no-products">
                  В этой категории пока нет товаров
                </p>
              </div>
            ) : (
              <>
                <ProductFilters
                  onSortChange={setSortBy}
                  onPriceRangeChange={(min, max) => setPriceRange([min, max])}
                  onSaleOnlyChange={setSaleOnly}
                  maxPrice={maxPrice}
                  currentSort={sortBy}
                  currentPriceRange={priceRange}
                  saleOnly={saleOnly}
                  totalProducts={categoryProducts.length}
                  filteredCount={filteredAndSortedProducts.length}
                />

                {filteredAndSortedProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg" data-testid="text-no-filtered-products">
                      Нет товаров, соответствующих выбранным фильтрам
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mt-8">
                    {filteredAndSortedProducts.map((product) => (
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
