/**
 * ⚠️ DEPRECATED - НЕ ИСПОЛЬЗУЕТСЯ ⚠️
 * 
 * Этот файл содержит устаревший код для работы с localStorage корзины.
 * Функциональность отключена - корзина работает ТОЛЬКО для авторизованных пользователей через YDB.
 * 
 * Код сохранен на будущее, если понадобится вернуть поддержку корзины для неавторизованных пользователей.
 * 
 * Дата отключения: Ноябрь 2025
 * Причина: Упрощение логики, устранение багов синхронизации, надёжное хранение в базе данных
 */

const CART_STORAGE_KEY = 'sweet-delights-cart';

export interface UICartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface FirebaseCartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

/**
 * DEPRECATED: Сохранение корзины в localStorage
 * Использовалось для неавторизованных пользователей
 */
export function saveCartToLocalStorage(items: UICartItem[]): void {
  console.warn('⚠️ DEPRECATED: saveCartToLocalStorage больше не используется');
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

/**
 * DEPRECATED: Загрузка корзины из localStorage
 * Использовалось для неавторизованных пользователей
 */
export function loadCartFromLocalStorage(): UICartItem[] {
  console.warn('⚠️ DEPRECATED: loadCartFromLocalStorage больше не используется');
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * DEPRECATED: Объединение корзин при входе пользователя
 * Использовалось для слияния localStorage корзины с корзиной в YDB
 */
export async function mergeCartsOnLogin(
  userId: string,
  localCart: FirebaseCartItem[],
  loadCartFromYDB: (userId: string) => Promise<FirebaseCartItem[]>,
  saveCartToYDB: (userId: string, items: FirebaseCartItem[]) => Promise<void>
): Promise<FirebaseCartItem[]> {
  console.warn('⚠️ DEPRECATED: mergeCartsOnLogin больше не используется');
  
  const ydbCart = await loadCartFromYDB(userId);
  
  const merged = [...ydbCart];
  
  for (const localItem of localCart) {
    const existingIndex = merged.findIndex(item => item.productId === localItem.productId);
    if (existingIndex >= 0) {
      merged[existingIndex].quantity += localItem.quantity;
    } else {
      merged.push(localItem);
    }
  }
  
  await saveCartToYDB(userId, merged);
  
  return merged;
}
