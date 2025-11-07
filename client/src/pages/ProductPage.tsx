import { useState, useEffect, useMemo } from "react";
import { useRoute, useLocation, Link } from "wouter";
import Header from "@/components/Header";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEO, { createProductSchema, createBreadcrumbSchema } from "@/components/SEO";
import ReviewsList from "@/components/ReviewsList";
import AddReviewForm from "@/components/AddReviewForm";
import StarRating from "@/components/StarRating";
import { useProducts, useProduct } from "@/hooks/use-products";
import { useReviews } from "@/hooks/use-reviews";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart as ShoppingCartIcon, ChevronRight, Minus, Plus, Heart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function ProductPage() {
  const [, params] = useRoute("/product/:id");
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const productId = params?.id || '';
  const { product, isLoading } = useProduct(productId);
  const { products, categories } = useProducts();
  const { reviews, rating: productRating, refetch: refetchReviews } = useReviews(productId);
  const rating = typeof productRating === 'object' ? productRating : { averageRating: 0, totalReviews: 0 };
  const category = product ? categories.find(c => c.id === product.category) : null;

  const handleAddToCart = () => {
    if (!product) return;

    setCartItems(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        toast({
          title: "Количество обновлено",
          description: `${product.name} - теперь ${existing.quantity + quantity} шт.`,
        });
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast({
        title: "Добавлено в корзину",
        description: `${product.name} - ${quantity} шт.`,
      });
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.salePrice || product.price,
        quantity: quantity,
        image: product.image,
      }];
    });
    setQuantity(1);
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

  const handleToggleWishlist = async () => {
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт чтобы добавлять товары в избранное",
        variant: "destructive",
      });
      return;
    }

    if (!product) return;

    try {
      await toggleWishlist(productId);
      const inWishlist = isInWishlist(productId);
      toast({
        title: inWishlist ? "Добавлено в избранное" : "Удалено из избранного",
        description: inWishlist ? `${product.name} добавлен` : `${product.name} удалён`,
      });
    } catch (error) {
      console.error("Ошибка wishlist:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header 
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onCartClick={() => setCartOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">Загрузка...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header 
          cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          onCartClick={() => setCartOpen(true)}
        />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Товар не найден
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

  const hasDiscount = product.salePrice && product.salePrice < product.price;
  const discount = hasDiscount && product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : 0;
  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const breadcrumbItems = useMemo(() => [
    ...(category ? [{ name: category.name, url: `/category/${category.slug}` }] : []),
    { name: product.name, url: `/product/${product.id}` }
  ], [category?.name, category?.slug, product.name, product.id]);

  const productSchema = useMemo(() => createProductSchema({
    name: product.name,
    description: product.description || `${product.name} - купить в интернет-магазине Sweet Delights`,
    image: product.image || '/default-product.jpg',
    price: product.salePrice || product.price,
    currency: 'RUB',
    availability: product.stock && product.stock > 0 ? 'instock' : 'outofstock',
    rating: rating.averageRating > 0 ? rating.averageRating : undefined,
    reviewCount: rating.totalReviews > 0 ? rating.totalReviews : undefined,
    brand: 'Sweet Delights',
    sku: product.id,
  }), [product.name, product.description, product.image, product.salePrice, product.price, product.stock, product.id, rating.averageRating, rating.totalReviews]);

  const breadcrumbSchema = useMemo(() => createBreadcrumbSchema([
    { name: 'Главная', url: 'https://sweetdelights.store' },
    ...breadcrumbItems.map(item => ({
      name: item.name,
      url: `https://sweetdelights.store${item.url}`
    }))
  ]), [breadcrumbItems]);

  const structuredData = useMemo(() => [productSchema, breadcrumbSchema], [productSchema, breadcrumbSchema]);

  return (
    <div className="min-h-screen flex flex-col candy-pattern">
      <SEO
        title={`${product.name} - купить в Sweet Delights | Цена ${product.salePrice || product.price}₽`}
        description={product.description || `Купить ${product.name} в интернет-магазине Sweet Delights. ${hasDiscount ? `Скидка ${discount}%! ` : ''}Цена ${product.salePrice || product.price}₽. Быстрая доставка по России.`}
        keywords={`${product.name}, купить ${product.name}, ${category?.name || 'сладости'}, Sweet Delights`}
        image={product.image}
        type="product"
        price={product.salePrice || product.price}
        currency="RUB"
        availability={product.stock && product.stock > 0 ? 'instock' : 'outofstock'}
        structuredData={structuredData}
      />
      <Header 
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
      />
      
      <main className="flex-1 relative z-10 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Breadcrumbs items={breadcrumbItems} />

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 shadow-2xl candy-wrapper sugar-crystals" data-testid="product-image-container">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <ShoppingCartIcon className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Фото товара</p>
                  </div>
                </div>
              )}
              {hasDiscount && (
                <div className="absolute top-6 right-6 w-20 h-20 lollipop-swirl-badge rounded-full flex items-center justify-center shadow-2xl shadow-red-500/50 animate-rotate-slow border-4 border-white" data-testid="badge-discount">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
                  <span className="relative z-10 text-white font-bold text-lg drop-shadow-lg">-{discount}%</span>
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="mb-6">
                {category && (
                  <Link href={`/category/${category.slug}`} data-testid="link-category">
                    <Badge className="mb-3 hover-elevate cursor-pointer" variant="secondary">
                      {category.name}
                    </Badge>
                  </Link>
                )}
                <h1 className="font-serif text-3xl md:text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600" data-testid="text-product-name">
                  {product.name}
                </h1>
                <div className="h-1 w-24 bg-gradient-to-r from-pink-400 via-primary to-purple-400 rounded-full mb-6 shadow-lg shadow-pink-200" />
              </div>

              <div className="mb-6">
                <p className="text-muted-foreground leading-relaxed" data-testid="text-product-description">
                  {product.description}
                </p>
              </div>

              {rating.totalReviews > 0 && (
                <div className="mb-6 flex items-center gap-3">
                  <StarRating rating={rating.averageRating} size="md" dataTestIdPrefix="product-rating" />
                  <span className="text-sm font-medium">
                    {rating.averageRating.toFixed(1)} ({rating.totalReviews} {rating.totalReviews === 1 ? 'отзыв' : rating.totalReviews < 5 ? 'отзыва' : 'отзывов'})
                  </span>
                </div>
              )}

              <Card className="p-6 mb-6 bg-gradient-to-br from-pink-50/50 to-purple-50/50 border-2 border-pink-100">
                <div className="flex items-baseline gap-3 mb-6">
                  {hasDiscount ? (
                    <>
                      <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-primary" data-testid="text-sale-price">
                        {product.salePrice} ₽
                      </span>
                      <span className="text-xl text-muted-foreground line-through" data-testid="text-original-price">
                        {product.price} ₽
                      </span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-primary" data-testid="text-price">
                      {product.price} ₽
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-medium text-muted-foreground">Количество:</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="rounded-full gummy-button"
                      data-testid="button-decrease-quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg" data-testid="text-quantity">
                      {quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setQuantity(quantity + 1)}
                      className="rounded-full gummy-button"
                      data-testid="button-increase-quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 rounded-full gummy-button squish-active bg-gradient-to-r from-primary via-pink-500 to-accent hover:from-pink-600 hover:via-primary hover:to-purple-500 text-white font-semibold py-6 text-lg" 
                    onClick={handleAddToCart}
                    data-testid="button-add-to-cart"
                  >
                    <ShoppingCartIcon className="h-5 w-5 mr-2" />
                    Добавить в корзину
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className={`rounded-full gummy-button squish-active min-h-[56px] min-w-[56px] ${
                      isInWishlist(productId)
                        ? 'bg-pink-500 hover:bg-pink-600 text-white border-pink-500'
                        : 'bg-white hover:bg-pink-50 text-pink-500 border-pink-200'
                    }`}
                    onClick={handleToggleWishlist}
                    data-testid="button-wishlist"
                  >
                    <Heart className={`h-6 w-6 ${isInWishlist(productId) ? 'fill-current' : ''}`} />
                  </Button>
                </div>
              </Card>
            </div>
          </div>

          <section className="py-12 border-t">
            <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600">
              Отзывы и рейтинг
            </h2>
            
            <Tabs defaultValue="reviews" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="reviews" data-testid="tab-reviews">
                  Все отзывы ({rating.totalReviews})
                </TabsTrigger>
                <TabsTrigger value="add-review" data-testid="tab-add-review">
                  Написать отзыв
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reviews">
                <ReviewsList 
                  reviews={reviews}
                  averageRating={rating.averageRating}
                  totalReviews={rating.totalReviews}
                />
              </TabsContent>

              <TabsContent value="add-review">
                <AddReviewForm 
                  productId={productId}
                  onReviewAdded={() => {
                    refetchReviews();
                  }}
                />
              </TabsContent>
            </Tabs>
          </section>

          {relatedProducts.length > 0 && (
            <section className="py-12 border-t">
              <h2 className="font-serif text-2xl md:text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600" data-testid="text-related-title">
                Похожие товары
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <Card 
                    key={relatedProduct.id}
                    className="group overflow-visible cursor-pointer rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-pink-200/50 candy-wrapper jelly-wobble border-2 border-pink-100"
                    onClick={() => setLocation(`/product/${relatedProduct.id}`)}
                    data-testid={`card-related-${relatedProduct.id}`}
                  >
                    <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 rounded-t-3xl sugar-crystals">
                      {relatedProduct.image ? (
                        <img
                          src={relatedProduct.image}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ShoppingCartIcon className="h-12 w-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2" data-testid={`text-related-name-${relatedProduct.id}`}>
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        {relatedProduct.salePrice ? (
                          <>
                            <span className="font-bold text-primary">
                              {relatedProduct.salePrice} ₽
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {relatedProduct.price} ₽
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-primary">
                            {relatedProduct.price} ₽
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
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
