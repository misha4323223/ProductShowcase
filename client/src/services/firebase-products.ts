import { collection, getDocs, doc, getDoc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, Category } from "@/types/firebase-types";

export async function getAllProducts(): Promise<Product[]> {
  const productsCol = collection(db, "products");
  const snapshot = await getDocs(productsCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }
  return null;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const productsCol = collection(db, "products");
  let q;
  
  if (categorySlug === 'sale') {
    q = query(productsCol, where("salePrice", "!=", null));
  } else {
    q = query(productsCol, where("category", "==", categorySlug));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const productsCol = collection(db, "products");
  const q = query(productsCol, where("featured", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getProductsSorted(sortBy: 'price-asc' | 'price-desc' | 'popularity' | 'newest'): Promise<Product[]> {
  const productsCol = collection(db, "products");
  let q;
  
  switch (sortBy) {
    case 'price-asc':
      q = query(productsCol, orderBy("price", "asc"));
      break;
    case 'price-desc':
      q = query(productsCol, orderBy("price", "desc"));
      break;
    case 'popularity':
      q = query(productsCol, orderBy("popularity", "desc"));
      break;
    case 'newest':
      q = query(productsCol, orderBy("createdAt", "desc"));
      break;
    default:
      q = productsCol;
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getAllCategories(): Promise<Category[]> {
  const categoriesCol = collection(db, "categories");
  const snapshot = await getDocs(categoriesCol);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
}
