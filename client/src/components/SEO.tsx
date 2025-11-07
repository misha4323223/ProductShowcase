import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { trackPageView } from '@/lib/analytics';

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
  title = 'Sweet Delights - Магазин сладостей и аксессуаров',
  description = 'Откройте для себя широкий ассортимент сладостей, шоколада, конфет и стильных аксессуаров. Доставка по всей России. Бесплатная примерка.',
  keywords = 'сладости, шоколад, конфеты, печенье, аксессуары, подарки, доставка сладостей',
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
  const siteUrl = 'https://sweetdelights.store';
  const fullUrl = canonical || `${siteUrl}${location}`;
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  // Отдельный эффект для analytics - срабатывает только при изменении location/title
  useEffect(() => {
    document.title = title;
    
    const timeoutId = setTimeout(() => {
      trackPageView(location, title);
    }, 0);
    
    return () => clearTimeout(timeoutId);
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
    setMetaTag('og:site_name', 'Sweet Delights', true);
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
  }, [description, keywords, image, type, price, currency, availability, fullUrl, fullImageUrl, noindex, JSON.stringify(structuredData)]);

  return null;
}

// Хелперы для создания структурированных данных Schema.org

export function createProductSchema(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: 'instock' | 'outofstock' | 'preorder';
  rating?: number;
  reviewCount?: number;
  brand?: string;
  sku?: string;
}) {
  const availabilityMap = {
    instock: 'https://schema.org/InStock',
    outofstock: 'https://schema.org/OutOfStock',
    preorder: 'https://schema.org/PreOrder',
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: product.brand ? {
      '@type': 'Brand',
      name: product.brand,
    } : undefined,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency || 'RUB',
      availability: product.availability ? availabilityMap[product.availability] : availabilityMap.instock,
      url: window.location.href,
    },
    aggregateRating: product.rating && product.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    } : undefined,
  };
}

export function createBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Sweet Delights',
    url: 'https://sweetdelights.store',
    logo: 'https://sweetdelights.store/logo.png',
    description: 'Магазин сладостей и аксессуаров с доставкой по всей России',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'info@sweetdelights.store',
    },
    sameAs: [
      // Добавьте ссылки на соцсети когда будут
    ],
  };
}

export function createWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sweet Delights',
    url: 'https://sweetdelights.store',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://sweetdelights.store/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}
