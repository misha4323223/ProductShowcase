
const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';
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

export function saveCartToLocalStorage(items: UICartItem[]): void {
  console.log('Сохранение в localStorage:', items);
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function loadCartFromLocalStorage(): UICartItem[] {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  console.log('Загрузка из localStorage (raw):', stored);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      console.log('Загрузка из localStorage (parsed):', parsed);
      return parsed;
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveCartToYDB(userId: string, items: FirebaseCartItem[]): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, items }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save cart');
  }
}

export async function loadCartFromYDB(userId: string): Promise<FirebaseCartItem[]> {
  const response = await fetch(`${API_GATEWAY_URL}/cart/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to load cart');
  }
  
  const data = await response.json();
  return data.items || [];
}

export async function mergeCartsOnLogin(userId: string, localCart: FirebaseCartItem[]): Promise<FirebaseCartItem[]> {
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
