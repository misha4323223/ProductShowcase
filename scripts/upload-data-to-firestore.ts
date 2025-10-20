import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import productsData from "../client/public/data/products.json" assert { type: "json" };

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadData() {
  console.log("🚀 Начинаем загрузку данных в Firestore...\n");

  try {
    console.log("📦 Загрузка категорий...");
    for (const category of productsData.categories) {
      await setDoc(doc(db, "categories", category.id), category);
      console.log(`✅ Категория: ${category.name}`);
    }

    console.log("\n📦 Загрузка товаров...");
    for (const product of productsData.products) {
      const productData = {
        ...product,
        featured: false,
        popularity: Math.floor(Math.random() * 100),
        createdAt: new Date(),
      };
      await setDoc(doc(db, "products", product.id), productData);
      console.log(`✅ Товар: ${product.name}`);
    }

    console.log("\n🎉 Все данные успешно загружены в Firestore!");
    console.log(`\n📊 Статистика:`);
    console.log(`   Категорий: ${productsData.categories.length}`);
    console.log(`   Товаров: ${productsData.products.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Ошибка при загрузке данных:", error);
    process.exit(1);
  }
}

uploadData();
