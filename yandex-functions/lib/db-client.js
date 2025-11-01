const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

function createDbClient() {
  const client = new DynamoDBClient({
    region: "ru-central1",
    endpoint: process.env.YDB_ENDPOINT,
    credentials: {
      accessKeyId: process.env.YDB_ACCESS_KEY_ID,
      secretAccessKey: process.env.YDB_SECRET_KEY,
    },
  });

  return DynamoDBDocumentClient.from(client, {
    marshallOptions: {
      removeUndefinedValues: true,
      convertEmptyValues: false,
    },
    unmarshallOptions: {
      wrapNumbers: false,
    },
  });
}

module.exports = { createDbClient };
