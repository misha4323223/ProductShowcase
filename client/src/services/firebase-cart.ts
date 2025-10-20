import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CartItem as FirebaseCartItem } from "@/types/firebase-types";

export interface UICartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const CART_STORAGE_KEY = 'sweet-delights-cart';

export function saveCartToLocalStorage(items: UICartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function loadCartFromLocalStorage(): UICartItem[] {
  const stored = localStorage.getItem(CART_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
}

export async function saveCartToFirebase(userId: string, items: FirebaseCartItem[]): Promise<void> {
  const cartRef = doc(db, "carts", userId);
  await setDoc(cartRef, {
    items,
    updatedAt: new Date(),
  });
}

export async function loadCartFromFirebase(userId: string): Promise<FirebaseCartItem[]> {
  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);
  
  if (cartSnap.exists()) {
    return cartSnap.data().items || [];
  }
  return [];
}

export async function mergeCartsOnLogin(userId: string, localCart: FirebaseCartItem[]): Promise<FirebaseCartItem[]> {
  const firebaseCart = await loadCartFromFirebase(userId);
  
  const merged = [...firebaseCart];
  
  for (const localItem of localCart) {
    const existingIndex = merged.findIndex(item => item.productId === localItem.productId);
    if (existingIndex >= 0) {
      merged[existingIndex].quantity += localItem.quantity;
    } else {
      merged.push(localItem);
    }
  }
  
  await saveCartToFirebase(userId, merged);
  
  return merged;
}
