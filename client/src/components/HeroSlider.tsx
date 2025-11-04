import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { subscribeToNewsletter } from "@/services/yandex-newsletter";
import OptimizedImage from "@/components/OptimizedImage";

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
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();

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

    setIsSubscribing(true);
    try {
      await subscribeToNewsletter(email);
      toast({
        title: "Спасибо за подписку! 🎉",
        description: "Мы сообщим вам об открытии магазина и эксклюзивных предложениях",
      });
      setEmail("");
      setShowSubscribeDialog(false);
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
      <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
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
              alt={slide.title}
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={index === 0 ? "high" : "low"}
              className={`w-full h-full object-cover ${
                slide.id === 2 ? 'object-left' : slide.id === 3 ? 'object-bottom' : 'object-center'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className={`absolute inset-0 flex ${
              slide.id === 1 || slide.id === 3 ? 'items-start pt-8 md:pt-12' : 'items-center'
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Подпишитесь на новости 📬</DialogTitle>
            <DialogDescription>
              Узнайте первыми об открытии магазина и получайте эксклюзивные предложения
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubscribe} className="space-y-4">
            <Input
              type="email"
              placeholder="Ваш email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubscribing}
              data-testid="input-subscribe-email"
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubscribing}
              data-testid="button-submit-subscribe"
            >
              {isSubscribing ? "Подписываемся..." : "Подписаться"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
