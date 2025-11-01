import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Review } from "@/types/firebase-types";

export async function getReviewsByProduct(productId: string): Promise<Review[]> {
  try {
    const reviewsCol = collection(db, "reviews");
    const q = query(
      reviewsCol,
      where("productId", "==", productId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Review;
    });
  } catch (error) {
    console.error("Error loading reviews:", error);
    const reviewsCol = collection(db, "reviews");
    const q = query(reviewsCol, where("productId", "==", productId));
    const snapshot = await getDocs(q);
    const reviews = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Review;
    });
    return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const reviewsCol = collection(db, "reviews");
  const docRef = await addDoc(reviewsCol, {
    ...review,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
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
  try {
    const reviewsCol = collection(db, "reviews");
    const q = query(reviewsCol, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Review;
    });
  } catch (error) {
    console.error("Error loading all reviews:", error);
    const reviewsCol = collection(db, "reviews");
    const snapshot = await getDocs(reviewsCol);
    const reviews = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      } as Review;
    });
    return reviews.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export async function deleteReview(reviewId: string): Promise<void> {
  await deleteDoc(doc(db, "reviews", reviewId));
}
