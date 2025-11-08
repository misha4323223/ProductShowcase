import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWheel } from "@/contexts/WheelContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
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
      toast({
        title: "Пустой вишлист",
        description: "Добавьте товары в избранное, чтобы получить персонализированные призы!",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);

    try {
      // Сначала получаем приз от API
      const prize = await spin();

      if (!prize) {
        toast({
          title: "Ошибка",
          description: "Не удалось получить приз. Попробуйте еще раз.",
          variant: "destructive",
        });
        return;
      }

      // Вычисляем угол на основе типа приза
      const sectorIndex = WHEEL_SECTORS.findIndex(s => s.type === prize.prizeType);
      const degreesPerSector = 360 / WHEEL_SECTORS.length; // 60 градусов
      const sectorCenterAngle = sectorIndex * degreesPerSector + (degreesPerSector / 2); // центр сектора
      
      // 5-8 полных оборотов + угол до нужного сектора
      const fullSpins = 5 + Math.random() * 3;
      // Инвертируем направление, так как указатель сверху, а рулетка вращается
      const targetAngle = 360 - sectorCenterAngle;
      const finalRotation = rotation + (360 * fullSpins) + targetAngle;
      
      // Запускаем анимацию к нужному сектору
      setRotation(finalRotation);

      // Ждем окончания анимации
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Показываем результат
      setWonPrize(prize);
      setShowPrizeModal(true);
    } catch (error) {
      console.error("Ошибка вращения:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при вращении рулетки",
        variant: "destructive",
      });
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" data-testid="dialog-wheel">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Рулетка Желаний
              <Sparkles className="w-6 h-6 text-primary" />
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {/* Счетчик спинов */}
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-2">У вас:</p>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 px-5 py-2 rounded-full">
                <span className="text-2xl">🎰</span>
                <span className="text-2xl font-bold text-primary">× {spins}</span>
              </div>
            </div>

            {/* Рулетка */}
            <div className="relative w-full max-w-sm mx-auto aspect-square mb-4">
              {/* Указатель */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-primary drop-shadow-lg" />
              </div>

              {/* Колесо рулетки - леденец */}
              <div 
                className="w-full h-full rounded-full shadow-2xl relative overflow-hidden"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: isSpinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                  background: 'conic-gradient(from 0deg, #9333ea 0deg 60deg, #ec4899 60deg 120deg, #f59e0b 120deg 180deg, #3b82f6 180deg 240deg, #10b981 240deg 300deg, #f97316 300deg 360deg)',
                  border: '6px solid white',
                  boxShadow: '0 0 0 3px #ec4899, 0 20px 50px rgba(0,0,0,0.3)',
                }}
              >
                {WHEEL_SECTORS.map((sector, index) => {
                  const degreesPerSector = 360 / WHEEL_SECTORS.length;
                  const startAngle = index * degreesPerSector;
                  const middleAngle = startAngle + (degreesPerSector / 2);
                  const Icon = sector.icon;
                  
                  // Позиция текста ближе к краю (60% от центра)
                  const radius = 35; // процент от радиуса (половина, т.к. элемент 100% width/height)
                  const angleInRadians = (middleAngle - 90) * (Math.PI / 180);
                  const x = 50 + radius * Math.cos(angleInRadians);
                  const y = 50 + radius * Math.sin(angleInRadians);
                  
                  return (
                    <div
                      key={sector.type}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: `translate(-50%, -50%) rotate(${middleAngle}deg)`,
                      }}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <Icon className="w-5 h-5 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                        <p className="text-[9px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap">{sector.label}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Центр леденца */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white dark:bg-gray-800 border-4 border-pink-400 flex items-center justify-center shadow-lg">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
            </div>

            {/* Кнопка вращения */}
            <div className="text-center mb-4">
              <Button
                size="lg"
                onClick={handleSpin}
                disabled={isSpinning || isLoading || spins < 1}
                className="px-6 py-5 text-base font-bold"
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
                    Крутить рулетку
                  </>
                )}
              </Button>
              
              {spins < 1 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Делайте заказы, чтобы получить спины!<br />
                  1000₽ = 1 спин
                </p>
              )}
            </div>

            {/* Вишлист */}
            {wishlistCount > 0 && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Ваш вишлист ({wishlistCount} товаров):
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {wishlistItems.slice(0, 6).map((item) => (
                    <div 
                      key={item.productId}
                      className="w-10 h-10 rounded-lg overflow-hidden border-2 border-muted"
                    >
                      <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                        🍬
                      </div>
                    </div>
                  ))}
                  {wishlistCount > 6 && (
                    <div className="w-10 h-10 rounded-lg border-2 border-muted flex items-center justify-center text-xs text-muted-foreground">
                      +{wishlistCount - 6}
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
