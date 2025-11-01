import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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

async function createTestOrder() {
  console.log("🚀 Создаем тестовый заказ...\n");

  try {
    const testOrder = {
      userId: "test-user-123",
      items: [
        {
          productId: "1",
          name: "Бельгийский шоколад ассорти",
          price: 1200,
          quantity: 2,
          image: "",
        },
        {
          productId: "2",
          name: "Французские макаронс",
          price: 650,
          quantity: 1,
          image: "",
        }
      ],
      total: 3050,
      status: "pending",
      customerName: "Тестовый Пользователь",
      customerEmail: "test@example.com",
      customerPhone: "+7 900 123 45 67",
      shippingAddress: "Москва, ул. Тестовая, д. 1",
      createdAt: new Date(),
    };

    const docRef = await addDoc(collection(db, "orders"), testOrder);
    
    console.log("✅ Тестовый заказ создан!");
    console.log(`📦 ID заказа: ${docRef.id}`);
    console.log(`👤 Клиент: ${testOrder.customerName}`);
    console.log(`💰 Сумма: ${testOrder.total} руб.`);
    console.log(`📧 Email: ${testOrder.customerEmail}`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Ошибка при создании заказа:", error);
    process.exit(1);
  }
}

createTestOrder();
