import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CartItem } from "@/types/firebase-types";

const CART_STORAGE_KEY = 'sweet-delights-cart';

export function saveCartToLocalStorage(items: CartItem[]): void {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function loadCartFromLocalStorage(): CartItem[] {
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

export async function saveCartToFirebase(userId: string, items: CartItem[]): Promise<void> {
  const cartRef = doc(db, "carts", userId);
  await setDoc(cartRef, {
    items,
    updatedAt: new Date(),
  });
}

export async function loadCartFromFirebase(userId: string): Promise<CartItem[]> {
  const cartRef = doc(db, "carts", userId);
  const cartSnap = await getDoc(cartRef);
  
  if (cartSnap.exists()) {
    return cartSnap.data().items || [];
  }
  return [];
}

export async function mergeCartsOnLogin(userId: string, localCart: CartItem[]): Promise<CartItem[]> {
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
  saveCartToLocalStorage(merged);
  
  return merged;
}
