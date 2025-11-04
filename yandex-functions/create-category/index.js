const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

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
    const body = JSON.parse(event.body || '{}');

    console.log("📥 Получены данные категории:", JSON.stringify(body));

    if (!body.id || !body.name || !body.slug) {
      return {
        statusCode: 400,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: "Missing required fields: id, name, slug" }),
      };
    }

    // Убираем пустую строку из image, если она пустая
    if (body.image === "") {
      delete body.image;
    }

    console.log("💾 Сохраняем в YDB:", JSON.stringify(body));

    await docClient.send(new PutCommand({
      TableName: "categories",
      Item: body,
    }));

    console.log("✅ Категория успешно сохранена:", body.id);

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, category: body }),
    };
  } catch (error) {
    console.error("❌ Ошибка создания категории:", error);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
