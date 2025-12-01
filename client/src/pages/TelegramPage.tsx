import { useEffect } from 'react';
import { useLocation } from 'wouter';
import Home from './Home';
import CategoryPage from './CategoryPage';
import AccountPage from './AccountPage';
import WishlistPage from './WishlistPage';

export default function TelegramPage() {
  const [location, navigate] = useLocation();

  useEffect(() => {
    // Парсим параметр tab из URL
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');

    if (!tab || tab === 'shop') {
      // Магазин - главная страница (остаемся на месте)
      return;
    }

    // Навигируемся на нужную страницу
    const routes: { [key: string]: string } = {
      'orders': '/account?tab=orders',
      'wishlist': '/wishlist',
      'promos': '/account?tab=promos',
      'account': '/account',
    };

    const targetRoute = routes[tab];
    if (targetRoute && location !== targetRoute) {
      navigate(targetRoute);
    }
  }, [navigate, location]);

  // Получаем текущий tab из URL
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab') || 'shop';

  // Показываем правильный компонент в зависимости от tab
  switch (tab) {
    case 'orders':
    case 'promos':
      return <AccountPage />;
    case 'wishlist':
      return <WishlistPage />;
    case 'account':
      return <AccountPage />;
    default:
      return <Home />;
  }
}
