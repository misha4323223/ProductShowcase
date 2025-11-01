import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import StarRating from "@/components/StarRating";
import type { Review } from "@/types/firebase-types";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

interface ReviewsListProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export default function ReviewsList({ reviews, averageRating, totalReviews }: ReviewsListProps) {
  const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
    stars: star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: totalReviews > 0 ? (reviews.filter(r => r.rating === star).length / totalReviews) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-lg">Общий рейтинг</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold" data-testid="text-average-rating">
                {averageRating > 0 ? averageRating.toFixed(1) : '—'}
              </div>
              <div>
                <StarRating rating={averageRating} size="lg" dataTestIdPrefix="overall-rating" />
                <p className="text-sm text-muted-foreground mt-1" data-testid="text-total-reviews">
                  {totalReviews} {totalReviews === 1 ? 'отзыв' : totalReviews < 5 ? 'отзыва' : 'отзывов'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-lg">Распределение оценок</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3" data-testid={`rating-dist-${stars}`}>
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{stars}</span>
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground" data-testid="text-no-reviews">
              Пока нет отзывов. Станьте первым!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Отзывы покупателей</h3>
          {reviews.map((review) => (
            <Card key={review.id} data-testid={`review-${review.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {review.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium" data-testid={`review-author-${review.id}`}>
                        {review.userName}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`review-date-${review.id}`}>
                        {formatDistanceToNow(review.createdAt, { addSuffix: true, locale: ru })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} size="sm" dataTestIdPrefix={`review-${review.id}-rating`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground" data-testid={`review-comment-${review.id}`}>
                  {review.comment}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}
