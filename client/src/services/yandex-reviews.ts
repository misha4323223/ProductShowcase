const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export async function getReviews(productId?: string): Promise<Review[]> {
  const url = productId
    ? `${API_GATEWAY_URL}/reviews?productId=${productId}`
    : `${API_GATEWAY_URL}/reviews`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to get reviews');
  }

  const data = await response.json();
  return data.map((review: any) => ({
    ...review,
    createdAt: new Date(review.createdAt),
  }));
}

export async function createReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const response = await fetch(`${API_GATEWAY_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    throw new Error('Failed to create review');
  }

  const data = await response.json();
  return data.id;
}

export async function deleteReview(id: string): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/reviews/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete review');
  }
}

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  return getReviews(productId);
}

export async function getAllReviews(): Promise<Review[]> {
  return getReviews();
}

export async function getProductRating(productId: string): Promise<number> {
  const reviews = await getReviewsByProduct(productId);
  
  if (reviews.length === 0) {
    return 0;
  }
  
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
}