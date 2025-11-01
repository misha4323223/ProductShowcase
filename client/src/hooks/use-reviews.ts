import { useQuery } from "@tanstack/react-query";
import { getReviewsByProduct, getProductRating } from "@/services/yandex-reviews";

export function useReviews(productId: string) {
  const reviewsQuery = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => getReviewsByProduct(productId),
    enabled: !!productId,
    staleTime: 1000 * 60,
  });

  const ratingQuery = useQuery({
    queryKey: ['rating', productId],
    queryFn: () => getProductRating(productId),
    enabled: !!productId,
    staleTime: 1000 * 60,
  });

  return {
    reviews: reviewsQuery.data ?? [],
    rating: ratingQuery.data ?? { averageRating: 0, totalReviews: 0 },
    isLoading: reviewsQuery.isLoading || ratingQuery.isLoading,
    refetch: () => {
      reviewsQuery.refetch();
      ratingQuery.refetch();
    },
  };
}