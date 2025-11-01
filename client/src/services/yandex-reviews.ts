import { docClient, generateId } from "@/lib/yandex-db";
import { PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { Review } from "@/types/firebase-types";

const REVIEWS_TABLE = "reviews";

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: REVIEWS_TABLE,
  }));
  
  const reviews = (result.Items || [])
    .filter((item: any) => item.productId === productId)
    .map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return reviews as Review[];
}

export async function addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const id = generateId();
  const newReview = {
    ...review,
    id,
    createdAt: new Date().toISOString(),
  };
  
  await docClient.send(new PutCommand({
    TableName: REVIEWS_TABLE,
    Item: newReview,
  }));
  
  return id;
}

export async function getProductRating(productId: string): Promise<{ averageRating: number; totalReviews: number }> {
  const reviews = await getReviewsByProduct(productId);
  
  if (reviews.length === 0) {
    return { averageRating: 0, totalReviews: 0 };
  }
  
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviews.length;
  
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
  };
}

export async function getAllReviews(): Promise<Review[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: REVIEWS_TABLE,
  }));
  
  const reviews = (result.Items || [])
    .map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  return reviews as Review[];
}

export async function deleteReview(reviewId: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: REVIEWS_TABLE,
    Key: { id: reviewId },
  }));
}
