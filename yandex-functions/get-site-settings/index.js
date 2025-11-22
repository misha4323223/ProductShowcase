const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

console.log("Environment variables:");
console.log("YDB_ENDPOINT:", process.env.YDB_ENDPOINT);
console.log("YDB_ACCESS_KEY_ID:", process.env.YDB_ACCESS_KEY_ID ? "SET" : "NOT SET");
console.log("YDB_SECRET_KEY:", process.env.YDB_SECRET_KEY ? "SET" : "NOT SET");

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
    const settingKey = event.queryStringParameters?.key || 'current_theme';
    
    const result = await docClient.send(new GetCommand({
      TableName: "site_settings",
      Key: {
        settingKey: settingKey
      }
    }));
    
    if (!result.Item) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          settingKey: settingKey,
          settingValue: 'sakura'
        }),
      };
    }
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error("Error getting site settings:", error);
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
