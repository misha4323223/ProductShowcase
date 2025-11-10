/**
 * СДЭК API Client
 * Универсальная библиотека для работы с СДЭК API v2.0
 * Работает одинаково для самозанятых и ИП - требуется только смена ключей
 */

const https = require('https');

class CdekClient {
  constructor(clientId, clientSecret, isTest = false) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.baseUrl = isTest 
      ? 'https://api.edu.cdek.ru/v2' 
      : 'https://api.cdek.ru/v2';
    this.token = null;
    this.tokenExpiry = null;
  }

  /**
   * Получить OAuth токен
   */
  async getToken() {
    // Проверяем, есть ли валидный токен
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    const data = await this._request('POST', '/oauth/token', params.toString(), {
      'Content-Type': 'application/x-www-form-urlencoded'
    });

    this.token = data.access_token;
    // Сохраняем время истечения (минус 5 минут для запаса)
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return this.token;
  }

  /**
   * Расчет стоимости доставки (один тариф)
   * Требует обязательный tariff_code
   * @param {Object} params - Параметры расчета с tariff_code
   * @returns {Promise<Object>} - Информация о тарифе
   */
  async calculateDelivery(params) {
    const token = await this.getToken();
    return this._request('POST', '/calculator/tariff', JSON.stringify(params), {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Расчет стоимости доставки (список всех доступных тарифов)
   * Используется когда tariff_code не указан
   * @param {Object} params - Параметры расчета без tariff_code
   * @returns {Promise<Array>} - Массив доступных тарифов
   */
  async calculateDeliveryList(params) {
    const token = await this.getToken();
    return this._request('POST', '/calculator/tarifflist', JSON.stringify(params), {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Получить список пунктов выдачи
   * @param {Object} filters - Фильтры поиска (city_code, postal_code и т.д.)
   * @returns {Promise<Array>} - Массив ПВЗ
   */
  async getDeliveryPoints(filters = {}) {
    const token = await this.getToken();
    const queryParams = new URLSearchParams(filters).toString();
    return this._request('GET', `/deliverypoints?${queryParams}`, null, {
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Создать заказ в СДЭК
   * @param {Object} orderData - Данные заказа
   * @returns {Promise<Object>} - Информация о созданном заказе
   */
  async createOrder(orderData) {
    const token = await this.getToken();
    return this._request('POST', '/orders', JSON.stringify(orderData), {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Получить информацию о заказе
   * @param {string} uuid - UUID заказа в СДЭК
   * @returns {Promise<Object>} - Информация о заказе
   */
  async getOrder(uuid) {
    const token = await this.getToken();
    return this._request('GET', `/orders/${uuid}`, null, {
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Вызов курьера
   * @param {Object} requestData - Данные заявки на курьера
   * @returns {Promise<Object>} - Информация о заявке
   */
  async createCourierCall(requestData) {
    const token = await this.getToken();
    return this._request('POST', '/intakes', JSON.stringify(requestData), {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Получить список регионов
   * @param {Object} filters - Фильтры (country_codes, region_code и т.д.)
   * @returns {Promise<Array>} - Массив регионов
   */
  async getRegions(filters = {}) {
    const token = await this.getToken();
    const queryParams = new URLSearchParams(filters).toString();
    return this._request('GET', `/location/regions?${queryParams}`, null, {
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Получить список городов
   * @param {Object} filters - Фильтры (country_codes, region_code, city и т.д.)
   * @returns {Promise<Array>} - Массив городов
   */
  async getCities(filters = {}) {
    const token = await this.getToken();
    const queryParams = new URLSearchParams(filters).toString();
    return this._request('GET', `/location/cities?${queryParams}`, null, {
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Базовый метод для HTTP запросов
   */
  _request(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: method,
        headers: headers
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              // Sanitize error response
              const errorResponse = {
                statusCode: res.statusCode,
                message: parsed.message || parsed.error || 'Request failed',
                code: parsed.code || null
              };
              
              // Include errors array if present
              if (parsed.errors && Array.isArray(parsed.errors)) {
                errorResponse.errors = parsed.errors.map(err => ({
                  code: err.code,
                  message: err.message
                }));
              }
              
              reject(errorResponse);
            }
          } catch (error) {
            reject({
              statusCode: res.statusCode,
              error: 'Failed to parse response',
              rawData: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (body) {
        req.write(body);
      }

      req.end();
    });
  }
}

module.exports = { CdekClient };
