import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.VITE_YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_YDB_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_YDB_SECRET_KEY!,
  },
});

const docClient = DynamoDBDocumentClient.from(client);

const exportDir = join(process.cwd(), 'export');

async function importCollection(collectionName: string, data: any[]) {
  try {
    console.log(`📥 Импорт коллекции: ${collectionName}...`);
    
    let imported = 0;
    
    for (const item of data) {
      try {
        await docClient.send(new PutCommand({
          TableName: collectionName,
          Item: item,
        }));
        imported++;
        
        if (imported % 10 === 0) {
          process.stdout.write(`\r   Импортировано: ${imported}/${data.length}`);
        }
      } catch (error: any) {
        console.error(`\n❌ Ошибка при импорте записи ${item.id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Импортировано ${imported} записей в ${collectionName}`);
    return imported;
  } catch (error) {
    console.error(`❌ Ошибка при импорте ${collectionName}:`, error);
    return 0;
  }
}

async function importAll() {
  console.log('🚀 Начинаем импорт данных в Yandex Database (YDB)...\n');
  
  const files = readdirSync(exportDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));
  
  let totalRecords = 0;
  
  for (const file of files) {
    const collectionName = file.replace('.json', '');
    const filePath = join(exportDir, file);
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (Array.isArray(data) && data.length > 0) {
        const count = await importCollection(collectionName, data);
        totalRecords += count;
      } else {
        console.log(`⏭️  Пропускаем ${collectionName} (пустая коллекция)`);
      }
    } catch (error) {
      console.error(`❌ Ошибка чтения файла ${file}:`, error);
    }
    
    console.log('');
  }
  
  console.log(`\n✨ Импорт завершен! Всего записей: ${totalRecords}`);
}

console.log('🔧 Проверка подключения к YDB...');
console.log(`   Endpoint: ${process.env.VITE_YDB_ENDPOINT}`);
console.log(`   Access Key ID: ${process.env.VITE_YDB_ACCESS_KEY_ID?.substring(0, 20)}...`);

if (!process.env.VITE_YDB_ENDPOINT || !process.env.VITE_YDB_ACCESS_KEY_ID || !process.env.VITE_YDB_SECRET_KEY) {
  console.error('\n❌ Ошибка: Не настроены переменные окружения для YDB!');
  console.error('Добавьте в .env файл:');
  console.error('  VITE_YDB_ENDPOINT=...');
  console.error('  VITE_YDB_ACCESS_KEY_ID=...');
  console.error('  VITE_YDB_SECRET_KEY=...');
  process.exit(1);
}

importAll()
  .then(() => {
    console.log('\n🎉 Готово! Данные успешно импортированы в Yandex Cloud.');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
