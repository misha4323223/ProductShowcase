import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  saveCartToYDB,
  loadCartFromYDB,
  saveCartToLocalStorage,
  loadCartFromLocalStorage,
  mergeCartsOnLogin,
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
  const [isLoading, setIsLoading] = useState(true);
  const [previousUserId, setPreviousUserId] = useState<string | null>(null);

  // Загрузка корзины при первой загрузке или смене пользователя
  useEffect(() => {
    if (!authLoading) {
      const currentUserId = user?.userId || null;
      
      // Проверяем, изменился ли пользователь
      if (currentUserId !== previousUserId) {
        setIsLoading(true);
        
        if (user) {
          // Пользователь вошел в систему
          console.log('Пользователь авторизован, загружаем и объединяем корзины');
          
          const localCart = loadCartFromLocalStorage();
          const localFirebaseCart: FirebaseCartItem[] = localCart.map(item => ({
            productId: item.id,
            name: item.name,
            image: item.image,
            quantity: item.quantity,
            price: item.price,
          }));

          if (localFirebaseCart.length > 0) {
            // Есть товары в localStorage - объединяем с YDB
            mergeCartsOnLogin(user.userId, localFirebaseCart)
              .then(mergedCart => {
                console.log('Корзины объединены:', mergedCart);
                const uiCart: CartItem[] = mergedCart.map(item => ({
                  id: item.productId,
                  name: item.name,
                  image: item.image,
                  quantity: item.quantity,
                  price: item.price,
                }));
                setCartItems(uiCart);
                localStorage.removeItem('sweet-delights-cart'); // Очищаем localStorage
                setIsLoading(false);
              })
              .catch(err => {
                console.error('Ошибка объединения корзин:', err);
                setCartItems([]);
                setIsLoading(false);
              });
          } else {
            // localStorage пуст - просто загружаем из YDB
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
          }
        } else if (previousUserId !== null) {
          // Пользователь вышел из системы - сохраняем в localStorage
          console.log('Пользователь вышел, сохраняем корзину в localStorage');
          saveCartToLocalStorage(cartItems);
          setCartItems([]);
          setIsLoading(false);
        } else {
          // Первая загрузка без авторизации - загружаем из localStorage
          console.log('Загрузка из localStorage (неавторизован)');
          const localCart = loadCartFromLocalStorage();
          setCartItems(localCart);
          setIsLoading(false);
        }
        
        setPreviousUserId(currentUserId);
      }
    }
  }, [user, authLoading, previousUserId]);

  // Автосохранение корзины при изменениях
  useEffect(() => {
    if (!authLoading && !isLoading) {
      if (user) {
        // Авторизованный пользователь - сохраняем в YDB
        const firebaseCartItems: FirebaseCartItem[] = cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: item.price,
        }));

        console.log('Сохранение корзины в YDB:', firebaseCartItems);

        saveCartToYDB(user.userId, firebaseCartItems).catch(err => {
          console.error('Ошибка сохранения в YDB:', err);
        });
      } else {
        // Неавторизованный пользователь - сохраняем в localStorage
        console.log('Сохранение корзины в localStorage');
        saveCartToLocalStorage(cartItems);
      }
    }
  }, [cartItems, user, authLoading, isLoading]);

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