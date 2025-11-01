import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { savePushSubscription, updatePushSubscriptionStatus } from "@/services/yandex-push-subscriptions";

interface Slide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
}

interface HeroSliderProps {
  slides: Slide[];
}

export default function HeroSlider({ slides }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    // Проверка статуса подписки при загрузке
    const checkSubscription = async () => {
      try {
        if (window.OneSignal && typeof window.OneSignal.User !== 'undefined') {
          const isPushEnabled = await window.OneSignal.User.PushSubscription.optedIn;
          setIsSubscribed(isPushEnabled);
          console.log('📊 Статус подписки OneSignal:', isPushEnabled);
        }
      } catch (error) {
        console.log('OneSignal не загружен, подписка недоступна');
      }
    };

    // Даем OneSignal время загрузиться
    setTimeout(checkSubscription, 1000);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleSubscribe = async () => {
    console.log('🔔 Клик на кнопку подписки/отписки');

    try {
      // Проверяем, загружен ли OneSignal и готов ли он к работе
      console.log('⏳ Ожидание загрузки OneSignal...');
      
      let attempts = 0;
      const maxAttempts = 100;
      
      while (!window.OneSignalReady && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
        
        if (attempts % 10 === 0) {
          console.log(`⏳ Ожидание... ${attempts * 100}мс`);
        }
      }

      if (!window.OneSignalReady || !window.OneSignal) {
        console.error('❌ OneSignal не готов после', attempts * 100, 'мс');
        toast({
          title: "⚠️ Ошибка загрузки",
          description: "Система уведомлений не загрузилась. Попробуйте обновить страницу.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ OneSignal готов к работе');

      if (!window.OneSignal.User || !window.OneSignal.User.PushSubscription || !window.OneSignal.Slidedown) {
        console.error('❌ OneSignal API не полностью инициализирован');
        toast({
          title: "⚠️ Ошибка инициализации",
          description: "Не все компоненты OneSignal загружены. Обновите страницу.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Все API доступны, проверяем статус подписки');
      
      const isPushEnabled = await window.OneSignal.User.PushSubscription.optedIn;
      console.log('📊 Текущий статус подписки:', isPushEnabled);

      if (isPushEnabled) {
        // Пользователь хочет отписаться
        console.log('🔕 Отписываемся от уведомлений...');
        
        const subscriptionId = await window.OneSignal.User.PushSubscription.id;
        
        await window.OneSignal.User.PushSubscription.optOut();
        
        if (subscriptionId) {
          await updatePushSubscriptionStatus(subscriptionId, 'unsubscribed');
          console.log('✅ Статус подписки обновлен в Yandex Cloud');
        }
        
        setIsSubscribed(false);
        toast({
          title: "Вы отписались",
          description: "Вы больше не будете получать уведомления",
        });
        return;
      }

      console.log('🚀 Показываем промпт подписки...');

      // КРИТИЧНО: Проверяем browser permission ПЕРЕД promptPush
      if (window.OneSignal.Notifications) {
        const browserPermission = window.OneSignal.Notifications.permission;
        console.log('🔐 Browser permission:', browserPermission);
        
        // Если уведомления заблокированы браузером
        if (browserPermission === false) {
          console.warn('⚠️ Уведомления заблокированы в браузере!');
          toast({
            title: "⚠️ Уведомления заблокированы",
            description: "Разрешите уведомления в настройках браузера: нажмите на иконку 🔒 слева от адресной строки",
            variant: "destructive",
            duration: 10000,
          });
          return;
        }
      }

      // Вызываем Slidedown promptPush
      console.log('🎯 Вызываем Slidedown.promptPush()...');
      await window.OneSignal.Slidedown.promptPush({ force: true });
      
      console.log('✅ promptPush() выполнен');

      setTimeout(async () => {
        try {
          if (window.OneSignal && window.OneSignal.User && window.OneSignal.User.PushSubscription) {
            const isNowSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
            console.log('📊 Статус после промпта:', isNowSubscribed);

            if (isNowSubscribed) {
              const subscriptionId = await window.OneSignal.User.PushSubscription.id;
              const subscriptionToken = await window.OneSignal.User.PushSubscription.token;
              
              console.log('📝 ID подписки:', subscriptionId);
              console.log('📝 Токен подписки:', subscriptionToken ? 'получен' : 'отсутствует');
              
              if (subscriptionId) {
                await savePushSubscription(subscriptionId, subscriptionToken || undefined);
                console.log('✅ Подписка сохранена в Yandex Cloud');
              }
              
              setIsSubscribed(true);
              toast({
                title: "Спасибо за подписку! 🎉",
                description: "Мы сообщим вам, как только откроемся!",
              });
            }
          }
        } catch (error) {
          console.error('Ошибка сохранения подписки:', error);
        }
      }, 1500);
    } catch (error) {
      console.error('Ошибка подписки:', error);
      toast({
        title: "❌ Ошибка",
        description: `Не удалось выполнить операцию: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full h-[50vh] md:h-[70vh] overflow-hidden bg-gradient-to-br from-pink-50 to-purple-50">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white max-w-3xl px-4">
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

      {/* Единая кнопка подписки для всех слайдов */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="text-center max-w-3xl px-4 mt-32 md:mt-40 pointer-events-auto">
          <Button 
            size="lg" 
            onClick={handleSubscribe}
            className="bg-gradient-to-r from-primary via-pink-500 to-accent text-white shadow-2xl hover:shadow-pink-500/50 hover:scale-105 transition-all duration-300 glossy relative overflow-hidden sprinkles text-lg px-8 py-6"
            data-testid="button-subscribe"
          >
            {isSubscribed ? (
              <>
                <BellOff className="mr-2 h-5 w-5" />
                Отписаться
              </>
            ) : (
              <>
                <Bell className="mr-2 h-5 w-5" />
                Подписаться
              </>
            )}
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
  );
}
