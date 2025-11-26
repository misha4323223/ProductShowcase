
const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export interface WishlistItem {
  productId: string;
  addedAt: Date;
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/wishlist/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', productId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add to wishlist');
  }
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/wishlist/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'remove', productId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove from wishlist');
  }
}

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const response = await fetch(`${API_GATEWAY_URL}/wishlist/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get wishlist');
  }
  
  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    productId: item.productId,
    addedAt: new Date(item.addedAt),
  }));
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const wishlistItems = await getWishlist(userId);
  return wishlistItems.some(item => item.productId === productId);
}

export async function getPublicWishlist(userId: string): Promise<WishlistItem[]> {
  const response = await fetch(`${API_GATEWAY_URL}/wishlist/${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to get public wishlist');
  }
  
  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    productId: item.productId,
    addedAt: new Date(item.addedAt),
  }));
}
