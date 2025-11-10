/**
 * Функция расчета стоимости доставки Яндекс.Доставка
 * Работает одинаково для самозанятых и ИП
 */

const { YandexDeliveryClient } = require('../lib/yandex-delivery-client');

exports.handler = async (event) => {
  try {
    // Получаем параметры из переменных окружения
    const token = process.env.YANDEX_DELIVERY_TOKEN;
    const platformStationId = process.env.YANDEX_PLATFORM_STATION_ID;
    const isTest = process.env.YANDEX_DELIVERY_TEST_MODE === 'true';

    if (!token) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Yandex Delivery API token not configured' 
        }),
      };
    }

    // Парсим данные запроса
    const requestData = JSON.parse(event.body || '{}');
    const { 
      items,
      route_points,
      client_requirements
    } = requestData;

    // Валидация
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing or invalid items array' 
        }),
      };
    }

    if (!route_points || !Array.isArray(route_points) || route_points.length < 2) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'route_points must contain at least 2 points (source and destination)' 
        }),
      };
    }

    // Инициализируем клиент Яндекс.Доставки
    const yandexDelivery = new YandexDeliveryClient(token, platformStationId, isTest);

    // Формируем запрос для расчета
    const calculationParams = {
      items,
      route_points,
      requirements: client_requirements || {}
    };

    // Получаем расчет стоимости
    const result = await yandexDelivery.calculateDelivery(calculationParams);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: result
      }),
    };

  } catch (error) {
    console.error('Error calculating Yandex Delivery cost:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to calculate delivery cost',
      statusCode: error.statusCode,
      code: error.code
    };
    
    if (error.errors) {
      errorResponse.errors = error.errors;
    }
    
    return {
      statusCode: error.statusCode || 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorResponse),
    };
  }
};
