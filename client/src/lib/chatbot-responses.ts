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
  showWheelButton?: boolean;
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
    wheel: '🎲 Рулетка Sweet Delights - твой шанс выиграть крутые призы!\n\n💎 Как заработать кристаллы:\n• Каждый заказ дает кристаллы\n• Используй их для прокрутки рулетки\n\n🎁 Возможные призы:\n• Скидка 10%\n• Скидка 20% на товар\n• Бонусные баллы\n• Бесплатная доставка\n• Подарки и сюрпризы\n• И много еще интересного!\n\n⚡ Каждый приз можно использовать один раз, а действует определенное время.\n\nГотов крутить? Открой профиль → Рулетка! 🎲',
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
    wheel: [], // Нет товаров для информации о рулетке
    greeting: productCategoryMap.premium,
    default: ['chocolate', 'gift-box', 'candies'],
  };

  return categories[intent] || categories['default'];
}

export function generateBotResponse(userMessage: string, allProducts: Product[]): BotResponse {
  const intent = detectIntent(userMessage);
  const responseText = getResponseText(intent);
  const recommendedCategories = getRecommendedCategories(intent);

  // Если это про рулетку, показываем кнопку вместо товаров
  if (intent === 'wheel') {
    return {
      text: responseText,
      products: [],
      showWheelButton: true,
    };
  }

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
