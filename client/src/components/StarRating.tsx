import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  dataTestIdPrefix?: string;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRatingChange,
  className,
  dataTestIdPrefix = "rating",
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const stars = Array.from({ length: maxRating }, (_, i) => i + 1);

  return (
    <div className={cn("flex items-center gap-1", className)} data-testid={`container-${dataTestIdPrefix}`}>
      {stars.map((star) => {
        const filled = star <= rating;
        const partialFill = star === Math.ceil(rating) && rating % 1 !== 0;

        return (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange?.(star)}
            className={cn(
              "relative transition-all",
              interactive && "cursor-pointer hover:scale-110",
              !interactive && "cursor-default"
            )}
            disabled={!interactive}
            data-testid={`${dataTestIdPrefix}-star-${star}`}
          >
            {partialFill ? (
              <div className="relative">
                <Star
                  className={cn(sizeClasses[size], "text-muted-foreground")}
                  fill="none"
                  strokeWidth={2}
                />
                <div
                  className="absolute top-0 left-0 overflow-hidden"
                  style={{ width: `${(rating % 1) * 100}%` }}
                >
                  <Star
                    className={cn(sizeClasses[size], "text-yellow-500")}
                    fill="currentColor"
                    strokeWidth={2}
                  />
                </div>
              </div>
            ) : (
              <Star
                className={cn(
                  sizeClasses[size],
                  filled ? "text-yellow-500" : "text-muted-foreground"
                )}
                fill={filled ? "currentColor" : "none"}
                strokeWidth={2}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
