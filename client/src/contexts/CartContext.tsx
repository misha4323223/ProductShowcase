import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  saveCartToLocalStorage, 
  loadCartFromLocalStorage,
  saveCartToFirebase,
  loadCartFromFirebase
} from '@/services/firebase-cart';
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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SESSION_KEY = 'cart-session-loaded';

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, loading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const localCart = loadCartFromLocalStorage();
    console.log('Начальная загрузка из localStorage:', localCart);
    setCartItems(localCart);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!loading && isInitialized && user) {
      const sessionLoaded = sessionStorage.getItem(SESSION_KEY);
      
      if (!sessionLoaded) {
        console.log('Загрузка корзины из Firebase для пользователя:', user.uid);
        
        loadCartFromFirebase(user.uid).then(firebaseCart => {
          console.log('Корзина из Firebase:', firebaseCart);
          
          const uiCart: CartItem[] = firebaseCart.map(item => ({
            id: item.productId,
            name: item.name,
            image: item.image,
            quantity: item.quantity,
            price: item.price,
          }));
          
          console.log('Установка корзины из Firebase:', uiCart);
          setCartItems(uiCart);
          saveCartToLocalStorage(uiCart);
          sessionStorage.setItem(SESSION_KEY, 'true');
        }).catch(err => {
          console.error('Ошибка загрузки корзины из Firebase:', err);
          sessionStorage.setItem(SESSION_KEY, 'true');
        });
      }
    } else if (!loading && !user) {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user, loading, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      console.log('Сохранение корзины:', cartItems);
      saveCartToLocalStorage(cartItems);
      
      if (user) {
        const firebaseCartItems: FirebaseCartItem[] = cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        }));
        
        console.log('Сохранение корзины в Firebase:', firebaseCartItems);
        
        saveCartToFirebase(user.uid, firebaseCartItems).catch(err => {
          console.error('Ошибка сохранения в Firebase:', err);
        });
      }
    }
  }, [cartItems, user, isInitialized]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
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
      cartCount 
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
