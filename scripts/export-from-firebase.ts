import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { writeFileSync, mkdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";

// Загрузка переменных окружения из .env файла
const envPath = join(process.cwd(), '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
      const value = valueParts.join('=').trim();
      process.env[key.trim()] = value;
    }
  });
  console.log('✅ Загружены переменные из .env файла');
} else {
  console.warn('⚠️ Файл .env не найден');
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('🔥 Инициализация Firebase...');
console.log('📋 Конфигурация:');
console.log('   API Key:', firebaseConfig.apiKey?.substring(0, 20) + '...');
console.log('   Project ID:', firebaseConfig.projectId);
console.log('   App ID:', firebaseConfig.appId?.substring(0, 20) + '...');

if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
  console.error('\n❌ Ошибка: Не все Firebase credentials заданы!');
  console.error('Проверьте .env файл и убедитесь, что есть:');
  console.error('  - VITE_FIREBASE_API_KEY');
  console.error('  - VITE_FIREBASE_PROJECT_ID');
  console.error('  - VITE_FIREBASE_APP_ID');
  console.error('  - VITE_FIREBASE_MESSAGING_SENDER_ID');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const exportDir = join(process.cwd(), 'export');
if (!existsSync(exportDir)) {
  mkdirSync(exportDir, { recursive: true });
}

async function exportCollection(collectionName: string) {
  try {
    console.log(`📦 Экспорт коллекции: ${collectionName}...`);
    const snapshot = await getDocs(collection(db, collectionName));
    
    const data = snapshot.docs.map(doc => {
      const docData = doc.data();
      
      const convertedData: any = { id: doc.id };
      
      for (const [key, value] of Object.entries(docData)) {
        if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
          convertedData[key] = value.toDate().toISOString();
        } else {
          convertedData[key] = value;
        }
      }
      
      return convertedData;
    });
    
    const filePath = join(exportDir, `${collectionName}.json`);
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ Экспортировано ${data.length} записей из ${collectionName} → ${filePath}`);
    
    return data.length;
  } catch (error) {
    console.error(`❌ Ошибка при экспорте ${collectionName}:`, error);
    return 0;
  }
}

async function exportAll() {
  console.log('🚀 Начинаем экспорт всех данных из Firebase...\n');
  
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
    source: 'Firebase',
    destination: 'Yandex Cloud (готово к импорту)'
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
