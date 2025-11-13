/**
 * Функция расчета стоимости доставки СДЭК
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
    const requestData = JSON.parse(event.body || '{}');
    const { 
      from_location, 
      to_location, 
      packages,
      tariff_code 
    } = requestData;

    // Валидация
    if (!to_location || !packages || packages.length === 0) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Missing required fields: to_location, packages' 
        }),
      };
    }

    // Инициализируем клиент СДЭК
    const cdek = new CdekClient(clientId, clientSecret, isTest);

    // Формируем запрос для расчета
    const calculationParams = {
      currency: 1, // RUB
      from_location: from_location || { code: 1959 }, // По умолчанию г. Донской, Тульская область
      to_location,
      packages
    };

    // Выбираем правильный метод API в зависимости от наличия tariff_code
    let result;
    if (tariff_code) {
      // Расчет конкретного тарифа (требует tariff_code)
      calculationParams.tariff_code = tariff_code;
      result = await cdek.calculateDelivery(calculationParams);
    } else {
      // Получение списка всех доступных тарифов
      calculationParams.type = 1; // 1 - склад-склад
      result = await cdek.calculateDeliveryList(calculationParams);
    }

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
    console.error('Error calculating CDEK delivery:', error);
    
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
