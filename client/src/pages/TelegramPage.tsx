import { useEffect } from 'react';

export default function TelegramPage() {
  useEffect(() => {
    // Парсим параметр tab из URL
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');

    if (!tab || tab === 'shop') {
      // Магазин - остаемся на главной странице
      return;
    }

    // Редирект на нужную страницу в зависимости от tab
    const routes: { [key: string]: string } = {
      'orders': '/account?tab=orders',
      'wishlist': '/wishlist',
      'promos': '/account?tab=promos',
      'account': '/account',
    };

    const targetRoute = routes[tab];
    if (targetRoute) {
      // Используем window.location для полного редиректа
      window.location.href = targetRoute;
    }
  }, []);

  // Показываем загрузку пока идет редирект
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}
