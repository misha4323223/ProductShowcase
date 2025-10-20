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
      const totalItems = productsData.categories.length + productsData.products.length;
      let completed = 0;

      for (const category of productsData.categories) {
        await setDoc(doc(db, "categories", category.id), category);
        completed++;
        setProgress((completed / totalItems) * 100);
      }

      for (const product of productsData.products) {
        const productData = {
          ...product,
          featured: false,
          popularity: Math.floor(Math.random() * 100),
          createdAt: new Date(),
        };
        await setDoc(doc(db, "products", product.id), productData);
        completed++;
        setProgress((completed / totalItems) * 100);
      }

      setDone(true);
    } catch (err: any) {
      setError(err.message || "Произошла ошибка при загрузке данных");
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
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
