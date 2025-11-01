if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error("❌ Переменная окружения FIREBASE_SERVICE_ACCOUNT не найдена!");
  process.exit(1);
}

import admin from 'firebase-admin';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// ✅ Инициализация Firebase Admin через ключ сервисного аккаунта
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);

if (!serviceAccount) {
  throw new Error("❌ Переменная окружения FIREBASE_SERVICE_ACCOUNT не задана!");
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });
  console.log('✅ Firebase Admin инициализирован');
} catch (error: any) {
  if (error.code !== 'app/duplicate-app') {
    console.error('❌ Ошибка инициализации:', error);
    process.exit(1);
  }
}

const db = admin.firestore();
const exportDir = join(process.cwd(), 'export');

if (!existsSync(exportDir)) {
  mkdirSync(exportDir, { recursive: true });
}

async function exportCollection(collectionName: string) {
  try {
    console.log(`📦 Экспорт коллекции: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();

    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      const convertedData: any = { id: doc.id };

      for (const [key, value] of Object.entries(docData)) {
        if (value && typeof value === 'object' && value.constructor.name === 'Timestamp') {
          convertedData[key] = value.toDate().toISOString();
        } else {
          convertedData[key] = value;
        }
      }

      return convertedData;
    });

    const filePath = join(exportDir, `${collectionName}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Экспортировано ${data.length} записей из ${collectionName}`);

    return data.length;
  } catch (error) {
    console.error(`❌ Ошибка при экспорте ${collectionName}:`, error);
    return 0;
  }
}

async function exportAll() {
  console.log('🚀 Начинаем экспорт всех данных из Firebase (Admin SDK)...\n');

  const collections = [
    'products',
    'categories',
    'orders',
    'reviews',
    'promocodes',
    'carts',
    'wishlists',
    'stockNotifications',
    'pushSubscriptions'
  ];

  let totalRecords = 0;

  for (const col of collections) {
    const count = await exportCollection(col);
    totalRecords += count;
  }

  console.log(`\n✨ Экспорт завершен! Всего записей: ${totalRecords}`);
  console.log(`📁 Файлы сохранены в папке: ${exportDir}`);

  const summary = {
    exportDate: new Date().toISOString(),
    totalRecords,
    collections: collections,
    source: 'Firebase (Admin SDK)',
    destination: 'Yandex Cloud (готово к импорту)',
  };

  writeFileSync(
    join(exportDir, '_export-summary.json'),
    JSON.stringify(summary, null, 2)
  );
}

exportAll()
  .then(() => {
    console.log('\n🎉 Готово! Теперь можно импортировать данные в Yandex Cloud.');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Критическая ошибка:', error);
    process.exit(1);
  });