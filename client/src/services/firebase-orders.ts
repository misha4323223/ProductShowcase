import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Order } from "@/types/firebase-types";

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const ordersCol = collection(db, "orders");
  const docRef = await addDoc(ordersCol, {
    ...orderData,
    createdAt: new Date(),
  });
  return docRef.id;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  try {
    const ordersCol = collection(db, "orders");
    const q = query(
      ordersCol, 
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ 
      id: doc.id, 
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() 
    } as Order));
  } catch (error: any) {
    if (error.code === 'failed-precondition' || error.code === 'permission-denied') {
      console.warn('Firestore index required or permission denied, fetching without orderBy');
      const ordersCol = collection(db, "orders");
      const q = query(ordersCol, where("userId", "==", userId));
      const snapshot = await getDocs(q);
      const orders = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() 
      } as Order));
      return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    throw error;
  }
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const orderRef = doc(db, "orders", orderId);
  await updateDoc(orderRef, { status });
}
