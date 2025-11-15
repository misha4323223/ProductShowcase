import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  saveCartToYDB,
  loadCartFromYDB,
  type FirebaseCartItem
} from '@/services/yandex-cart';

export interface UICartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export type CartItem = UICartItem;

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  cartCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  // Загрузка корзины только для авторизованных пользователей
  useEffect(() => {
    if (!authLoading) {
      const currentUserId = user?.userId || null;
      
      // Проверяем смену пользователя ИЛИ первую загрузку
      const userChanged = currentUserId !== previousUserId;
      const isFirstLoad = previousUserId === null && currentUserId === null;
      
      if (userChanged || isFirstLoad) {
        setIsLoading(true);
        
        if (user) {
          // Пользователь авторизован - загружаем из YDB
          console.log('Загрузка корзины из YDB для пользователя:', user.userId);
          loadCartFromYDB(user.userId)
            .then(firebaseCart => {
              console.log('Корзина из YDB:', firebaseCart);
              const uiCart: CartItem[] = firebaseCart.map(item => ({
                id: item.productId,
                name: item.name,
                image: item.image,
                quantity: item.quantity,
                price: item.price,
              }));
              setCartItems(uiCart);
              setIsLoading(false);
            })
            .catch(err => {
              console.error('Ошибка загрузки из YDB:', err);
              setCartItems([]);
              setIsLoading(false);
            });
        } else {
          // Пользователь не авторизован - пустая корзина
          console.log('Пользователь не авторизован - корзина пуста');
          setCartItems([]);
          setIsLoading(false);
        }
        
        setPreviousUserId(currentUserId);
      }
    }
  }, [user, authLoading, previousUserId]);

  // Автосохранение корзины в YDB для авторизованных пользователей
  useEffect(() => {
    if (!authLoading && !isLoading && user) {
      const firebaseCartItems: FirebaseCartItem[] = cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      }));

      console.log('Сохранение корзины в YDB:', firebaseCartItems);

      saveCartToYDB(user.userId, firebaseCartItems)
        .then(() => {
          console.log('✅ Корзина успешно сохранена в YDB');
        })
        .catch(err => {
          console.warn('⚠️ Не удалось сохранить корзину в YDB (это не критично):', err);
        });
    }
  }, [cartItems, user, authLoading, isLoading]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    // Проверяем авторизацию
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт, чтобы добавлять товары в корзину",
        variant: "destructive",
      });
      return;
    }

    const quantity = item.quantity || 1;
    console.log('Добавление товара в корзину:', item);
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      let newCart: CartItem[];
      if (existing) {
        newCart = prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      } else {
        newCart = [...prev, { ...item, quantity }];
      }
      console.log('Новая корзина после добавления:', newCart);
      return newCart;
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    console.log('🗑️ Очистка корзины (локально + YDB)');
    setCartItems([]);
    
    // Также очищаем корзину в YDB для авторизованных пользователей
    if (user) {
      saveCartToYDB(user.userId, [])
        .then(() => {
          console.log('✅ Корзина успешно очищена в YDB');
        })
        .catch(err => {
          console.warn('⚠️ Не удалось очистить корзину в YDB:', err);
        });
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      updateQuantity, 
      removeItem, 
      clearCart,
      cartCount,
      isLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
