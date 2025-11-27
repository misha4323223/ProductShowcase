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

// Примеры категоризации товаров
const productCategories = {
  romantic: ['Трюфели премиум', 'Бельгийский шоколад ассорти'],
  birthday: ['Трюфели премиум', 'Французские макаронс', 'Жевательные мармеладки'],
  budget: ['Жевательные мармеладки', 'Леденцы ручной работы', 'Печенье с шоколадной крошкой'],
  premium: ['Трюфели премиум', 'Бельгийский шоколад ассорти', 'Французские макаронс'],
  noChocolate: ['Жевательные мармеладки', 'Леденцы ручной работы', 'Французские макаронс'],
};

// Ключевые слова для распознавания намерений
const keywords = {
  romantic: ['романтик', 'влюбл', 'свидан', 'люб', 'пара', 'любовь'],
  birthday: ['день рожден', 'дня рождения', 'день рож', 'рождение', 'праздник', 'праздн'],
  cheap: ['дешев', 'дешев', 'бюджет', 'бюджет', 'деньги', 'цена', 'не дорог'],
  premium: ['премиум', 'люкс', 'элит', 'дорог', 'фешен', 'особ', 'крутой'],
  noChocolate: ['без шокол', 'без какао', 'не люб шокол', 'кроме шокол'],
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
    greeting: '👋 Привет! Рад тебя видеть. Чем я могу помочь? Например: "Для романтики", "На день рождения" или "Дешевые сладости"',
    default: '😊 Интересно! Давай посмотрим, что я могу порекомендовать. Пока что вот наши популярные товары:',
  };

  return responses[intent] || responses['default'];
}

export function getRecommendedProductNames(intent: string): string[] {
  const categories: Record<string, string[]> = {
    romantic: productCategories.romantic,
    birthday: productCategories.birthday,
    cheap: productCategories.budget,
    premium: productCategories.premium,
    noChocolate: productCategories.noChocolate,
    greeting: productCategories.premium,
    default: ['Трюфели премиум', 'Бельгийский шоколад ассорти', 'Французские макаронс'],
  };

  return categories[intent] || categories['default'];
}

export function generateBotResponse(userMessage: string, allProducts: Product[]): BotResponse {
  const intent = detectIntent(userMessage);
  const responseText = getResponseText(intent);
  const recommendedNames = getRecommendedProductNames(intent);

  // Фильтруем товары по рекомендованным названиям
  const recommendedProducts = allProducts.filter(product =>
    recommendedNames.some(name => product.name.includes(name) || name.includes(product.name))
  );

  return {
    text: responseText,
    products: recommendedProducts.slice(0, 4), // Максимум 4 товара
  };
}
