const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { productId, productName, email } = body;

    if (!productId || !productName || !email) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "productId, productName, and email are required" }),
      };
    }

    // Проверяем дубликаты
    const result = await docClient.send(new ScanCommand({
      TableName: "stockNotifications",
    }));

    const existing = (result.Items || []).find(
      item => item.productId === productId && item.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Вы уже подписаны на уведомления об этом товаре" }),
      };
    }

    const id = generateId();
    await docClient.send(new PutCommand({
      TableName: "stockNotifications",
      Item: {
        id,
        productId,
        productName,
        email: email.toLowerCase(),
        createdAt: new Date().toISOString(),
        notified: false,
      },
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, id }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
