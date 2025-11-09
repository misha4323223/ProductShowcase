const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export interface UICartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface FirebaseCartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
}

export async function saveCartToYDB(userId: string, items: FirebaseCartItem[]): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, items }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to save cart');
  }
}

export async function loadCartFromYDB(userId: string): Promise<FirebaseCartItem[]> {
  const response = await fetch(`${API_GATEWAY_URL}/cart/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to load cart');
  }
  
  const data = await response.json();
  return data.items || [];
}
