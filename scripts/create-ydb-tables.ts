import { DynamoDBClient, CreateTableCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.VITE_YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.VITE_YDB_ACCESS_KEY_ID!,
    secretAccessKey: process.env.VITE_YDB_SECRET_KEY!,
  },
});

const tables = [
  'products',
  'categories',
  'orders',
  'reviews',
  'promocodes',
  'carts',
  'wishlists',
  'stockNotifications',
  'pushSubscriptions',
  'newsletterSubscriptions'
];

async function createTable(tableName: string) {
  try {
    console.log(`📋 Создание таблицы: ${tableName}...`);
    
    await client.send(new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH'
        }
      ]
    }));
    
    console.log(`✅ Таблица ${tableName} успешно создана`);
  } catch (error: any) {
    if (error.name === 'ResourceInUseException' || error.message?.includes('already exists')) {
      console.log(`⏭️  Таблица ${tableName} уже существует`);
    } else {
      console.error(`❌ Ошибка создания таблицы ${tableName}:`, error.message);
    }
  }
}

async function createAllTables() {
  console.log('🚀 Начинаем создание таблиц в Yandex Database (YDB)...\n');
  console.log(`🔧 Endpoint: ${process.env.VITE_YDB_ENDPOINT}\n`);
  
  if (!process.env.VITE_YDB_ENDPOINT || !process.env.VITE_YDB_ACCESS_KEY_ID || !process.env.VITE_YDB_SECRET_KEY) {
    console.error('\n❌ Ошибка: Не настроены переменные окружения для YDB!');
    process.exit(1);
  }
  
  for (const table of tables) {
    await createTable(table);
  }
  
  console.log('\n✨ Готово! Все таблицы созданы.');
}

createAllTables()
  .then(() => {
    console.log('\n🎉 Теперь можно импортировать данные командой: npm run import-to-ydb');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });
