/**
 * Функция получения списка пунктов выдачи СДЭК
 * Работает одинаково для самозанятых и ИП
 */

const { CdekClient } = require('../lib/cdek-client');

exports.handler = async (event) => {
  try {
    // Получаем параметры из переменных окружения
    const clientId = process.env.CDEK_CLIENT_ID;
    const clientSecret = process.env.CDEK_CLIENT_SECRET;
    const isTest = process.env.CDEK_TEST_MODE === 'true';

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'CDEK API credentials not configured' 
        }),
      };
    }

    // Парсим query параметры
    const queryParams = event.queryStringParameters || {};
    
    // Инициализируем клиент СДЭК
    const cdek = new CdekClient(clientId, clientSecret, isTest);

    // Получаем список ПВЗ
    const deliveryPoints = await cdek.getDeliveryPoints(queryParams);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        data: deliveryPoints
      }),
    };

  } catch (error) {
    console.error('Error getting CDEK delivery points:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to get delivery points',
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
