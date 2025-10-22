import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { StockNotification } from "@/types/firebase-types";

export async function subscribeToStockNotification(
  productId: string,
  productName: string,
  email: string
): Promise<void> {
  const notificationsRef = collection(db, "stockNotifications");
  const q = query(
    notificationsRef,
    where("productId", "==", productId),
    where("email", "==", email.toLowerCase())
  );
  
  const existing = await getDocs(q);
  if (!existing.empty) {
    throw new Error("Вы уже подписаны на уведомления об этом товаре");
  }
  
  const docRef = doc(notificationsRef);
  await setDoc(docRef, {
    productId,
    productName,
    email: email.toLowerCase(),
    createdAt: new Date(),
    notified: false,
  });
}

export async function getNotificationsByProduct(productId: string): Promise<StockNotification[]> {
  const notificationsRef = collection(db, "stockNotifications");
  const q = query(
    notificationsRef,
    where("productId", "==", productId),
    where("notified", "==", false)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  } as StockNotification));
}

export async function getAllNotifications(): Promise<StockNotification[]> {
  const snapshot = await getDocs(collection(db, "stockNotifications"));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate() || new Date(),
  } as StockNotification));
}

export async function deleteNotification(id: string): Promise<void> {
  await deleteDoc(doc(db, "stockNotifications", id));
}

export async function sendStockNotifications(
  productId: string,
  productName: string,
  productUrl: string
): Promise<number> {
  const notifications = await getNotificationsByProduct(productId);
  
  if (notifications.length === 0) {
    return 0;
  }
  
  const emails = notifications.map(n => n.email);
  
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Требуется авторизация");
    }
    
    const idToken = await user.getIdToken();
    
    const response = await fetch("/api/send-stock-notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        productId,
        productName,
        productUrl,
        emails,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Ошибка отправки уведомлений");
    }
    
    const { sentCount } = await response.json();
    
    for (const notification of notifications) {
      await deleteNotification(notification.id);
    }
    
    return sentCount;
  } catch (error) {
    console.error("Ошибка отправки уведомлений:", error);
    return 0;
  }
}
