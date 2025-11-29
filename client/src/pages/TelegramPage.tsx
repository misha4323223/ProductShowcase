import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useTelegramApp } from '@/hooks/useTelegramApp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Home from './Home';

export default function TelegramPage() {
  const [, setLocation] = useLocation();
  const { isInMiniApp, telegramUser } = useTelegramApp();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Небольшая задержка для загрузки Telegram Web App API
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-muted-foreground">Загрузка Sweet Delights...</p>
        </div>
      </div>
    );
  }

  // Если в Mini App и пользователь авторизован - показываем обычное приложение
  if (isInMiniApp && telegramUser) {
    return (
      <div className="min-h-screen pb-20">
        <Home />
      </div>
    );
  }

  // Fallback если не в Mini App
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Sweet Delights</h1>
        <p className="text-muted-foreground mb-6">
          Эта страница предназначена для открытия в Telegram Mini App.
        </p>
        <Button 
          onClick={() => setLocation('/')}
          className="w-full"
          data-testid="button-go-home"
        >
          Перейти на главную
        </Button>
      </Card>
    </div>
  );
}
