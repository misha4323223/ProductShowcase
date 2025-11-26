/**
 * Функция поиска городов СДЭК
 */

const https = require('https');

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Ошибка запроса: ${err.message}`);
      reject(err);
    });
    
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function getCdekToken(clientId, clientSecret, isTest) {
  const baseUrl = isTest 
    ? 'https://api.edu.cdek.ru/v2'
    : 'https://api.cdek.ru/v2';

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  }).toString();

  try {
    const response = await makeRequest(
      `${baseUrl}/oauth/token?${params}`,
      'POST',
      null,
      { 'Content-Type': 'application/x-www-form-urlencoded' }
    );

    if (response.access_token) {
      return response.access_token;
    } else {
      throw new Error('No access_token in response');
    }
  } catch (error) {
    console.error(`❌ Ошибка получения токена: ${error.message}`);
    throw error;
  }
}

async function getAllCdekCities(baseUrl, token) {
  let allCities = [];
  let offset = 0;
  let pageSize = 1000; // CDEK может вернуть до 1000 за раз
  let totalLoaded = 0;

  console.log(`\n📥 НАЧИНАЮ ЗАГРУЗКУ ВСЕХ ГОРОДОВ CDEK...`);
  console.log(`📄 Размер страницы: ${pageSize}`);

  while (true) {
    try {
      // Пробуем разные варианты пагинации
      let url = `${baseUrl}/location/cities?offset=${offset}&limit=${pageSize}`;
      console.log(`\n📌 Запрос: offset=${offset}, limit=${pageSize}`);
      console.log(`   URL: ${url}`);
      
      const response = await makeRequest(
        url,
        'GET',
        null,
        { 'Authorization': `Bearer ${token}` }
      );

      console.log(`📨 Структура ответа:`, Object.keys(response));
      
      let citiesPage = [];
      
      // Пробуем разные ключи где могут быть города
      if (Array.isArray(response)) {
        console.log(`   ✓ Ответ - это массив`);
        citiesPage = response;
      } else if (response.data && Array.isArray(response.data)) {
        console.log(`   ✓ Ответ в response.data (${response.data.length} городов)`);
        citiesPage = response.data;
      } else if (response.citiesList && Array.isArray(response.citiesList)) {
        console.log(`   ✓ Ответ в response.citiesList (${response.citiesList.length} городов)`);
        citiesPage = response.citiesList;
      } else if (response.cities && Array.isArray(response.cities)) {
        console.log(`   ✓ Ответ в response.cities (${response.cities.length} городов)`);
        citiesPage = response.cities;
      }

      if (!citiesPage || citiesPage.length === 0) {
        console.log(`\n✅ ЗАГРУЗКА ЗАВЕРШЕНА!`);
        console.log(`   Всего загружено городов: ${totalLoaded}`);
        console.log(`   Попыток загрузки: ${offset / pageSize}`);
        break;
      }

      console.log(`   ✓ Загружено ${citiesPage.length} городов на этой странице`);
      totalLoaded += citiesPage.length;
      console.log(`   Всего загружено: ${totalLoaded}`);
      
      allCities = allCities.concat(citiesPage);
      
      // Если получили меньше чем запросили - это последняя страница
      if (citiesPage.length < pageSize) {
        console.log(`\n✅ ЗАГРУЗКА ЗАВЕРШЕНА! (получено меньше чем запросили)`);
        console.log(`   ИТОГО ГОРОДОВ: ${totalLoaded}`);
        break;
      }
      
      offset += pageSize;
      
    } catch (error) {
      console.error(`\n⚠️ Ошибка на offset=${offset}: ${error.message}`);
      break;
    }
  }

  console.log(`\n🏙️ ФИНАЛЬНЫЙ РЕЗУЛЬТАТ: ${allCities.length} городов загружено`);
  return allCities;
}

exports.handler = async (event) => {
  try {
    const clientId = process.env.CDEK_CLIENT_ID;
    const clientSecret = process.env.CDEK_CLIENT_SECRET;
    const isTest = process.env.CDEK_TEST_MODE === 'true';

    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'CDEK API credentials not configured' }),
      };
    }

    let query = '';
    
    if (event.queryStringParameters?.q) {
      query = event.queryStringParameters.q;
    } else if (event.multiValueQueryStringParameters?.q?.[0]) {
      query = event.multiValueQueryStringParameters.q[0];
    } else if (event.rawQueryString) {
      const params = new URLSearchParams(event.rawQueryString);
      query = params.get('q') || '';
    }

    query = query.trim();
    console.log(`🔍 Поисковый запрос: "${query}"`);

    if (query.length < 2) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Search query must be at least 2 characters' }),
      };
    }

    const baseUrl = isTest ? 'https://api.edu.cdek.ru/v2' : 'https://api.cdek.ru/v2';
    
    const token = await getCdekToken(clientId, clientSecret, isTest);
    console.log(`🔑 Получен токен CDEK`);

    // Загружаем ВСЕ города с пагинацией
    const citiesData = await getAllCdekCities(baseUrl, token);
    
    console.log(`\n📊 ИТОГО В СИСТЕМЕ: ${citiesData.length} городов`);

    // Фильтруем по поисковому запросу
    const searchLower = query.toLowerCase();
    const filtered = citiesData
      .filter(city => {
        const cityName = (city.city || city.name || '').toLowerCase();
        return cityName.includes(searchLower);
      })
      .slice(0, 50)
      .map(city => ({
        code: city.city_code || city.code,
        name: city.city || city.name,
        region: city.region
      }));

    // ЛОГИРОВАНИЕ: если не найдено, показываем ВСЕ похожие города
    if (filtered.length === 0 && query.length >= 2) {
      console.log(`\n🔴 НЕ НАЙДЕНО ТОЧНОЕ СОВПАДЕНИЕ: "${query}"`);
      console.log(`📍 Ищу ВСЕ города в CDEK которые содержат этот текст...`);
      
      // Показываем города которые содержат первые 3 буквы
      const partialMatches = citiesData
        .filter(city => {
          const cityName = (city.city || city.name || '').toLowerCase();
          return cityName.includes(searchLower.substring(0, 3));
        });
      
      if (partialMatches.length > 0) {
        console.log(`\n✅ НАЙДЕНО ${partialMatches.length} городов которые начинаются с "${searchLower.substring(0, 3)}":`);
        partialMatches.slice(0, 50).forEach((city, idx) => {
          const name = city.city || city.name || 'UNKNOWN';
          const code = city.city_code || city.code || 'NO_CODE';
          const region = city.region || 'UNKNOWN_REGION';
          console.log(`   [${idx + 1}] ${name} (код: ${code}) - ${region}`);
        });
        if (partialMatches.length > 50) {
          console.log(`   ... и ещё ${partialMatches.length - 50} городов`);
        }
      } else {
        console.log(`❌ Городов с таким началом не найдено в CDEK`);
      }
    }

    console.log(`✅ Найдено: ${filtered.length} городов по запросу "${query}"`);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        data: filtered
      }),
    };

  } catch (error) {
    console.error(`💥 Ошибка: ${error.message}`);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
