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
 * Определение приза по случайному числу (0-100)
 * Распределение шансов:
 * - 0-30: discount_10 (30%)
 * - 30-55: discount_20 (25%)
 * - 55-75: points (20%)
 * - 75-90: delivery (15%)
 * - 90-98: free_item (8%)
 * - 98-100: jackpot (2%)
 */
function determinePrize(randomValue) {
  if (randomValue < 30) return 'discount_10';
  if (randomValue < 55) return 'discount_20';
  if (randomValue < 75) return 'points';
  if (randomValue < 90) return 'delivery';
  if (randomValue < 98) return 'free_item';
  return 'jackpot';
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
    'discount_10': 'Скидка 10% на выбор',
    'discount_20': 'Скидка 20% на товар',
    'points': '+200 баллов',
    'delivery': 'Бесплатная доставка',
    'free_item': 'Бесплатный товар',
    'jackpot': 'ДЖЕКПОТ! -40% на весь вишлист'
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
  calculateExpiryDate,
  getSecureRandom,
  generatePrizeId,
  getPrizeDisplayName,
  calculateSpinsFromOrder
};
