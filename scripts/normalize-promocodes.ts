import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import * as dotenv from "dotenv";
import { join } from "path";

dotenv.config({ path: join(process.cwd(), 'client', '.env') });

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.VITE_YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_YDB_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.VITE_YDB_SECRET_KEY || "",
  },
});

const docClient = DynamoDBDocumentClient.from(client);

async function normalizePromoCodes() {
  try {
    console.log('🔧 Проверка подключения к YDB...');
    console.log(`   Endpoint: ${process.env.VITE_YDB_ENDPOINT}`);
    console.log(`   Access Key ID: ${process.env.VITE_YDB_ACCESS_KEY_ID?.substring(0, 20)}...`);

    if (!process.env.VITE_YDB_ENDPOINT || !process.env.VITE_YDB_ACCESS_KEY_ID || !process.env.VITE_YDB_SECRET_KEY) {
      console.error('\n❌ Ошибка: Не настроены переменные окружения для YDB!');
      console.error('Добавьте в .env файл:');
      console.error('  VITE_YDB_ENDPOINT=...');
      console.error('  VITE_YDB_ACCESS_KEY_ID=...');
      console.error('  VITE_YDB_SECRET_KEY=...');
      throw new Error('Missing YDB environment variables');
    }

    console.log("\n🔍 Получение всех промокодов из YDB...");
    
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
