const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

exports.handler = async (event) => {
  try {
    const orderData = JSON.parse(event.body || '{}');
    
    if (!orderData.userId || !orderData.items || !orderData.total) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: "Missing required order fields" }),
      };
    }

    const id = generateId();
    const order = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
      status: 'pending',
      
      // Данные доставки (поддержка СДЭК и других служб)
      deliveryService: orderData.deliveryService || null,
      deliveryType: orderData.deliveryType || null,
      deliveryStatus: orderData.deliveryStatus || (orderData.deliveryService ? 'PENDING' : null),
      
      // Адрес доставки (для курьерской доставки)
      deliveryAddress: orderData.deliveryAddress || null,
      deliveryCity: orderData.deliveryCity || null,
      deliveryPostalCode: orderData.deliveryPostalCode || null,
      deliveryRecipientName: orderData.deliveryRecipientName || null,
      deliveryRecipientPhone: orderData.deliveryRecipientPhone || null,
      
      // Данные пункта выдачи (для доставки в ПВЗ)
      deliveryPointCode: orderData.deliveryPointCode || null,
      deliveryPointName: orderData.deliveryPointName || null,
      deliveryPointAddress: orderData.deliveryPointAddress || null,
      
      // Данные СДЭК
      cdekOrderUuid: orderData.cdekOrderUuid || null,
      cdekOrderNumber: orderData.cdekOrderNumber || null,
      cdekTrackNumber: orderData.cdekTrackNumber || null,
      cdekTariffCode: orderData.cdekTariffCode || null,
      cdekDeliveryCost: orderData.cdekDeliveryCost || null,
      
      // Расчетная информация
      estimatedDeliveryDays: orderData.estimatedDeliveryDays || null,
      deliveryCalculatedAt: orderData.deliveryCalculatedAt || null,
    };

    // Сохраняем заказ в базу данных
    await docClient.send(new PutCommand({
      TableName: "orders",
      Item: order,
    }));

    console.log(`✅ Order created: ${id} (status: pending, awaiting payment)`);

    // Уменьшаем количество товаров на складе
    for (const item of orderData.items) {
      try {
        // Получаем текущий товар из базы данных
        const productResult = await docClient.send(new GetCommand({
          TableName: "products",
          Key: { id: item.productId }
        }));

        if (productResult.Item && productResult.Item.stock !== undefined) {
          // Уменьшаем stock на количество из заказа
          const newStock = Math.max(0, productResult.Item.stock - item.quantity);
          
          await docClient.send(new UpdateCommand({
            TableName: "products",
            Key: { id: item.productId },
            UpdateExpression: "SET stock = :newStock",
            ExpressionAttributeValues: {
              ":newStock": newStock
            }
          }));
          
          console.log(`Updated stock for product ${item.productId}: ${productResult.Item.stock} -> ${newStock}`);
        } else {
          console.warn(`Product ${item.productId} not found or has no stock field`);
        }
      } catch (error) {
        console.error(`Error updating stock for product ${item.productId}:`, error);
        // Продолжаем выполнение, даже если не удалось обновить stock одного товара
      }
    }

    // Начислить спины за заказ (1 спин за каждые 1000₽)
    const spinsToAdd = Math.floor(orderData.total / 1000);
    let actualSpinsAdded = 0;

    if (spinsToAdd > 0 && orderData.userEmail) {
      console.log(`Adding ${spinsToAdd} spins for order total ${orderData.total}₽`);
      
      try {
        // Получить email пользователя
        const userResult = await docClient.send(new GetCommand({
          TableName: "users",
          Key: { email: orderData.userEmail }
        }));

        if (userResult.Item) {
          // Обновить спины пользователя
          await docClient.send(new UpdateCommand({
            TableName: "users",
            Key: { email: orderData.userEmail },
            UpdateExpression: "SET spins = if_not_exists(spins, :zero) + :spinsToAdd, totalSpinsEarned = if_not_exists(totalSpinsEarned, :zero) + :spinsToAdd",
            ExpressionAttributeValues: {
              ":spinsToAdd": spinsToAdd,
              ":zero": 0
            }
          }));
          
          actualSpinsAdded = spinsToAdd;
          console.log(`Successfully added ${spinsToAdd} spins to user ${orderData.userEmail}`);
        } else {
          console.warn(`User not found: ${orderData.userEmail}`);
        }
      } catch (error) {
        console.error("Error adding spins:", error);
        // Не прерываем создание заказа, если начисление спинов не удалось
      }
    }

    // Если использован промокод рулетки, помечаем его как использованный
    if (orderData.promoCode) {
      try {
        // Промокод может быть строкой или объектом { code: "..." }
        const promoCodeStr = typeof orderData.promoCode === 'string' 
          ? orderData.promoCode 
          : orderData.promoCode?.code;
        
        if (promoCodeStr) {
          const wheelPrizesResult = await docClient.send(new ScanCommand({
            TableName: "wheelPrizes",
          }));
          
          const normalizedPromoCode = promoCodeStr.trim().toUpperCase();
          const wheelPrize = (wheelPrizesResult.Items || []).find(p => 
            p.promoCode && p.promoCode.trim().toUpperCase() === normalizedPromoCode
          );

          if (wheelPrize && !wheelPrize.used) {
            // Помечаем приз как использованный
            await docClient.send(new UpdateCommand({
              TableName: "wheelPrizes",
              Key: { id: wheelPrize.id },
              UpdateExpression: "SET used = :true, usedAt = :usedAt, orderId = :orderId",
              ExpressionAttributeValues: {
                ":true": true,
                ":usedAt": new Date().toISOString(),
                ":orderId": id
              }
            }));
            console.log(`Wheel prize ${wheelPrize.id} marked as used for order ${id}`);
          }
        }
      } catch (error) {
        console.error('Error marking wheel prize as used:', error);
        // Не прерываем выполнение, если не удалось пометить приз
      }
    }

    // ⚠️ ВАЖНО: Уведомления НЕ отправляются при создании заказа!
    // Email и Telegram будут отправлены ТОЛЬКО ПОСЛЕ успешной оплаты
    // из функции robokassa-callback после подтверждения платежа от Робокассы
    console.log('📧 Notifications will be sent AFTER payment confirmation');
    
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
        id, 
        orderId: id,
        spinsAdded: actualSpinsAdded 
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
