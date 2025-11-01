import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { PromoCode } from "@/types/firebase-types";

export async function getPromoCodeUsageCount(promoCodeOrId: string): Promise<number> {
  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("promoCode.code", "==", promoCodeOrId.toUpperCase()));
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const snapshot = await getDocs(collection(db, "promocodes"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    startDate: doc.data().startDate?.toDate(),
    endDate: doc.data().endDate?.toDate(),
  } as PromoCode));
}

export async function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
  const q = query(collection(db, "promocodes"), where("code", "==", code.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
    startDate: doc.data().startDate?.toDate(),
    endDate: doc.data().endDate?.toDate(),
  } as PromoCode;
}

export interface PromoCodeValidationResult {
  valid: boolean;
  message?: string;
  promoCode?: PromoCode;
  discountAmount?: number;
}

export async function validatePromoCode(
  code: string, 
  orderTotal: number
): Promise<PromoCodeValidationResult> {
  const promoCode = await getPromoCodeByCode(code);
  
  if (!promoCode) {
    return { valid: false, message: "Промокод не найден" };
  }
  
  if (!promoCode.active) {
    return { valid: false, message: "Промокод неактивен" };
  }
  
  const now = new Date();
  
  if (promoCode.startDate && now < promoCode.startDate) {
    return { valid: false, message: "Промокод еще не действует" };
  }
  
  if (promoCode.endDate && now > promoCode.endDate) {
    return { valid: false, message: "Промокод истек" };
  }
  
  if (promoCode.maxUses) {
    const currentUses = await getPromoCodeUsageCount(promoCode.code);
    if (currentUses >= promoCode.maxUses) {
      return { valid: false, message: "Промокод исчерпан" };
    }
  }
  
  if (promoCode.minOrderAmount && orderTotal < promoCode.minOrderAmount) {
    return { 
      valid: false, 
      message: `Минимальная сумма заказа для этого промокода: ${promoCode.minOrderAmount}₽` 
    };
  }
  
  let discountAmount = 0;
  if (promoCode.discountType === 'percentage') {
    if (promoCode.discountValue >= 100) {
      return { valid: false, message: "Некорректная скидка" };
    }
    discountAmount = Math.round(orderTotal * (promoCode.discountValue / 100));
  } else {
    if (promoCode.discountValue >= orderTotal) {
      return { valid: false, message: "Скидка не может превышать сумму заказа" };
    }
    discountAmount = promoCode.discountValue;
  }
  
  discountAmount = Math.min(discountAmount, Math.floor(orderTotal * 0.99));
  
  return { 
    valid: true, 
    promoCode,
    discountAmount
  };
}


export async function createPromoCode(promoCode: Omit<PromoCode, 'id' | 'createdAt'>): Promise<string> {
  const docRef = doc(collection(db, "promocodes"));
  const data = {
    ...promoCode,
    code: promoCode.code.toUpperCase(),
    createdAt: new Date(),
  };
  await setDoc(docRef, data);
  return docRef.id;
}

export async function updatePromoCode(id: string, updates: Partial<Omit<PromoCode, 'id' | 'createdAt'>>): Promise<void> {
  const docRef = doc(db, "promocodes", id);
  const data = { ...updates };
  if (data.code) {
    data.code = data.code.toUpperCase();
  }
  await updateDoc(docRef, data);
}

export async function deletePromoCode(id: string): Promise<void> {
  await deleteDoc(doc(db, "promocodes", id));
}
