const crypto = require('crypto');

/**
 * Генерация уникального промокода на основе типа приза
 * @param {string} prizeType - тип приза (discount_10, discount_20, points, delivery, free_item, jackpot)
 * @returns {string} - промокод
 */
function generatePromoCode(prizeType) {
  const prefix = {
    'discount_10': 'WISH10',
    'discount_20': 'RAND20',
    'jackpot': 'JACKPOT40',
    'free_item': 'FREE',
    'delivery': 'SHIP',
    'points': 'PTS'
  }[prizeType] || 'PRIZE';
  
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

/**
 * Получение списка доступных призов на основе текущего количества спинов
 * Прогрессивная система: больше спинов = доступ к лучшим призам
 * @param {number} currentSpins - текущее количество спинов у пользователя
 * @returns {Array<string>} - массив доступных типов призов
 */
function getAvailablePrizes(currentSpins) {
  // Защита от невалидных значений
  if (!currentSpins || currentSpins < 1 || typeof currentSpins !== 'number') {
    // Если спинов нет или значение невалидно, возвращаем минимальный уровень
    return ['discount_10'];
  }
  
  // Клампинг к целому числу и разумному максимуму
  const spins = Math.floor(Math.min(Math.max(currentSpins, 1), 9999));
  
  // Уровень 1: 1 спин
  if (spins === 1) {
    return ['discount_10'];
  }
  
  // Уровень 2: 2 спина
  if (spins === 2) {
    return ['discount_10', 'discount_20'];
  }
  
  // Уровень 3: 3 спина
  if (spins === 3) {
    return ['discount_10', 'discount_20', 'points'];
  }
  
  // Уровень 4: 4 спина
  if (spins === 4) {
    return ['discount_10', 'discount_20', 'points', 'delivery'];
  }
  
  // Уровень 5: 5 спинов
  if (spins === 5) {
    return ['discount_10', 'discount_20', 'points', 'delivery', 'free_item'];
  }
  
  // Уровень 6: 6+ спинов - доступны ВСЕ призы, включая джекпот
  return ['discount_10', 'discount_20', 'points', 'delivery', 'free_item', 'jackpot'];
}

/**
 * Определение приза по случайному числу с учетом доступных призов
 * Оригинальные веса призов:
 * - discount_10: 30%
 * - discount_20: 25%
 * - points: 20%
 * - delivery: 15%
 * - free_item: 8%
 * - jackpot: 2%
 * 
 * Функция автоматически ренормализует вероятности на основе доступных призов
 * @param {number} randomValue - случайное число (0-100)
 * @param {number} currentSpins - текущее количество спинов у пользователя
 * @returns {string} - тип выигранного приза
 */
function determinePrize(randomValue, currentSpins) {
  // Получаем список доступных призов на основе уровня пользователя
  const availablePrizes = getAvailablePrizes(currentSpins);
  
  // Оригинальные веса призов
  const prizeWeights = {
    'discount_10': 30,
    'discount_20': 25,
    'points': 20,
    'delivery': 15,
    'free_item': 8,
    'jackpot': 2
  };
  
  // Фильтруем только доступные призы и их веса
  const availableWeights = {};
  let totalWeight = 0;
  
  for (const prize of availablePrizes) {
    availableWeights[prize] = prizeWeights[prize];
    totalWeight += prizeWeights[prize];
  }
  
  // Ренормализуем случайное значение под общий вес доступных призов
  const normalizedRandom = (randomValue / 100) * totalWeight;
  
  // Определяем приз на основе ренормализованных вероятностей
  let cumulative = 0;
  for (const prize of availablePrizes) {
    cumulative += availableWeights[prize];
    if (normalizedRandom < cumulative) {
      return prize;
    }
  }
  
  // Fallback на последний доступный приз (не должно произойти)
  return availablePrizes[availablePrizes.length - 1];
}

/**
 * Расчет даты истечения приза
 * @param {string} prizeType - тип приза
 * @returns {string} - дата в формате ISO
 */
function calculateExpiryDate(prizeType) {
  const now = new Date();
  const daysToAdd = {
    'discount_10': 14,    // 14 дней
    'discount_20': 21,    // 21 день
    'points': 365,        // 12 месяцев
    'delivery': 60,       // 60 дней
    'free_item': 10,      // 10 дней
    'jackpot': 2          // 48 часов
  }[prizeType] || 7;
  
  now.setDate(now.getDate() + daysToAdd);
  return now.toISOString();
}

/**
 * Генерация криптографически безопасного случайного числа (0-100)
 * @returns {number} - случайное число от 0 до 100
 */
function getSecureRandom() {
  const buffer = crypto.randomBytes(4);
  const value = buffer.readUInt32BE(0);
  return (value / 0xFFFFFFFF) * 100;
}

/**
 * Генерация уникального ID для приза или записи истории
 * @returns {string} - уникальный ID
 */
function generatePrizeId() {
  return Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
}

/**
 * Получение названия приза для отображения
 * @param {string} prizeType - тип приза
 * @returns {string} - название для отображения
 */
function getPrizeDisplayName(prizeType) {
  const names = {
    'discount_10': 'Скидка 10% на весь заказ',
    'discount_20': 'Скидка 20% на товар',
    'points': '+200 баллов',
    'delivery': 'Бесплатная доставка',
    'free_item': 'Бесплатный товар',
    'jackpot': 'ДЖЕКПОТ! -40% на весь заказ'
  };
  return names[prizeType] || prizeType;
}

/**
 * Расчет количества спинов на основе суммы заказа
 * Формула: 1 спин за каждые 1000₽
 * @param {number} orderTotal - общая сумма заказа
 * @returns {number} - количество заработанных спинов
 */
function calculateSpinsFromOrder(orderTotal) {
  if (!orderTotal || orderTotal < 1000) {
    return 0;
  }
  return Math.floor(orderTotal / 1000);
}

module.exports = {
  generatePromoCode,
  determinePrize,
  getAvailablePrizes,
  calculateExpiryDate,
  getSecureRandom,
  generatePrizeId,
  getPrizeDisplayName,
  calculateSpinsFromOrder
};
