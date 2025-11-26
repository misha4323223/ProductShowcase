import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useWheel } from "@/contexts/WheelContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Sparkles, Gift, Percent, Coins, Truck, Star, Trophy, Target, HelpCircle } from "lucide-react";
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

      if (sectorIndex === -1) {
        console.error('Prize type not found in sectors:', prize.prizeType);
        toast({
          title: "Ошибка",
          description: "Неизвестный тип приза",
          variant: "destructive",
        });
        return;
      }

      const degreesPerSector = 360 / WHEEL_SECTORS.length; // 60 градусов для 6 секторов

      // Вычисляем ЦЕНТР нужного сектора (а не начало!)
      const sectorCenter = (sectorIndex * degreesPerSector) + (degreesPerSector / 2);

      console.log('🎯 Prize type:', prize.prizeType);
      console.log('🎯 Sector index:', sectorIndex);
      console.log('🎯 Sector center:', sectorCenter);

      // 5-7 ЦЕЛЫХ полных оборотов для эффекта (важно: целое число!)
      const extraSpins = 5 + Math.floor(Math.random() * 3);

      // ИСПРАВЛЕНИЕ: Стрелка изначально между джекпотом (300-360°) и скидкой 10% (0-60°)
      // То есть при rotation=0 под стрелкой позиция 0° градиента
      // Стрелка на 270° мировых координатах, под ней 0° градиента
      // Чтобы под стрелкой оказался центр нужного сектора, нужно повернуть так:
      // (sectorCenter + rotation) % 360 = 0  =>  rotation = -sectorCenter = 360 - sectorCenter
      const finalRotation = (360 * extraSpins) + (360 - sectorCenter);

      console.log('🎯 Final rotation:', finalRotation);
      console.log('🎯 Extra spins (integer):', extraSpins);

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
    // Сбрасываем положение рулетки для следующего вращения
    setRotation(0);
  };

  return (
    <>
      <Dialog open={open && !showPrizeModal} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] p-0 gap-0 flex flex-col" data-testid="dialog-wheel">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-center flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Рулетка Желаний
              <Sparkles className="w-5 h-5 text-primary" />
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 text-black dark:text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Левая колонка - Инструкция */}
              <div className="space-y-3">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm">🎰 Как работает Рулетка Желаний?</h3>
                  </div>

                  <div className="space-y-2.5 text-[11px]">
                    {/* Что такое кристаллы */}
                    <div>
                      <p className="font-semibold mb-0.5">💎 Что такое кристаллы?</p>
                      <p className="text-muted-foreground mb-0.5">
                        Кристаллы = попытки крутить рулетку
                      </p>
                      <p className="text-muted-foreground">
                        • 1000₽ покупки = 1 кристалл 💎
                      </p>
                    </div>

                    {/* Больше кристаллов = больше призов */}
                    <div>
                      <p className="font-semibold mb-0.5">🎁 Больше кристаллов = больше призов:</p>
                      <div className="space-y-0.5 text-[10px]">
                        <div>• 1💎 → Скидка 10% (на весь заказ)</div>
                        <div>• 2💎 → + Товар -20% (на случайный товар в корзине)</div>
                        <div>• 3💎 → + Бонусы +200₽ (на баланс)</div>
                        <div>• 4💎 → + Доставка бесплатно (на заказ)</div>
                        <div>• 5💎 → + Товар БЕСПЛАТНО (самый дешёвый в корзине, до 500₽)</div>
                        <div className="font-semibold text-orange-600 dark:text-orange-400">• 6+💎 → 🔥 ДЖЕКПОТ 40% (на всю корзину)</div>
                      </div>
                    </div>

                    {/* Как работает */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                      <p className="font-semibold mb-1">🎯 Как работает?</p>
                      <p className="text-muted-foreground mb-1">
                        Рулетка показывает все 6 призов, но выпасть могут только те, что доступны по вашим кристаллам.
                      </p>
                      <div className="mt-1.5 pt-1.5 border-t border-blue-200 dark:border-blue-700">
                        <p className="font-semibold mb-0.5 text-[10px]">Пример:</p>
                        <p className="text-muted-foreground text-[10px]">У вас 3💎 → можете выиграть скидку 10%, 20% или бонусы. Доставка, подарок и джекпот пока недоступны.</p>
                      </div>
                    </div>

                    {/* FAQ */}
                    <div className="space-y-1 pt-1">
                      <p className="font-semibold mb-1">❓ FAQ:</p>
                      <div className="space-y-1 text-[10px]">
                        <div>
                          <p className="font-semibold">В: Потрачу кристалл зря?</p>
                          <p className="text-muted-foreground ml-2">О: Нет, вы ВСЕГДА что-то выигрываете!</p>
                        </div>
                        <div>
                          <p className="font-semibold">В: Можно копить?</p>
                          <p className="text-muted-foreground ml-2">О: Да! Копите до 6+ для джекпота! 💎</p>
                        </div>
                        <div>
                          <p className="font-semibold">В: Почему нужна корзина?</p>
                          <p className="text-muted-foreground ml-2">О: Некоторые призы применяются к конкретным товарам в корзине 🛒</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Счетчик кристаллов */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">У вас:</p>
                  <div className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900 dark:to-purple-900 px-4 py-1.5 rounded-full">
                    <span className="text-xl">💎</span>
                    <span className="text-xl font-bold text-primary">× {spins}</span>
                  </div>
                </div>
              </div>

              {/* Правая колонка - Рулетка */}
              <div className="space-y-3">
                {/* Рулетка */}
                <div className="relative w-48 h-48 sm:w-60 sm:h-60 mx-auto">
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
            <div className="text-center mb-2">
              <Button
                size="default"
                onClick={handleSpin}
                disabled={isSpinning || isLoading || spins < 1}
                className="px-5 text-sm font-bold"
                data-testid="button-spin-wheel"
              >
                {isSpinning ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Крутится...
                  </>
                ) : spins < 1 ? (
                  "Нет кристаллов"
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Крутить рулетку
                  </>
                )}
              </Button>

              {spins < 1 && (
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Делайте заказы, чтобы получить кристаллы!<br />
                  1000₽ = 1 кристалл 💎
                </p>
              )}
            </div>

            {/* Вишлист */}
                {wishlistCount > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-[11px] text-muted-foreground text-center mb-1.5">
                      Ваш вишлист ({wishlistCount} товаров):
                    </p>
                    <div className="flex gap-1.5 justify-center flex-wrap">
                      {wishlistItems.slice(0, 6).map((item) => (
                        <div
                          key={item.productId}
                          className="w-8 h-8 rounded-md overflow-hidden border-2 border-muted"
                        >
                          <div className="w-full h-full bg-muted flex items-center justify-center text-xs">
                            🍬
                          </div>
                        </div>
                      ))}
                      {wishlistCount > 6 && (
                        <div className="w-8 h-8 rounded-md border-2 border-muted flex items-center justify-center text-[10px] text-muted-foreground">
                          +{wishlistCount - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Юридический дисклеймер */}
            <div className="mt-4 pt-3 border-t">
              <p className="text-[10px] text-center text-muted-foreground leading-relaxed bg-muted/30 px-3 py-2 rounded-md">
                Акция не является азартной игрой и лотереей. Организатор вправе изменить условия акции.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Модалка с призом */}
      {wonPrize && (
        <Dialog open={showPrizeModal} onOpenChange={closePrizeModal}>
          <DialogContent className="max-w-md !z-[99999]" data-testid="dialog-prize-result">
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