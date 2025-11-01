import { collection, doc, setDoc, deleteDoc, getDocs, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { WishlistItem } from "@/types/firebase-types";

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  const wishlistRef = doc(db, "wishlists", userId, "items", productId);
  await setDoc(wishlistRef, {
    productId,
    addedAt: Timestamp.now(),
  });
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  const wishlistRef = doc(db, "wishlists", userId, "items", productId);
  await deleteDoc(wishlistRef);
}

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const wishlistCol = collection(db, "wishlists", userId, "items");
  const snapshot = await getDocs(wishlistCol);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      productId: data.productId,
      addedAt: data.addedAt.toDate(),
    } as WishlistItem;
  });
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const wishlistItems = await getWishlist(userId);
  return wishlistItems.some(item => item.productId === productId);
}
