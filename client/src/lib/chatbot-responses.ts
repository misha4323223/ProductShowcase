// Утилита для генерации ответов чатбота

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface BotResponse {
  text: string;
  products: Product[];
}

// Категории товаров для разных намерений
const productCategoryMap = {
  romantic: ['chocolate', 'gift-box'], // Шоколад и подарочные наборы
  birthday: ['gift-box', 'candies', 'cookies-pastries'], // Наборы, конфеты, печенье
  budget: ['candies', 'napitki', 'marmalade'], // Конфеты, напитки, мармелад
  premium: ['chocolate', 'gift-box'], // Шоколад и премиум наборы
  noChocolate: ['cookies-pastries', 'candies', 'mochi-marshmallow', 'marmalade'], // Печенье, конфеты, моти, мармелад
};

// Ключевые слова для распознавания намерений
const keywords = {
  romantic: ['романтик', 'влюбл', 'свидан', 'люб', 'пара', 'любовь'],
  birthday: ['день рожден', 'дня рождения', 'день рож', 'рождение', 'праздник', 'праздн'],
  cheap: ['дешев', 'дешев', 'бюджет', 'бюджет', 'деньги', 'цена', 'не дорог'],
  premium: ['премиум', 'люкс', 'элит', 'дорог', 'фешен', 'особ', 'крутой'],
  noChocolate: ['без шокол', 'без какао', 'не люб шокол', 'кроме шокол'],
  wheel: ['рулетк', 'кристалл', 'приз', 'крути', 'колес', 'везени', 'удача', 'джекпот', 'скидк', 'бонус', 'подарок'],
  greeting: ['привет', 'здравств', 'привет', 'hi', 'hello', 'здрав', 'как дела'],
};

export function detectIntent(userMessage: string): string {
  const message = userMessage.toLowerCase();

  for (const [intent, keywordsList] of Object.entries(keywords)) {
    if (keywordsList.some(kw => message.includes(kw))) {
      return intent;
    }
  }

  return 'default';
}

export function getResponseText(intent: string): string {
  const responses: Record<string, string> = {
    romantic: '❤️ Рекомендую наши премиум сладости для романтичного вечера. Вот идеальные варианты:',
    birthday: '🎉 Отлично! Вот что я советую для праздника:',
    cheap: '💰 Ловко! Вот бюджетные, но вкусные варианты:',
    premium: '👑 Вот наша премиум коллекция:',
    noChocolate: '🍬 Вот сладости без шоколада:',
    wheel: '🎡 Крутая рулетка! Вот как это работает:\n\n💎 Кристаллы желаний - валюта везения! Их можно заработать:\n• +1 кристалл за каждые 100₽ потраченных в заказе\n• Например: заказ на 1000₽ = 10 кристаллов\n\n🎁 Что можно выиграть:\n• Скидка 10% на любой товар\n• Скидка 20% на выбранный товар\n• +200 бонусных баллов (считаются как 50% от суммы заказа)\n• Бесплатная доставка по России\n• Подарок от нас! 🎀\n• ДЖЕКПОТ! - супер приз! 🏆\n\n📅 Сроки активности:\n• Скидка 10%: 21 день\n• Скидка 20%: 21 день\n• Бонусы: 182 дня (≈6 месяцев)\n• Доставка: 60 дней\n• Подарок: 10 дней\n• Джекпот: 2 дня\n\n⚡ Каждый приз можно использовать ОДИН раз!\n\nГотов крутить? Зайди в свой профиль → Рулетка 🎲',
    greeting: '👋 Привет! Рад тебя видеть. Чем я могу помочь? Например: "Для романтики", "На день рождения", "Дешевые сладости" или "Расскажи о рулетке"',
    default: '😊 Интересно! Давай посмотрим, что я могу порекомендовать. Пока что вот наши популярные товары:',
  };

  return responses[intent] || responses['default'];
}

export function getRecommendedCategories(intent: string): string[] {
  const categories: Record<string, string[]> = {
    romantic: productCategoryMap.romantic,
    birthday: productCategoryMap.birthday,
    cheap: productCategoryMap.budget,
    premium: productCategoryMap.premium,
    noChocolate: productCategoryMap.noChocolate,
    wheel: ['chocolate', 'gift-box', 'candies'], // Показываем популярные товары вместе с информацией о рулетке
    greeting: productCategoryMap.premium,
    default: ['chocolate', 'gift-box', 'candies'],
  };

  return categories[intent] || categories['default'];
}

export function generateBotResponse(userMessage: string, allProducts: Product[]): BotResponse {
  const intent = detectIntent(userMessage);
  const responseText = getResponseText(intent);
  const recommendedCategories = getRecommendedCategories(intent);

  // Фильтруем товары по рекомендованным категориям
  const recommendedProducts = allProducts.filter(product =>
    recommendedCategories.includes(product.category)
  );

  // Если ничего не нашли, берём все товары
  const finalProducts = recommendedProducts.length > 0 
    ? recommendedProducts 
    : allProducts;

  return {
    text: responseText,
    products: finalProducts.slice(0, 4), // Максимум 4 товара
  };
}
