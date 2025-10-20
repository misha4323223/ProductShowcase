import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  saveCartToLocalStorage, 
  loadCartFromLocalStorage,
  saveCartToFirebase,
  loadCartFromFirebase,
  mergeCartsOnLogin 
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
  const [hasLoadedFromFirebase, setHasLoadedFromFirebase] = useState(false);

  useEffect(() => {
    const localCart = loadCartFromLocalStorage();
    setCartItems(localCart);
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!loading && isInitialized && user && !hasLoadedFromFirebase) {
      const localCart = loadCartFromLocalStorage();
      const firebaseCartItems: FirebaseCartItem[] = localCart.map(item => ({
        productId: item.id,
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      }));
      
      mergeCartsOnLogin(user.uid, firebaseCartItems).then(merged => {
        const mergedUICart: CartItem[] = merged.map(item => ({
          id: item.productId,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        }));
        setCartItems(mergedUICart);
        saveCartToLocalStorage(mergedUICart);
        setHasLoadedFromFirebase(true);
      }).catch(err => {
        console.error('Failed to merge carts:', err);
        setHasLoadedFromFirebase(true);
      });
    } else if (!loading && !user) {
      setHasLoadedFromFirebase(false);
    }
  }, [user, loading, isInitialized, hasLoadedFromFirebase]);

  useEffect(() => {
    if (isInitialized && hasLoadedFromFirebase) {
      saveCartToLocalStorage(cartItems);
      
      if (user) {
        const firebaseCartItems: FirebaseCartItem[] = cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        }));
        
        saveCartToFirebase(user.uid, firebaseCartItems).catch(err => {
          console.error('Failed to save cart to Firebase:', err);
        });
      }
    }
  }, [cartItems, user, isInitialized, hasLoadedFromFirebase]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const quantity = item.quantity || 1;
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
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
