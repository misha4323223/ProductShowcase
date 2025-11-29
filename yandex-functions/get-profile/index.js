const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

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

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event) => {
  try {
    // Получаем email из query параметров или из body
    let email;
    
    if (event.queryStringParameters && event.queryStringParameters.email) {
      email = event.queryStringParameters.email;
    } else if (event.body) {
      const body = JSON.parse(event.body);
      email = body.email;
    }

    if (!email) {
      return createResponse(400, { error: "Email обязателен" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Получаем данные пользователя из базы
    const getCommand = new GetCommand({
      TableName: "users",
      Key: { email: trimmedEmail }
    });

    const result = await docClient.send(getCommand);

    if (!result.Item) {
      return createResponse(404, { error: "Пользователь не найден" });
    }

    const user = result.Item;

    // Возвращаем только данные профиля (без пароля и других чувствительных данных)
    const profile = {
      email: user.email,
      userId: user.userId,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      patronymic: user.patronymic || "",
      birthDate: user.birthDate || "",
      phone: user.phone || "",
      role: user.role || "user",
    };

    console.log(`✅ Profile retrieved for: ${trimmedEmail}`);

    return createResponse(200, {
      success: true,
      profile
    });

  } catch (error) {
    console.error("Error getting profile:", error);
    return createResponse(500, { error: "Ошибка при получении профиля" });
  }
};
