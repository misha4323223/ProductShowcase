import type { Order } from "@/types/firebase-types";

const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export async function createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const response = await fetch(`${API_GATEWAY_URL}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData),
  });

  if (!response.ok) {
    throw new Error('Failed to create order');
  }

  const data = await response.json();
  return data.id;
}

export async function getUserOrders(userId: string): Promise<Order[]> {
  const response = await fetch(`${API_GATEWAY_URL}/orders/user/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get user orders');
  }
  
  const data = await response.json();
  return data.map((order: any) => ({
    ...order,
    createdAt: new Date(order.createdAt),
  }));
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update order status');
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/orders/${orderId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete order');
  }
}

export async function hideOrderForUser(orderId: string): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/orders/${orderId}/hide`, {
    method: 'PUT',
  });
  
  if (!response.ok) {
    throw new Error('Failed to hide order');
  }
}

export async function getAllOrders(): Promise<Order[]> {
  console.log('🔍 Запрос всех заказов к:', `${API_GATEWAY_URL}/orders`);
  const response = await fetch(`${API_GATEWAY_URL}/orders`);
  
  console.log('📡 Статус ответа:', response.status, response.statusText);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Ошибка получения заказов:', errorText);
    throw new Error('Failed to get all orders');
  }
  
  const data = await response.json();
  console.log('📦 Сырые данные заказов из API:', data);
  console.log('📊 Количество заказов:', data.length);
  
  return data.map((order: any) => {
    const mappedOrder = {
      ...order,
      createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
      promoCode: order.promoCode ? {
        ...order.promoCode,
        startDate: order.promoCode.startDate ? new Date(order.promoCode.startDate) : undefined,
        endDate: order.promoCode.endDate ? new Date(order.promoCode.endDate) : undefined,
      } : undefined,
    };
    console.log('✅ Обработанный заказ:', mappedOrder.id, mappedOrder.createdAt);
    return mappedOrder;
  });
}