import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import * as dotenv from "dotenv";

dotenv.config();

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.YDB_SECRET_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function normalizePromoCodes() {
  try {
    console.log("🔍 Получение всех промокодов из YDB...");
    
    const result = await docClient.send(new ScanCommand({
      TableName: "promocodes",
    }));

    const promoCodes = result.Items || [];
    console.log(`📊 Найдено промокодов: ${promoCodes.length}`);

    if (promoCodes.length === 0) {
      console.log("✅ Нет промокодов для обновления");
      return;
    }

    let updatedCount = 0;
    let skippedCount = 0;

    for (const promo of promoCodes) {
      if (!promo.code) {
        console.log(`⚠️  Пропущен промокод без кода: ${promo.id}`);
        skippedCount++;
        continue;
      }

      const normalizedCode = promo.code.trim().toUpperCase();
      
      // Проверяем, нужно ли обновлять
      if (promo.code !== normalizedCode) {
        console.log(`🔄 Обновление: "${promo.code}" → "${normalizedCode}"`);
        
        await docClient.send(new UpdateCommand({
          TableName: "promocodes",
          Key: { id: promo.id },
          UpdateExpression: "SET #code = :code",
          ExpressionAttributeNames: {
            "#code": "code",
          },
          ExpressionAttributeValues: {
            ":code": normalizedCode,
          },
        }));
        
        updatedCount++;
      } else {
        console.log(`✓ Уже нормализован: "${promo.code}"`);
        skippedCount++;
      }
    }

    console.log("\n✅ Нормализация завершена!");
    console.log(`   Обновлено: ${updatedCount}`);
    console.log(`   Пропущено: ${skippedCount}`);
    console.log(`   Всего: ${promoCodes.length}`);

  } catch (error) {
    console.error("❌ Ошибка при нормализации промокодов:", error);
    throw error;
  }
}

normalizePromoCodes()
  .then(() => {
    console.log("\n🎉 Скрипт успешно выполнен!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Ошибка выполнения скрипта:", error);
    process.exit(1);
  });
