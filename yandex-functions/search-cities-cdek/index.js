/**
 * Функция поиска городов СДЭК
 * Ищет города по названию и возвращает city_code для использования в других функциях
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

    // Получаем поисковый запрос из параметров
    const query = event.queryStringParameters?.q || '';

    if (!query || query.trim().length < 2) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Search query must be at least 2 characters' 
        }),
      };
    }

    // Инициализируем клиент СДЭК
    const cdek = new CdekClient(clientId, clientSecret, isTest);

    // Получаем список всех городов и фильтруем по поисковому запросу
    // Примечание: CDEK API не имеет эндпоинта для поиска городов,
    // поэтому мы используем фиксированный список популярных городов
    // и фильтруем его клиентской стороной
    
    // Получаем токен для авторизации
    const token = await cdek.getToken();
    
    // CDEK API не имеет специального эндпоинта для поиска городов,
    // но у нас есть endpoint /location/cities для получения списка городов
    const citiesData = await cdek._request('GET', '/location/cities', null, {
      'Authorization': `Bearer ${token}`
    });

    // Фильтруем города по поисковому запросу (регистронезависимый поиск)
    const searchLower = query.toLowerCase();
    const filteredCities = Array.isArray(citiesData) 
      ? citiesData.filter(city => 
          city.city && city.city.toLowerCase().includes(searchLower)
        )
      : [];

    // Форматируем результаты
    const results = filteredCities.slice(0, 50).map(city => ({
      code: city.city_code,
      name: city.city,
      region: city.region
    }));

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
        data: results
      }),
    };

  } catch (error) {
    console.error('Error searching CDEK cities:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to search cities',
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
