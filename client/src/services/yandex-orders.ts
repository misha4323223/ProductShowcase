import { docClient, generateId } from "@/lib/yandex-db";
import { PutCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { Order } from "@/types/firebase-types";

const ORDERS_TABLE = "orders";

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const id = generateId();
  const order = {
    ...orderData,
    id,
    createdAt: new Date().toISOString(),
  };
  
  await docClient.send(new PutCommand({
    TableName: ORDERS_TABLE,
    Item: order,
  }));
  
  return id;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: ORDERS_TABLE,
  }));
  
  const orders = (result.Items || []) as Order[];
  
  return orders
    .filter(order => order.userId === userId && !order.hiddenByUser)
    .map(order => ({
      ...order,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: ORDERS_TABLE,
    Key: { id: orderId },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: {
      '#status': 'status',
    },
    ExpressionAttributeValues: {
      ':status': status,
    },
  }));
}

export async function deleteOrder(orderId: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: ORDERS_TABLE,
    Key: { id: orderId },
  }));
}

export async function hideOrderForUser(orderId: string): Promise<void> {
  await docClient.send(new UpdateCommand({
    TableName: ORDERS_TABLE,
    Key: { id: orderId },
    UpdateExpression: 'SET hiddenByUser = :hidden',
    ExpressionAttributeValues: {
      ':hidden': true,
    },
  }));
}

export async function getAllOrders(): Promise<Order[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: ORDERS_TABLE,
  }));
  
  return (result.Items || [])
    .map(order => ({
      ...order,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) as Order[];
}
