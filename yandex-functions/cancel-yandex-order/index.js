/**
 * Функция отмены заявки в Яндекс.Доставка
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
    const { claim_id, version } = requestData;

    if (!claim_id) {
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

    // Получаем информацию об условиях отмены
    const cancelInfoResponse = await yandexDelivery.getCancelInfo(claim_id);
    
    // Извлекаем cancel_state из ответа (может быть в разных местах)
    let cancelState = null;
    if (cancelInfoResponse.cancel_state) {
      cancelState = cancelInfoResponse.cancel_state;
    } else if (cancelInfoResponse.cancel_info && cancelInfoResponse.cancel_info.cancel_state) {
      cancelState = cancelInfoResponse.cancel_info.cancel_state;
    } else if (cancelInfoResponse.cancel_details && cancelInfoResponse.cancel_details.cancel_state) {
      cancelState = cancelInfoResponse.cancel_details.cancel_state;
    }
    
    // Проверяем, что есть cancel_state в ответе
    if (!cancelState) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Cannot cancel: no valid cancel_state available',
          cancelInfo: cancelInfoResponse
        }),
      };
    }

    // Если version не передан, получаем информацию о заявке
    let claimVersion = version;
    if (!claimVersion) {
      const claimInfo = await yandexDelivery.getClaimInfo(claim_id);
      claimVersion = claimInfo.version;
    }

    // Отменяем заявку с правильным cancel_state из cancelInfo
    const result = await yandexDelivery.cancelClaim(
      claim_id, 
      claimVersion, 
      cancelState
    );

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
        cancelInfo: cancelInfoResponse,
        data: result
      }),
    };

  } catch (error) {
    console.error('Error canceling Yandex Delivery claim:', error);
    
    // Sanitize error response
    const errorResponse = {
      error: error.message || 'Failed to cancel Yandex Delivery claim',
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
