/**
 * Функция создания заказа в СДЭК
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

    // Парсим данные запроса
    const orderData = JSON.parse(event.body || '{}');
    
    // Валидация обязательных полей
    const {
      type,
      number,
      tariff_code,
      recipient,
      from_location,
      to_location,
      packages
    } = orderData;

    // Проверка основных полей
    if (!type || !number || !tariff_code || !recipient || !packages) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: type, number, tariff_code, recipient, packages' 
        }),
      };
    }

    // Проверка packages
    if (!Array.isArray(packages) || packages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'packages must be a non-empty array' 
        }),
      };
    }

    // Проверка каждого package
    for (const pkg of packages) {
      if (!pkg.number || !pkg.weight) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            error: 'Each package must have number and weight' 
          }),
        };
      }
    }

    // Проверка from_location или to_location
    if (!from_location && !to_location) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'At least one of from_location or to_location is required' 
        }),
      };
    }

    // Инициализируем клиент СДЭК
    const cdek = new CdekClient(clientId, clientSecret, isTest);

    // Создаем заказ в СДЭК
    const result = await cdek.createOrder(orderData);

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
    console.error('Error creating CDEK order:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to create CDEK order',
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
