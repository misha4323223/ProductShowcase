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

async function createMultipleOrders() {
  console.log("🚀 Создаем тестовые заказы...\n");

  const orders = [
    {
      userId: "test-user-123",
      items: [
        {
          productId: "5",
          name: "Трюфели премиум",
          price: 1500,
          quantity: 1,
          image: "",
        }
      ],
      total: 1800,
      status: "delivered",
      customerName: "Иван Иванов",
      customerEmail: "ivan@example.com",
      customerPhone: "+7 900 111 22 33",
      shippingAddress: "Москва, ул. Ленина, д. 10",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 дней назад
    },
    {
      userId: "test-user-123",
      items: [
        {
          productId: "2",
          name: "Французские макаронс",
          price: 650,
          quantity: 3,
          image: "",
        },
        {
          productId: "6",
          name: "Печенье с шоколадной крошкой",
          price: 380,
          quantity: 2,
          image: "",
        }
      ],
      total: 2510,
      status: "shipped",
      customerName: "Иван Иванов",
      customerEmail: "ivan@example.com",
      customerPhone: "+7 900 111 22 33",
      shippingAddress: "Москва, ул. Ленина, д. 10",
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 дня назад
    },
    {
      userId: "test-user-456",
      items: [
        {
          productId: "4",
          name: "Стильная сумка-кроссбоди",
          price: 1999,
          quantity: 1,
          image: "",
        }
      ],
      total: 2299,
      status: "processing",
      customerName: "Мария Петрова",
      customerEmail: "maria@example.com",
      customerPhone: "+7 900 222 33 44",
      shippingAddress: "Санкт-Петербург, Невский пр., д. 20",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // вчера
    }
  ];

  try {
    for (const order of orders) {
      const docRef = await addDoc(collection(db, "orders"), order);
      console.log(`✅ Заказ создан: ${docRef.id}`);
      console.log(`   Клиент: ${order.customerName}`);
      console.log(`   Статус: ${order.status}`);
      console.log(`   Сумма: ${order.total} руб.\n`);
    }

    console.log("🎉 Все тестовые заказы успешно созданы!");
    console.log(`\n📊 Создано заказов: ${orders.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Ошибка при создании заказов:", error);
    process.exit(1);
  }
}

createMultipleOrders();
