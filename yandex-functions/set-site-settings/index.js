const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

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
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { settingKey, settingValue } = body;
    
    if (!settingKey || !settingValue) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'settingKey and settingValue are required' }),
      };
    }
    
    await docClient.send(new PutCommand({
      TableName: "site_settings",
      Item: {
        settingKey: settingKey,
        settingValue: settingValue
      }
    }));
    
    console.log(`Setting updated: ${settingKey} = ${settingValue}`);
    
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
        settingKey,
        settingValue
      }),
    };
  } catch (error) {
    console.error("Error setting site settings:", error);
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
