/**
 * Модуль для работы с аналитикой
 * Поддерживает Яндекс.Метрику и Google Analytics
 */

declare global {
  interface Window {
    ym?: (id: number, method: string, ...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// ID счетчиков (заполните после создания в кабинетах)
const YANDEX_METRIKA_ID = import.meta.env.VITE_YANDEX_METRIKA_ID || '';
const GOOGLE_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID || '';

/**
 * Инициализация Яндекс.Метрики
 */
export function initYandexMetrika() {
  if (!YANDEX_METRIKA_ID) {
    console.warn('Яндекс.Метрика: ID не указан');
    return;
  }

  // Скрипт Метрики
  (function(m: any, e: any, t: any, r: any, i: any, k: any, a: any) {
    m[i] = m[i] || function() { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = Date.now();
    k = e.createElement(t);
    a = e.getElementsByTagName(t)[0];
    k.async = true;
    k.src = r;
    if (a && a.parentNode) {
      a.parentNode.insertBefore(k, a);
    }
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym', null, null);

  window.ym?.(Number(YANDEX_METRIKA_ID), 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
    ecommerce: 'dataLayer', // Включаем ecommerce
  });

  console.log('✅ Яндекс.Метрика инициализирована');
}

/**
 * Инициализация Google Analytics
 */
export function initGoogleAnalytics() {
  if (!GOOGLE_ANALYTICS_ID) {
    console.warn('Google Analytics: ID не указан');
    return;
  }

  // Загружаем gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  document.head.appendChild(script);

  // Инициализируем dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { window.dataLayer?.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_ANALYTICS_ID);

  console.log('✅ Google Analytics инициализирован');
}

/**
 * Отслеживание просмотра страницы
 */
export function trackPageView(path: string, title: string) {
  // Яндекс.Метрика
  if (window.ym && YANDEX_METRIKA_ID) {
    window.ym(Number(YANDEX_METRIKA_ID), 'hit', path, { title });
  }

  // Google Analytics
  if (window.gtag && GOOGLE_ANALYTICS_ID) {
    window.gtag('config', GOOGLE_ANALYTICS_ID, {
      page_path: path,
      page_title: title,
    });
  }
}

/**
 * Отслеживание события
 */
export function trackEvent(category: string, action: string, label?: string, value?: number) {
  // Яндекс.Метрика
  if (window.ym && YANDEX_METRIKA_ID) {
    window.ym(Number(YANDEX_METRIKA_ID), 'reachGoal', action, { category, label, value });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

/**
 * E-commerce: просмотр товара
 */
export function trackProductView(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
  brand?: string;
}) {
  // Яндекс.Метрика Ecommerce
  if (window.ym && YANDEX_METRIKA_ID) {
    window.ym(Number(YANDEX_METRIKA_ID), 'ecommerce', {
      detail: {
        products: [{
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          brand: product.brand || 'Sweet Delights',
        }],
      },
    });
  }

  // Google Analytics Enhanced Ecommerce
  if (window.gtag) {
    window.gtag('event', 'view_item', {
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
        item_brand: product.brand || 'Sweet Delights',
      }],
    });
  }
}

/**
 * E-commerce: добавление в корзину
 */
export function trackAddToCart(product: {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}) {
  // Яндекс.Метрика
  if (window.ym && YANDEX_METRIKA_ID) {
    window.ym(Number(YANDEX_METRIKA_ID), 'ecommerce', {
      add: {
        products: [{
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          category: product.category,
        }],
      },
    });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
        item_category: product.category,
      }],
    });
  }

  // Также отправляем как обычное событие
  trackEvent('Ecommerce', 'add_to_cart', product.name, product.price * product.quantity);
}

/**
 * E-commerce: покупка
 */
export function trackPurchase(transaction: {
  id: string;
  revenue: number;
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }>;
}) {
  // Яндекс.Метрика
  if (window.ym && YANDEX_METRIKA_ID) {
    window.ym(Number(YANDEX_METRIKA_ID), 'ecommerce', {
      purchase: {
        actionField: {
          id: transaction.id,
          revenue: transaction.revenue,
        },
        products: transaction.products,
      },
    });
  }

  // Google Analytics
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transaction.id,
      value: transaction.revenue,
      currency: 'RUB',
      items: transaction.products.map(p => ({
        item_id: p.id,
        item_name: p.name,
        price: p.price,
        quantity: p.quantity,
        item_category: p.category,
      })),
    });
  }
}

/**
 * Инициализация всей аналитики
 */
export function initAnalytics() {
  initYandexMetrika();
  initGoogleAnalytics();
}
