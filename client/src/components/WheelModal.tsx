import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWheel } from "@/contexts/WheelContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Sparkles, Gift, Percent, Coins, Truck, Star, Trophy } from "lucide-react";
import type { WheelPrize, PrizeType } from "@/types/firebase-types";

interface WheelModalProps {
  open: boolean;
  onClose: () => void;
}

// Конфигурация секторов рулетки
const WHEEL_SECTORS = [
  {
    type: 'discount_10' as PrizeType,
    label: 'Скидка 10%',
    emoji: '🎫',
    icon: Percent,
    color: 'from-purple-400 via-purple-500 to-purple-600',
    chance: 30,
  },
  {
    type: 'discount_20' as PrizeType,
    label: 'Товар -20%',
    emoji: '🎁',
    icon: Gift,
    color: 'from-pink-400 via-pink-500 to-pink-600',
    chance: 25,
  },
  {
    type: 'points' as PrizeType,
    label: '+200 баллов',
    emoji: '💰',
    icon: Coins,
    color: 'from-amber-400 via-amber-500 to-amber-600',
    chance: 20,
  },
  {
    type: 'delivery' as PrizeType,
    label: 'Доставка',
    emoji: '🚚',
    icon: Truck,
    color: 'from-blue-400 via-blue-500 to-blue-600',
    chance: 15,
  },
  {
    type: 'free_item' as PrizeType,
    label: 'Подарок',
    emoji: '🎉',
    icon: Star,
    color: 'from-green-400 via-green-500 to-green-600',
    chance: 8,
  },
  {
    type: 'jackpot' as PrizeType,
    label: 'ДЖЕКПОТ!',
    emoji: '🏆',
    icon: Trophy,
    color: 'from-red-500 via-orange-500 to-yellow-400',
    chance: 2,
  },
];

