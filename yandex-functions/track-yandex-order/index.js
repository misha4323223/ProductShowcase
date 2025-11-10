/**
 * Функция отслеживания заявки в Яндекс.Доставка
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

    // Получаем claim_id из query параметров или body
    let claimId;
    
    if (event.queryStringParameters && event.queryStringParameters.claim_id) {
      claimId = event.queryStringParameters.claim_id;
    } else if (event.body) {
      const requestData = JSON.parse(event.body);
      claimId = requestData.claim_id;
    }

    if (!claimId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'claim_id is required' 
        }),
      };
    }

    // Инициализируем клиент Яндекс.Доставки
    const yandexDelivery = new YandexDeliveryClient(token, platformStationId, isTest);

    // Получаем информацию о заявке
    const result = await yandexDelivery.getClaimInfo(claimId);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: result
      }),
    };

  } catch (error) {
    console.error('Error tracking Yandex Delivery claim:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to track Yandex Delivery claim',
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
