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

  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

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
      price: product.price.toFixed(2),
      priceCurrency: product.currency || 'RUB',
      availability: product.availability ? availabilityMap[product.availability] : availabilityMap.instock,
      priceValidUntil: priceValidUntil.toISOString().split('T')[0],
      url: typeof window !== 'undefined' ? window.location.href : 'https://sweetdelights.store',
      seller: {
        '@type': 'Organization',
        name: 'Sweet Delights',
      },
    },
    aggregateRating: product.rating && product.reviewCount ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
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

export function createFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
