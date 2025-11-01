const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");

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

exports.handler = async (event) => {
  try {
    // 🔍 ПОЛНОЕ ЛОГИРОВАНИЕ ДЛЯ ДИАГНОСТИКИ
    console.log('=== FULL EVENT OBJECT ===');
    console.log(JSON.stringify(event, null, 2));
    console.log('=========================');
    
    console.log('event.pathParams:', event.pathParams);
    console.log('event.pathParameters:', event.pathParameters);
    console.log('event.params:', event.params);
    console.log('event.requestContext:', event.requestContext);
    
    const userId = event.pathParams?.userId || event.pathParameters?.userId || event.params?.userId;
    console.log('Extracted userId:', userId);
    
    const body = JSON.parse(event.body || '{}');
    const { action, productId } = body;
    
    console.log('Request body:', { action, productId });

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "User ID is required" }),
      };
    }

    if (!action || !productId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Action and productId are required" }),
      };
    }

    const result = await docClient.send(new GetCommand({
      TableName: "wishlists",
      Key: { userId },
    }));

    let items = result.Item?.items || [];

    if (action === 'add') {
      const exists = items.some(item => item.productId === productId);
      if (!exists) {
        items.push({
          productId,
          addedAt: new Date().toISOString(),
        });
      }
    } else if (action === 'remove') {
      items = items.filter(item => item.productId !== productId);
    } else {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Invalid action. Use 'add' or 'remove'" }),
      };
    }

    await docClient.send(new PutCommand({
      TableName: "wishlists",
      Item: {
        userId,
        items,
      },
    }));

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, items }),
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
