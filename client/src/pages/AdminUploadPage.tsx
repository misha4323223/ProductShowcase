import { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Upload } from "lucide-react";
import productsData from "../data/products.json";

export default function AdminUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadData = async () => {
    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      console.log("🚀 Начинаем загрузку данных в Firestore...");
      
      const totalItems = productsData.categories.length + productsData.products.length;
      let completed = 0;

      console.log("📦 Загрузка категорий...");
      for (const category of productsData.categories) {
        console.log(`  ➜ Загрузка категории: ${category.name}`);
        await setDoc(doc(db, "categories", category.id), category);
        completed++;
        setProgress((completed / totalItems) * 100);
        console.log(`  ✅ Категория загружена: ${category.name}`);
      }

      console.log("🛍️ Загрузка товаров...");
      for (const product of productsData.products) {
        console.log(`  ➜ Загрузка товара: ${product.name}`);
        const productData = {
          ...product,
          featured: false,
          popularity: Math.floor(Math.random() * 100),
          createdAt: new Date(),
        };
        await setDoc(doc(db, "products", product.id), productData);
        completed++;
        setProgress((completed / totalItems) * 100);
        console.log(`  ✅ Товар загружен: ${product.name}`);
      }

      console.log("🎉 Все данные успешно загружены!");
      setDone(true);
    } catch (err: any) {
      console.error("❌ ОШИБКА при загрузке:", err);
      console.error("Код ошибки:", err.code);
      console.error("Сообщение:", err.message);
      
      let errorMessage = "Произошла ошибка при загрузке данных";
      
      if (err.code === 'permission-denied') {
        errorMessage = "❌ Доступ запрещен! Необходимо:\n1. Создать Firestore Database в Firebase Console\n2. Включить тестовый режим (Test mode)\n3. Обновить страницу и попробовать снова";
      } else if (err.code === 'unavailable') {
        errorMessage = "❌ Firebase Firestore недоступен! Проверьте:\n1. Создана ли база Firestore в Firebase Console\n2. Правильные ли API ключи";
      } else {
        errorMessage = `❌ Ошибка: ${err.message}\n\nКод: ${err.code || 'неизвестно'}`;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Загрузка данных в Firebase</CardTitle>
          <CardDescription>
            Загрузите товары и категории из JSON в Firestore
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!done && !uploading && (
            <>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>📦 Категорий: {productsData.categories.length}</p>
                <p>🛍️ Товаров: {productsData.products.length}</p>
              </div>
              <Button 
                onClick={uploadData} 
                className="w-full"
                data-testid="button-upload-data"
              >
                <Upload className="h-4 w-4 mr-2" />
                Загрузить данные
              </Button>
            </>
          )}

          {uploading && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Загрузка данных...
              </p>
              <Progress value={progress} />
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </div>
          )}

          {done && (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
              <div>
                <p className="font-semibold text-green-700">
                  Данные успешно загружены!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Теперь можно вернуться на главную страницу
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/'}
                className="w-full"
                data-testid="button-go-home"
              >
                На главную
              </Button>
            </div>
          )}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive whitespace-pre-wrap">{error}</p>
              <div className="mt-3 text-xs text-muted-foreground">
                <p className="font-semibold mb-1">Как исправить:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Откройте Firebase Console</li>
                  <li>Создайте Firestore Database</li>
                  <li>Выберите "Start in test mode"</li>
                  <li>Обновите эту страницу</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
