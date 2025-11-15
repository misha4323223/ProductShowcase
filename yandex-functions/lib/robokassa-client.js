/**
 * Robokassa API Client
 * Клиент для работы с платежной системой Робокасса
 * 
 * Поддерживает:
 * - Генерацию ссылок на оплату
 * - Проверку подписей от Робокассы
 * - Работу с тестовым и продакшн режимами
 */

const crypto = require('crypto');

class RobokassaClient {
  constructor(merchantLogin, password1, password2, options = {}) {
    this.merchantLogin = merchantLogin;
    this.password1 = password1;
    this.password2 = password2;
    
    // Настройки
    this.isTest = options.isTest || false;
    this.hashAlgorithm = options.hashAlgorithm || 'sha256'; // md5, sha1, sha256, sha512
    
    // URL для оплаты
    this.paymentUrl = this.isTest 
      ? 'https://auth.robokassa.ru/Merchant/Index.aspx'
      : 'https://auth.robokassa.ru/Merchant/Index.aspx';
  }

  /**
   * Генерация подписи для инициализации платежа
   * Формула: MD5/SHA256(MerchantLogin:OutSum:InvId:Password1)
   * 
   * @param {number} outSum - Сумма платежа
   * @param {string} invId - ID заказа/счета
   * @param {object} additionalParams - Дополнительные параметры (опционально)
   * @returns {string} Подпись
   */
  generatePaymentSignature(outSum, invId, additionalParams = {}) {
    // Базовая строка для подписи
    let signatureString = `${this.merchantLogin}:${outSum}:${invId}:${this.password1}`;
    
    // Добавляем дополнительные параметры в алфавитном порядке
    const sortedParams = Object.keys(additionalParams)
      .filter(key => key.startsWith('Shp_') || key.startsWith('shp_'))
      .sort()
      .map(key => `${key}=${additionalParams[key]}`);
    
    if (sortedParams.length > 0) {
      signatureString += `:${sortedParams.join(':')}`;
    }
    
    return this._hash(signatureString);
  }

  /**
   * Проверка подписи от Робокассы (Result URL callback)
   * Формула: MD5/SHA256(OutSum:InvId:Password2)
   * 
   * @param {number} outSum - Сумма платежа
   * @param {string} invId - ID заказа
   * @param {string} signatureValue - Подпись от Робокассы
   * @param {object} additionalParams - Дополнительные параметры (опционально)
   * @returns {boolean} true если подпись валидна
   */
  verifyResultSignature(outSum, invId, signatureValue, additionalParams = {}) {
    // Базовая строка для проверки
    let checkString = `${outSum}:${invId}:${this.password2}`;
    
    // Добавляем дополнительные параметры в алфавитном порядке
    const sortedParams = Object.keys(additionalParams)
      .filter(key => key.startsWith('Shp_') || key.startsWith('shp_'))
      .sort()
      .map(key => `${key}=${additionalParams[key]}`);
    
    if (sortedParams.length > 0) {
      checkString += `:${sortedParams.join(':')}`;
    }
    
    const expectedSignature = this._hash(checkString);
    
    // Сравнение без учета регистра
    return signatureValue.toUpperCase() === expectedSignature.toUpperCase();
  }

  /**
   * Генерация URL для оплаты
   * 
   * @param {object} params - Параметры платежа
   * @param {number} params.outSum - Сумма платежа
   * @param {string} params.invId - ID заказа
   * @param {string} params.description - Описание платежа
   * @param {string} params.email - Email покупателя (опционально)
   * @param {string} params.culture - Язык интерфейса (ru, en) (опционально)
   * @param {object} params.additionalParams - Дополнительные параметры Shp_* (опционально)
   * @returns {string} URL для переадресации пользователя
   */
  generatePaymentUrl(params) {
    const {
      outSum,
      invId,
      description,
      email,
      culture = 'ru',
      additionalParams = {}
    } = params;

    // Генерируем подпись
    const signature = this.generatePaymentSignature(outSum, invId, additionalParams);

    // Формируем параметры URL
    const urlParams = new URLSearchParams({
      MerchantLogin: this.merchantLogin,
      OutSum: outSum.toString(),
      InvId: invId.toString(),
      Description: description,
      SignatureValue: signature,
      Culture: culture,
    });

    // Добавляем опциональные параметры
    if (email) {
      urlParams.append('Email', email);
    }

    if (this.isTest) {
      urlParams.append('IsTest', '1');
    }

    // Добавляем дополнительные параметры (Shp_*)
    Object.entries(additionalParams).forEach(([key, value]) => {
      urlParams.append(key, value);
    });

    return `${this.paymentUrl}?${urlParams.toString()}`;
  }

  /**
   * Парсинг callback данных от Робокассы
   * 
   * @param {object} callbackData - Данные из POST запроса
   * @returns {object} Распарсенные данные
   */
  parseCallback(callbackData) {
    const {
      OutSum,
      InvId,
      SignatureValue,
      Culture,
      ...customParams
    } = callbackData;

    // Извлекаем Shp_* параметры
    const additionalParams = {};
    Object.keys(customParams).forEach(key => {
      if (key.startsWith('Shp_') || key.startsWith('shp_')) {
        additionalParams[key] = customParams[key];
      }
    });

    return {
      outSum: parseFloat(OutSum),
      invId: InvId,
      signatureValue: SignatureValue,
      culture: Culture,
      additionalParams,
      isValid: this.verifyResultSignature(
        OutSum,
        InvId,
        SignatureValue,
        additionalParams
      )
    };
  }

  /**
   * Создание хеша строки
   * 
   * @param {string} str - Строка для хеширования
   * @returns {string} Хеш в uppercase
   * @private
   */
  _hash(str) {
    return crypto
      .createHash(this.hashAlgorithm)
      .update(str)
      .digest('hex')
      .toUpperCase();
  }

  /**
   * Генерация ответа для Result URL
   * Робокасса ожидает ответ формата: OK{InvId}
   * 
   * @param {string} invId - ID заказа
   * @returns {string} Строка ответа для Робокассы
   */
  generateResultResponse(invId) {
    return `OK${invId}`;
  }
}

module.exports = RobokassaClient;
