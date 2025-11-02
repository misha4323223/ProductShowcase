import { docClient, generateId } from "@/lib/yandex-db";
import { PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { StockNotification } from "@/types/firebase-types";
import { sendBulkStockNotifications } from "@/services/postbox-client";

const STOCK_NOTIFICATIONS_TABLE = "stockNotifications";

export async function subscribeToStockNotification(
  productId: string,
  productName: string,
  email: string
): Promise<void> {
  const result = await docClient.send(new ScanCommand({
    TableName: STOCK_NOTIFICATIONS_TABLE,
  }));
  
  const existing = (result.Items || []).find(
    (item: any) => 
      item.productId === productId && 
      item.email.toLowerCase() === email.toLowerCase()
  );
  
  if (existing) {
    throw new Error("Вы уже подписаны на уведомления об этом товаре");
  }
  
  const id = generateId();
  await docClient.send(new PutCommand({
    TableName: STOCK_NOTIFICATIONS_TABLE,
    Item: {
      id,
      productId,
      productName,
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
      notified: false,
    },
  }));
}

export async function getNotificationsByProduct(productId: string): Promise<StockNotification[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: STOCK_NOTIFICATIONS_TABLE,
  }));
  
  const notifications = (result.Items || [])
    .filter((item: any) => item.productId === productId && item.notified === false)
    .map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    }));
  
  return notifications as StockNotification[];
}

export async function getAllNotifications(): Promise<StockNotification[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: STOCK_NOTIFICATIONS_TABLE,
  }));
  
  return (result.Items || []).map((item: any) => ({
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
  })) as StockNotification[];
}

export async function deleteNotification(id: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: STOCK_NOTIFICATIONS_TABLE,
    Key: { id },
  }));
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
