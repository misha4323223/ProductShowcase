import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, loading } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    const localCart = loadCartFromLocalStorage();
    console.log('Начальная загрузка из localStorage:', localCart);
    setCartItems(localCart);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!loading && isInitialized) {
      if (user) {
        const sessionKey = `cart-loaded-${user.uid}`;
        const sessionLoaded = sessionStorage.getItem(sessionKey);
        
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
            skipNextSaveRef.current = true;
            setCartItems(uiCart);
            saveCartToLocalStorage(uiCart);
            sessionStorage.setItem(sessionKey, 'true');
          }).catch(err => {
            console.error('Ошибка загрузки корзины из Firebase:', err);
            sessionStorage.setItem(sessionKey, 'true');
          });
        } else {
          console.log('Корзина уже загружена для этого пользователя в этой сессии');
        }
      } else {
        console.log('Пользователь вышел из аккаунта, очистка локальной корзины');
        skipNextSaveRef.current = true;
        setCartItems([]);
        saveCartToLocalStorage([]);
        Object.keys(sessionStorage).forEach(key => {
          if (key.startsWith('cart-loaded-')) {
            sessionStorage.removeItem(key);
          }
        });
      }
    }
  }, [user, loading, isInitialized]);

  useEffect(() => {
    if (isInitialized && user) {
      if (skipNextSaveRef.current) {
        skipNextSaveRef.current = false;
        console.log('Пропуск сохранения в Firebase (загрузка или выход)');
        return;
      }

      console.log('Сохранение корзины:', cartItems);
      saveCartToLocalStorage(cartItems);
      
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
    } else if (isInitialized && !user) {
      saveCartToLocalStorage(cartItems);
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
