const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
  inStock: boolean;
  stock: number;
}

export async function getAllProducts(): Promise<Product[]> {
  const response = await fetch(`${API_GATEWAY_URL}/products`);

  if (!response.ok) {
    throw new Error('Failed to get products');
  }

  return response.json();
}

export async function getProductById(id: string): Promise<Product> {
  const response = await fetch(`${API_GATEWAY_URL}/products/${id}`);

  if (!response.ok) {
    throw new Error('Failed to get product');
  }

  return response.json();
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<string> {
  const response = await fetch(`${API_GATEWAY_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error('Failed to create product');
  }

  const data = await response.json();
  return data.id;
}

export async function updateProduct(id: string, product: Partial<Product>): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error('Failed to update product');
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/products/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete product');
  }
}