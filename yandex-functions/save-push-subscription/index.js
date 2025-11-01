const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

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
    const { subscriptionId, subscriptionToken } = body;

    if (!subscriptionId) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "subscriptionId is required" }),
      };
    }

    const result = await docClient.send(new ScanCommand({
      TableName: "pushSubscriptions",
    }));

    const existing = (result.Items || []).find(
      item => item.subscriptionId === subscriptionId
    );

    if (existing) {
      const updateExpression = subscriptionToken 
        ? 'SET #status = :status, lastUpdated = :lastUpdated, subscriptionToken = :token'
        : 'SET #status = :status, lastUpdated = :lastUpdated';

      const attributeValues = {
        ':status': 'subscribed',
        ':lastUpdated': new Date().toISOString(),
      };

      if (subscriptionToken) {
        attributeValues[':token'] = subscriptionToken;
      }

      await docClient.send(new UpdateCommand({
        TableName: "pushSubscriptions",
        Key: { id: existing.id },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: attributeValues,
      }));
    } else {
      const id = generateId();
      await docClient.send(new PutCommand({
        TableName: "pushSubscriptions",
        Item: {
          id,
          subscriptionId,
          subscriptionToken: subscriptionToken || '',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          status: 'subscribed',
        },
      }));
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
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
