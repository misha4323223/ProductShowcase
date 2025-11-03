import type { StockNotification } from "@/types/firebase-types";
import { sendBulkStockNotifications } from "@/services/postbox-client";

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

export async function subscribeToStockNotification(
  productId: string,
  productName: string,
  email: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/create-stock-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ productId, productName, email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Не удалось подписаться' }));
    throw new Error(errorData.error || 'Не удалось подписаться на уведомления');
  }

  return response.json();
}

export async function getNotificationsByProduct(productId: string): Promise<StockNotification[]> {
  const allNotifications = await getAllNotifications();
  
  return allNotifications.filter(
    (item) => item.productId === productId && item.notified === false
  );
}

export async function getAllNotifications(): Promise<StockNotification[]> {
  const response = await fetch(`${API_BASE_URL}/get-stock-notifications`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Не удалось загрузить уведомления');
  }

  const data = await response.json();
  
  return data.map((item: any) => ({
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
  })) as StockNotification[];
}

export async function deleteNotification(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/delete-stock-notification/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Не удалось удалить уведомление' }));
    throw new Error(errorData.error || 'Не удалось удалить уведомление');
  }
}

export async function sendStockNotifications(
  productId: string,
  productName: string,
  productUrl: string
): Promise<number> {
  try {
    const notifications = await getNotificationsByProduct(productId);
    
    if (notifications.length === 0) {
      return 0;
    }
    
    const emails = notifications.map(n => n.email);
    const sentCount = await sendBulkStockNotifications(emails, productName, productUrl);
    
    for (const notification of notifications) {
      await deleteNotification(notification.id);
    }
    
    return sentCount;
  } catch (error) {
    console.error("Ошибка отправки уведомлений:", error);
    throw error;
  }
}
