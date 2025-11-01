import { docClient } from "@/lib/yandex-db";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import type { CartItem as FirebaseCartItem } from "@/types/firebase-types";

export interface UICartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const CART_STORAGE_KEY = 'sweet-delights-cart';
const CARTS_TABLE = "carts";

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
  await docClient.send(new PutCommand({
    TableName: CARTS_TABLE,
    Item: {
      id: userId,
      items,
      updatedAt: new Date().toISOString(),
    },
  }));
}

export async function loadCartFromYDB(userId: string): Promise<FirebaseCartItem[]> {
  const result = await docClient.send(new GetCommand({
    TableName: CARTS_TABLE,
    Key: { id: userId },
  }));
  
  if (result.Item) {
    return result.Item.items || [];
  }
  return [];
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
