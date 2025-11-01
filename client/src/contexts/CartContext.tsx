import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  saveCartToYDB,
  loadCartFromYDB
} from '@/services/yandex-cart';
import type { CartItem as FirebaseCartItem } from '@/types/firebase-types';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        console.log('Загрузка корзины из YDB для пользователя:', user.uid);
        setIsLoading(true);

        loadCartFromYDB(user.uid)
          .then(firebaseCart => {
            console.log('Корзина из YDB:', firebaseCart);

            const uiCart: CartItem[] = firebaseCart.map(item => ({
              id: item.productId,
              name: item.name,
              image: item.image,
              quantity: item.quantity,
              price: item.price,
            }));

            console.log('Корзина загружена:', uiCart);
            setCartItems(uiCart);
            setIsLoading(false);
          })
          .catch(err => {
            console.error('Ошибка загрузки из YDB:', err);
            setCartItems([]);
            setIsLoading(false);
          });
      } else {
        console.log('Пользователь не авторизован, корзина пустая');
        setCartItems([]);
        setIsLoading(false);
      }
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user && !isLoading) {
      const firebaseCartItems: FirebaseCartItem[] = cartItems.map(item => ({
        productId: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      }));

      console.log('Сохранение корзины в YDB:', firebaseCartItems);

      saveCartToYDB(user.uid, firebaseCartItems).catch(err => {
        console.error('Ошибка сохранения в YDB:', err);
      });
    }
  }, [cartItems, user, authLoading, isLoading]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    if (!user) {
      console.error('Нельзя добавить товар в корзину без авторизации');
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
    if (!user) return;
    
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item => item.id === id ? { ...item, quantity } : item)
    );
  };

  const removeItem = (id: string) => {
    if (!user) return;
    
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    if (!user) return;
    
    setCartItems([]);
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