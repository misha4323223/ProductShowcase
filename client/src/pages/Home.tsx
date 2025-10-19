import { useState } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import BenefitsBar from "@/components/BenefitsBar";
import CategoryCard from "@/components/CategoryCard";
import ProductCard from "@/components/ProductCard";
import ShoppingCart from "@/components/ShoppingCart";
import Footer from "@/components/Footer";
import { products } from "@/lib/products";
import { useToast } from "@/hooks/use-toast";

import heroImage1 from '@assets/generated_images/Colorful_macarons_hero_image_11795c3a.png';
import heroImage2 from '@assets/generated_images/Chocolate_gift_box_image_b558d06a.png';
import heroImage3 from '@assets/generated_images/Candy_store_display_image_21d1d54f.png';
import chocolateImage from '@assets/generated_images/Artisanal_chocolate_category_image_35f087de.png';
import candiesImage from '@assets/generated_images/Assorted_candies_category_image_ce151d27.png';
import accessoriesImage from '@assets/generated_images/Sweet_accessories_category_image_fb7f7e3a.png';
import cookiesImage from '@assets/generated_images/Cookies_and_biscuits_image_6375c6a9.png';
import saleImage from '@assets/generated_images/Sale_promotion_banner_image_d14d30e1.png';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const slides = [
    {
      id: 1,
      image: heroImage1,
      title: 'Французские Макаронс',
      subtitle: 'Изысканные пирожные ручной работы',
      buttonText: 'Заказать сейчас',
    },
    {
      id: 2,
      image: heroImage2,
      title: 'Премиум Шоколад',
      subtitle: 'Бельгийское качество в каждом кусочке',
      buttonText: 'Смотреть каталог',
    },
    {
      id: 3,
      image: heroImage3,
      title: 'Яркие Сладости',
      subtitle: 'Радуга вкусов для всей семьи',
      buttonText: 'Выбрать подарок',
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
    toast({
      title: "Оформление заказа",
      description: "Эта функция будет доступна в полной версии приложения",
    });
  };

  return (
    <div className="min-h-screen flex flex-col relative candy-pattern">
      <Header 
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
        onCartClick={() => setCartOpen(true)}
      />
      
      <main className="flex-1 relative z-10">
        <HeroSlider slides={slides} />
        <BenefitsBar />
        
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
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
