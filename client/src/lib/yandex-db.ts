// ВРЕМЕННО ЗАКОММЕНТИРОВАНО: Прямой доступ к БД из браузера небезопасен!
// Это позволяет видеть секретные ключи в браузере.
// Вместо этого используйте API Gateway → Cloud Functions → YDB

// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({
//   region: "ru-central1",
//   endpoint: import.meta.env.VITE_YDB_ENDPOINT,
//   credentials: {
//     accessKeyId: import.meta.env.VITE_YDB_ACCESS_KEY_ID || '',
//     secretAccessKey: import.meta.env.VITE_YDB_SECRET_KEY || '',
//   },
// });

// export const docClient = DynamoDBDocumentClient.from(client, {
//   marshallOptions: {
//     removeUndefinedValues: true,
//     convertEmptyValues: false,
//   },
//   unmarshallOptions: {
//     wrapNumbers: false,
//   },
// });

export const docClient = null as any; // Заглушка для совместимости

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
