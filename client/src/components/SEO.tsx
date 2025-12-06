import { useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '@/lib/analytics';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  currency?: string;
  availability?: 'instock' | 'outofstock' | 'preorder';
  canonical?: string;
  noindex?: boolean;
  structuredData?: object;
}

export default function SEO({
  title = 'Sweet Delights - Купить сладости онлайн | Необычные подарки',
  description = 'Купить сладости онлайн в Sweet Delights - необычные подарки и сладкие наслаждения! Мармелад, маршмелоу, моти, леденцы, шоколад, подарочные наборы. Заказать конфеты с доставкой по России.',
  keywords = 'купить сладости онлайн, заказать конфеты с доставкой, необычные подарки, необычные сладости, мармелад, маршмелоу, моти, леденцы, шоколад, подарочные наборы, печенье, пирожные, сладкие подарки, подарки со вкусом, интересные подарки, сладкие наслаждения',
  image = '/og-image.jpg',
  type = 'website',
  price,
  currency = 'RUB',
  availability,
  canonical,
  noindex = false,
  structuredData,
}: SEOProps) {
  const [location] = useLocation();
  const { siteName } = useSiteSettings();
  const siteUrl = 'https://sweetdelights.store';
  const fullUrl = canonical || `${siteUrl}${location}`;
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  
  // Ref для отслеживания последнего tracked location
  const lastTrackedLocation = useRef<string>(location);
  const hasTrackedInitial = useRef<boolean>(false);

  // Отдельный эффект для analytics - срабатывает только при изменении location
  useEffect(() => {
    document.title = title;
    
    // Отправляем analytics при первой загрузке или при изменении location
    const shouldTrack = !hasTrackedInitial.current || location !== lastTrackedLocation.current;
    
    if (shouldTrack) {
      hasTrackedInitial.current = true;
      lastTrackedLocation.current = location;
      
      const timeoutId = setTimeout(() => {
        trackPageView(location, title);
      }, 0);
      
      return () => clearTimeout(timeoutId);
    }
  }, [location, title]);

  // Эффект для обновления meta-тегов и structured data
  useEffect(() => {
    // Функция для установки или обновления meta-тега
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Основные meta-теги
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    
    // Robots meta
    if (noindex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }

    // Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', fullUrl);

    // Open Graph теги
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', fullImageUrl, true);
    setMetaTag('og:url', fullUrl, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:site_name', siteName, true);
    setMetaTag('og:locale', 'ru_RU', true);

    // Twitter Card теги
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', fullImageUrl);

    // Дополнительные Open Graph теги для товаров
    if (type === 'product' && price) {
      setMetaTag('product:price:amount', price.toString(), true);
      setMetaTag('product:price:currency', currency, true);
      if (availability) {
        setMetaTag('product:availability', availability, true);
      }
    }

    // Schema.org structured data (JSON-LD)
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [description, keywords, image, type, price, currency, availability, fullUrl, fullImageUrl, noindex, siteName, JSON.stringify(structuredData)]);

  return null;
}