export default function WheelModal({ open, onClose }: WheelModalProps) {
  const { user } = useAuth();
  const { spins, spin, isLoading } = useWheel();
  const { wishlistItems, wishlistCount } = useWishlist();
  const [, setLocation] = useLocation();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<WheelPrize | null>(null);
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  // Сброс состояния при закрытии
  useEffect(() => {
    if (!open) {
      setWonPrize(null);
      setShowPrizeModal(false);
    }
  }, [open]);

  const handleSpin = async () => {
    if (!user) {
      onClose();
      setLocation("/login");
      return;
    }

    if (spins < 1) {
      return;
    }

    if (wishlistCount === 0) {
      alert("Добавьте товары в избранное, чтобы получить персонализированные призы!");
      return;
    }

    setIsSpinning(true);

    try {
      // Анимация вращения
      const spins = 5 + Math.random() * 3; // 5-8 полных оборотов
      const randomAngle = Math.random() * 360;
      const finalRotation = rotation + (360 * spins) + randomAngle;
      
      setRotation(finalRotation);

      // Запрос к API
      const prize = await spin();

      // Ждем окончания анимации
      await new Promise(resolve => setTimeout(resolve, 4000));

      if (prize) {
        setWonPrize(prize);
        setShowPrizeModal(true);
      }
    } catch (error) {
      console.error("Ошибка вращения:", error);
    } finally {
      setIsSpinning(false);
    }
  };

  const getPrizeInfo = (prizeType: PrizeType) => {
    return WHEEL_SECTORS.find(s => s.type === prizeType) || WHEEL_SECTORS[0];
  };

  const closePrizeModal = () => {
    setShowPrizeModal(false);
    setWonPrize(null);
  };

  return (
    <>
      <Dialog open={open && !showPrizeModal} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl" data-testid="dialog-wheel">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Рулетка Желаний
              <Sparkles className="w-6 h-6 text-primary" />
            </DialogTitle>
          </DialogHeader>

          <div className="py-6">
            {/* Счетчик спинов */}
            <div className="text-center mb-6">
              <p className="text-muted-foreground mb-2">У вас:</p>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 px-6 py-3 rounded-full">
                <span className="text-3xl">🎰</span>
                <span className="text-3xl font-bold text-primary">× {spins}</span>
              </div>
            </div>

            {/* Рулетка */}
            <div className="relative w-full max-w-md mx-auto aspect-square mb-6">
              {/* Указатель */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[30px] border-t-primary drop-shadow-lg" />
              </div>

              {/* Колесо рулетки */}
              <div 
                className="w-full h-full rounded-full overflow-hidden shadow-2xl relative border-4 border-primary"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {WHEEL_SECTORS.map((sector, index) => {
                  const angle = (360 / WHEEL_SECTORS.length) * index;
                  const Icon = sector.icon;
                  
                  return (
                    <div
                      key={sector.type}
                      className={`absolute w-full h-full bg-gradient-to-br ${sector.color}`}
                      style={{
                        transform: `rotate(${angle}deg)`,
                        clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin((Math.PI * 2) / WHEEL_SECTORS.length)}% ${50 - 50 * Math.cos((Math.PI * 2) / WHEEL_SECTORS.length)}%)`,
                      }}
                    >
                      <div 
                        className="absolute top-[25%] left-1/2 -translate-x-1/2 text-center"
                        style={{ transform: `translateX(-50%) rotate(${30}deg)` }}
                      >
                        <Icon className="w-8 h-8 text-white mx-auto mb-1" />
                        <p className="text-xs font-bold text-white whitespace-nowrap">{sector.label}</p>
                        <p className="text-xs text-white/80">{sector.chance}%</p>
                      </div>
                    </div>
                  );
                })}

                {/* Центр */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-white dark:bg-gray-800 border-4 border-primary flex items-center justify-center shadow-lg">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
              </div>
            </div>

            {/* Кнопка вращения */}
            <div className="text-center">
              <Button
                size="lg"
                onClick={handleSpin}
                disabled={isSpinning || isLoading || spins < 1}
                className="px-8 py-6 text-lg font-bold"
                data-testid="button-spin-wheel"
              >
                {isSpinning ? (
                  <>
                    <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                    Крутится...
                  </>
                ) : spins < 1 ? (
                  "Нет спинов"
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Крутить рулетку (1 спин)
                  </>
                )}
              </Button>
              
              {spins < 1 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Делайте заказы, чтобы получить спины! <br />
                  1000₽ = 1 спин
                </p>
              )}
            </div>

            {/* Вишлист */}
            {wishlistCount > 0 && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center mb-3">
                  Ваш вишлист ({wishlistCount} товаров):
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {wishlistItems.slice(0, 8).map((item) => (
                    <div 
                      key={item.productId}
                      className="w-12 h-12 rounded-lg overflow-hidden border-2 border-muted"
                    >
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                        🍬
                      </div>
                    </div>
                  ))}
                  {wishlistCount > 8 && (
                    <div className="w-12 h-12 rounded-lg border-2 border-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{wishlistCount - 8}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Модалка с призом */}
      {wonPrize && (
        <Dialog open={showPrizeModal} onOpenChange={closePrizeModal}>
          <DialogContent className="max-w-md" data-testid="dialog-prize-result">
            <div className="text-center py-6">
              <div className="text-6xl mb-4 animate-bounce">
                {getPrizeInfo(wonPrize.prizeType).emoji}
              </div>
              
              <h2 className="text-2xl font-bold mb-2">
                Поздравляем! 🎉
              </h2>
              
              <p className="text-lg text-muted-foreground mb-4">
                {getPrizeInfo(wonPrize.prizeType).label}
              </p>

              {wonPrize.productName && (
                <div className="bg-muted rounded-lg p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Товар:</p>
                  <p className="font-semibold">{wonPrize.productName}</p>
                </div>
              )}

              <div className="bg-primary/10 rounded-lg p-4 mb-4">
                <p className="text-sm text-muted-foreground mb-1">Промокод:</p>
                <p className="text-xl font-mono font-bold text-primary">{wonPrize.promoCode}</p>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Действует до:{" "}
                {new Date(wonPrize.expiresAt).toLocaleDateString("ru-RU")}
              </p>

              <Button onClick={closePrizeModal} className="w-full" data-testid="button-close-prize">
                Отлично!
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
