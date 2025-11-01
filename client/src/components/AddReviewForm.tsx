import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import StarRating from "@/components/StarRating";
import { useAuth } from "@/contexts/AuthContext";
import { addReview } from "@/services/yandex-reviews";
import { useToast } from "@/hooks/use-toast";

interface AddReviewFormProps {
  productId: string;
  onReviewAdded: () => void;
}

export default function AddReviewForm({ productId, onReviewAdded }: AddReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт чтобы оставить отзыв",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Выберите оценку",
        description: "Поставьте звездочки товару",
        variant: "destructive",
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: "Комментарий слишком короткий",
        description: "Напишите минимум 10 символов",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await addReview({
        productId,
        userId: user.uid,
        userName: user.email?.split('@')[0] || 'Пользователь',
        rating,
        comment: comment.trim(),
      });

      toast({
        title: "Отзыв добавлен!",
        description: "Спасибо за ваш отзыв",
      });

      setRating(0);
      setComment("");
      onReviewAdded();
    } catch (error) {
      console.error("Error adding review:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить отзыв. Попробуйте позже",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground" data-testid="text-login-required">
            Войдите в аккаунт чтобы оставить отзыв
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Написать отзыв</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="rating">Ваша оценка *</Label>
            <StarRating
              rating={rating}
              interactive
              onRatingChange={setRating}
              size="lg"
              dataTestIdPrefix="add-review-rating"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Ваш отзыв *</Label>
            <Textarea
              id="comment"
              placeholder="Расскажите о вашем опыте с этим товаром..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              data-testid="textarea-review-comment"
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Минимум 10 символов ({comment.length}/10)
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || rating === 0 || comment.trim().length < 10}
            className="w-full"
            data-testid="button-submit-review"
          >
            {isSubmitting ? "Отправка..." : "Опубликовать отзыв"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}