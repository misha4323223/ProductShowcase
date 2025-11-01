const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  createdAt: Date;
  hiddenByUser?: boolean;
}

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
  // В текущей спецификации нет GET /orders/{userId}
  // Используем заглушку или локальное хранилище
  return [];
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  // В текущей спецификации нет PUT /orders/{id}
  console.warn('updateOrderStatus not implemented in API Gateway');
}

export async function deleteOrder(orderId: string): Promise<void> {
  // В текущей спецификации нет DELETE /orders/{id}
  console.warn('deleteOrder not implemented in API Gateway');
}

export async function hideOrderForUser(orderId: string): Promise<void> {
  // В текущей спецификации нет этого эндпоинта
  console.warn('hideOrderForUser not implemented in API Gateway');
}

export async function getAllOrders(): Promise<Order[]> {
  // В текущей спецификации нет GET /orders
  return [];
}