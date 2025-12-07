import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Mail, Copy, Check } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { subscribeToNewsletter } from "@/services/yandex-newsletter";
import OptimizedImage from "@/components/OptimizedImage";
import LegalDialog from "@/components/LegalDialog";
import { useTheme } from "@/contexts/ThemeContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";

interface Slide {
  id: number;
  image: string;
  webpImage: string;
  title: string;
  subtitle: string;
}

interface HeroSliderProps {
  slides: Slide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSubscribeDialog, setShowSubscribeDialog] = useState(false);
  const [showPromoDialog, setShowPromoDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPrivacyDialog, setShowPrivacyDialog] = useState(false);
  const { toast } = useToast();
  const { theme: currentTheme } = useTheme();
  const { siteName } = useSiteSettings();

  // Определяем, включена ли темная тема
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'new-year';

  useEffect(() => {
    // ОПТИМИЗАЦИЯ: Увеличен интервал с 5 до 10 секунд для снижения нагрузки
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSubscribeClick = () => {
    setShowSubscribeDialog(true);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Введите email",
        description: "Пожалуйста, введите ваш email для подписки",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Некорректный email",
        description: "Пожалуйста, введите правильный email адрес",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Требуется согласие",
        description: "Пожалуйста, дайте согласие на обработку данных и рассылку",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);
    try {
      await subscribeToNewsletter(email);
      setEmail("");
      setAgreedToTerms(false);
      setShowSubscribeDialog(false);
      // Показываем окно с промокодом после успешной подписки
      setTimeout(() => {
        setShowPromoDialog(true);
      }, 300);
    } catch (error: any) {
      toast({
        title: "Ошибка подписки",
        description: error.message || "Не удалось подписаться на рассылку",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <>
      <div className="relative w-full h-[60vh] md:h-[70vh] max-h-[1500px] md:max-h-[1600px] overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50 pt-4 md:pt-20 hero-mobile-fix">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <OptimizedImage
              src={slide.image}
              webpSrc={slide.webpImage}
              alt={`${slide.title} - ${siteName} интернет-магазин сладостей и подарков с доставкой по России`}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={index === 0 ? "high" : "low"}
              className={`w-full h-full object-cover hero-slide-image ${
                slide.id === 1 ? 'object-top' : slide.id === 2 ? 'object-center' : slide.id === 3 ? 'object-bottom' : 'object-center'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className={`absolute inset-0 flex ${
              slide.id === 1 ? 'items-start pt-2 md:pt-8' : 
              slide.id === 2 ? 'items-start pt-2 md:pt-32' : 
              slide.id === 3 ? (isDarkMode ? 'items-start pt-28 md:pt-32' : 'items-start pt-8 md:pt-12') : 
              'items-center'
            } ${slide.id === 2 ? 'justify-end' : slide.id === 3 ? 'justify-start' : 'justify-center'}`}>
              <div className={`${slide.id === 2 ? 'text-right pr-4 md:pr-16' : slide.id === 3 ? 'text-left pl-4 md:pl-16' : 'text-center px-4'} text-white max-w-3xl`}>
                <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 drop-shadow-2xl text-candy" data-testid={`text-slide-title-${index}`}>
                  {slide.title}
                </h1>
                <p className="text-lg md:text-xl mb-8 text-white drop-shadow-lg" data-testid={`text-slide-subtitle-${index}`}>
                  {slide.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Кнопка подписки */}
        <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-20 pb-16 md:pb-16">
          <div className="text-center max-w-3xl px-4 pointer-events-auto">
            {currentTheme === 'new-year' && (
              <p className="text-accent text-2xl md:text-4xl font-bold mb-4 drop-shadow-2xl">
                Скоро Открытие!
              </p>
            )}
            <p className="text-white text-base md:text-lg font-medium mb-2 drop-shadow-lg">
              Первым покупателям - скидка 10% ✨
            </p>
            <Button 
              size="default"
              onClick={handleSubscribeClick}
              className="bg-gradient-to-r from-primary via-pink-500 to-accent text-white shadow-2xl hover:shadow-pink-500/50 hover:scale-105 transition-all duration-300 glossy relative overflow-hidden sprinkles text-sm md:text-base px-4 py-2 md:px-6 md:py-3"
              data-testid="button-subscribe"
            >
              <Mail className="mr-1 md:mr-2 h-4 w-4 md:h-4 md:w-4" />
              Узнать об открытии
            </Button>
          </div>
        </div>

        <button
          onClick={prevSlide}
          className="absolute left-2 md:left-4 bottom-20 md:top-1/2 md:-translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-colors z-10"
          data-testid="button-prev-slide"
        >
          <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-2 md:right-4 bottom-20 md:top-1/2 md:-translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center text-white transition-colors z-10"
          data-testid="button-next-slide"
        >
          <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
              }`}
              data-testid={`button-slide-dot-${index}`}
            />
          ))}
        </div>
      </div>

      {/* Dialog для подписки */}
      <Dialog open={showSubscribeDialog} onOpenChange={setShowSubscribeDialog}>
        <DialogContent className="w-[95vw] max-w-md sm:max-w-md max-h-[90vh] p-0 gap-0 flex flex-col">
          <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b flex-shrink-0">
            <DialogTitle className="text-lg sm:text-xl">Эксклюзивное предложение 🎁</DialogTitle>
            <DialogDescription className="text-sm">
              Подпишитесь на уведомление об открытии и получите промокод на скидку 10%
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
            <div>
              <p className="text-sm font-medium mb-3">Подпишитесь на email:</p>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Ваш email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubscribing}
                  data-testid="input-subscribe-email"
                />

                <div className="flex items-start gap-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    disabled={isSubscribing}
                    data-testid="checkbox-terms"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-muted-foreground leading-tight cursor-pointer"
                  >
                    Я согласен с{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPrivacyDialog(true);
                      }}
                      className="text-primary hover:underline font-medium"
                      data-testid="button-privacy-policy"
                    >
                      политикой конфиденциальности
                    </button>
                    {" "}и на получение рассылки
                  </label>
                </div>
              </form>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-sm text-muted-foreground">или</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div>
              <p className="text-sm font-medium mb-3">Подпишитесь в Telegram:</p>
              <a
                href="https://t.me/SweetWeb71_bot?start"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
                data-testid="button-telegram-subscribe-dialog"
              >
                <Button 
                  variant="outline"
                  className="w-full"
                >
                  <SiTelegram className="h-4 w-4 mr-2" />
                  Открыть Telegram бот
                </Button>
              </a>
            </div>
          </div>

          <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t flex gap-2">
            <Button 
              onClick={() => setShowSubscribeDialog(false)}
              variant="outline"
              className="flex-1"
              data-testid="button-cancel-subscribe"
            >
              Отмена
            </Button>
            <Button 
              onClick={handleSubscribe}
              className="flex-1"
              disabled={isSubscribing || !agreedToTerms}
              data-testid="button-submit-subscribe"
            >
              {isSubscribing ? "Подписываемся..." : "Подписаться по email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog с промокодом */}
      <PromoCodeDialog 
        open={showPromoDialog} 
        onOpenChange={setShowPromoDialog}
      />

      {/* Dialog с политикой конфиденциальности */}
      <LegalDialog
        isOpen={showPrivacyDialog}
        onClose={() => setShowPrivacyDialog(false)}
        type="privacy"
      />
    </>
  );
}

// Компонент диалога с промокодом
function PromoCodeDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [copied, setCopied] = useState(false);
  const promoCode = "OPENSWEET";

  const copyPromoCode = () => {
    navigator.clipboard.writeText(promoCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Ура! Вы с нами! 🎊</DialogTitle>
          <DialogDescription className="text-center pt-2">
            Держите ваш приветственный промокод. Не потеряйте его — скидка 10% ждёт вас при первом заказе!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Промокод */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-primary rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Ваш промокод:</p>
            <p className="text-3xl font-bold text-primary tracking-wider" data-testid="text-promo-code">
              {promoCode}
            </p>
          </div>

          {/* Кнопка копирования */}
          <Button 
            onClick={copyPromoCode}
            className="w-full"
            variant={copied ? "outline" : "default"}
            data-testid="button-copy-promo"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Скопировано!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Скопировать промокод
              </>
            )}
          </Button>

          {/* Дополнительный текст */}
          <p className="text-sm text-center text-muted-foreground">
            Скопируйте промокод или сохраните скриншот 📸
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}