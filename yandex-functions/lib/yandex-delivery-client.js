/**
 * Яндекс.Доставка API Client
 * Универсальная библиотека для работы с Яндекс.Доставка API
 * Работает одинаково для самозанятых и ИП - требуется только смена токена
 */

const https = require('https');

class YandexDeliveryClient {
  constructor(token, platformStationId, isTest = false) {
    this.token = token;
    this.platformStationId = platformStationId;
    this.baseUrl = isTest 
      ? 'https://b2b.taxi.tst.yandex.net' 
      : 'https://b2b.taxi.yandex.net';
  }

  /**
   * Оценка стоимости доставки
   * @param {Object} params - Параметры расчета
   * @param {Array} params.items - Товары для доставки
   * @param {Array} params.route_points - Маршрутные точки (откуда и куда)
   * @returns {Promise<Object>} - Информация о стоимости и сроках доставки
   */
  async calculateDelivery(params) {
    return this._request('POST', '/api/b2b/platform/offers/create', params);
  }

  /**
   * Создать заявку на доставку
   * @param {Object} claimData - Данные заявки
   * @param {Array} claimData.items - Товары
   * @param {Array} claimData.route_points - Маршрут
   * @param {Object} claimData.client_requirements - Требования клиента
   * @returns {Promise<Object>} - Информация о созданной заявке
   */
  async createClaim(claimData) {
    return this._request('POST', '/api/b2b/platform/claims/create', claimData);
  }

  /**
   * Получить информацию о заявке
   * @param {string} claimId - ID заявки
   * @returns {Promise<Object>} - Информация о заявке
   */
  async getClaimInfo(claimId) {
    return this._request('POST', '/api/b2b/platform/claims/info', {
      claim_id: claimId
    });
  }

  /**
   * Получить условия отмены заявки
   * @param {string} claimId - ID заявки
   * @returns {Promise<Object>} - Условия отмены (штрафы и т.д.)
   */
  async getCancelInfo(claimId) {
    return this._request('POST', '/api/b2b/platform/claims/cancel-info', {
      claim_id: claimId
    });
  }

  /**
   * Отменить заявку
   * @param {string} claimId - ID заявки
   * @param {number} version - Версия заявки (из claims/info)
   * @param {string} cancel_state - Токен отмены из cancel-info ("free", "paid" и т.д.)
   * @returns {Promise<Object>} - Результат отмены
   */
  async cancelClaim(claimId, version, cancel_state) {
    if (!cancel_state || typeof cancel_state !== 'string') {
      throw new Error('cancel_state must be a valid string from cancel-info response');
    }
    
    return this._request('POST', '/api/b2b/platform/claims/cancel', {
      claim_id: claimId,
      version: version,
      cancel_state: cancel_state
    });
  }

  /**
   * Принять заявку (подтверждение создания)
   * @param {string} claimId - ID заявки
   * @param {number} version - Версия заявки
   * @returns {Promise<Object>} - Результат принятия
   */
  async acceptClaim(claimId, version) {
    return this._request('POST', '/api/b2b/platform/claims/accept', {
      claim_id: claimId,
      version: version
    });
  }

  /**
   * Получить журнал заявок
   * @param {Object} filters - Фильтры (cursor, limit и т.д.)
   * @returns {Promise<Object>} - Список заявок
   */
  async getClaimsJournal(filters = {}) {
    return this._request('POST', '/api/b2b/platform/claims/journal', filters);
  }

  /**
   * Поиск заявок
   * @param {Object} searchParams - Параметры поиска
   * @returns {Promise<Object>} - Результаты поиска
   */
  async searchClaims(searchParams) {
    return this._request('POST', '/api/b2b/platform/claims/search', searchParams);
  }

  /**
   * Получить точки интеграции (pickup points для доставки в другой день)
   * @returns {Promise<Array>} - Список точек
   */
  async getIntegrationPoints() {
    return this._request('GET', '/api/b2b/platform/integration-points');
  }

  /**
   * Геокодирование адреса (преобразование адреса в координаты)
   * @param {string} address - Адрес
   * @returns {Promise<Object>} - Координаты и детали адреса
   */
  async geocodeAddress(address) {
    // Используем Yandex Geocoder API
    return new Promise((resolve, reject) => {
      const url = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(address)}`;
      
      https.get(url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            const geoObject = result.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
            
            if (geoObject) {
              const [longitude, latitude] = geoObject.Point.pos.split(' ').map(Number);
              resolve({
                coordinates: [longitude, latitude],
                fullAddress: geoObject.metaDataProperty.GeocoderMetaData.text,
                country: geoObject.metaDataProperty.GeocoderMetaData.Address.country_code,
                city: geoObject.metaDataProperty.GeocoderMetaData.Address.Components.find(c => c.kind === 'locality')?.name
              });
            } else {
              reject(new Error('Address not found'));
            }
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', reject);
    });
  }

  /**
   * Базовый метод для HTTP запросов
   */
  _request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl + path);
      
      const headers = {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        'Accept-Language': 'ru'
      };

      // Добавляем platform_station_id для агрегаторных запросов
      if (this.platformStationId && (path.includes('/offers/') || path.includes('/claims/'))) {
        headers['X-B2B-Client-Storage'] = JSON.stringify({
          platform_station_id: this.platformStationId
        });
      }

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
                errorResponse.errors = parsed.errors;
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

      if (body && method !== 'GET') {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }
}

module.exports = { YandexDeliveryClient };
