import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Package, FolderOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const categorySchema = z.object({
  id: z.string().trim().min(1, "ID обязателен"),
  name: z.string().trim().min(1, "Название обязательно"),
  slug: z.string().trim().min(1, "Slug обязателен"),
});

const productSchema = z.object({
  id: z.string().trim().min(1, "ID обязателен"),
  name: z.string().trim().min(1, "Название обязательно"),
  price: z.number().min(0, "Цена должна быть положительной"),
  category: z.string().trim().min(1, "Выберите категорию"),
  description: z.string().trim().min(1, "Описание обязательно"),
  image: z.string().trim().optional(),
  salePrice: z.number().optional(),
  featured: z.boolean().default(false),
});

type Category = z.infer<typeof categorySchema>;
type Product = z.infer<typeof productSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("categories");

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "categories"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    },
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "products"));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    },
  });

  const categoryForm = useForm<Category>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: "",
      name: "",
      slug: "",
    },
  });

  const productForm = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: "",
      name: "",
      price: 0,
      category: "",
      description: "",
      image: "",
      featured: false,
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (data: Category) => {
      await setDoc(doc(db, "categories", data.id), data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Категория добавлена!" });
      categoryForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const addProductMutation = useMutation({
    mutationFn: async (data: Product) => {
      const cleanData: any = {
        id: data.id,
        name: data.name,
        price: data.price,
        category: data.category,
        description: data.description,
        featured: data.featured || false,
        popularity: Math.floor(Math.random() * 100),
      };
      
      if (data.salePrice && data.salePrice > 0) {
        cleanData.salePrice = data.salePrice;
      }
      
      if (data.image && data.image.trim() !== "") {
        cleanData.image = data.image;
      }
      
      await setDoc(doc(db, "products", data.id), cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Товар добавлен!" });
      productForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "categories", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Категория удалена" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteDoc(doc(db, "products", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Товар удалён" });
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Админ-панель</h1>
        <p className="text-muted-foreground">Управление категориями и товарами</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="categories" data-testid="tab-categories">
            <FolderOpen className="w-4 h-4 mr-2" />
            Категории
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="w-4 h-4 mr-2" />
            Товары
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Добавить категорию</CardTitle>
              <CardDescription>Создайте новую категорию товаров</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit((data) => addCategoryMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID категории</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="chocolates" data-testid="input-category-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Шоколад" data-testid="input-category-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Slug</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="chocolates" data-testid="input-category-slug" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={addCategoryMutation.isPending} data-testid="button-add-category">
                    <Plus className="w-4 h-4 mr-2" />
                    {addCategoryMutation.isPending ? "Добавление..." : "Добавить категорию"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Существующие категории</CardTitle>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <p className="text-muted-foreground">Загрузка...</p>
              ) : categories.length === 0 ? (
                <p className="text-muted-foreground">Категорий пока нет</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 border rounded-md" data-testid={`category-${cat.id}`}>
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {cat.id} • Slug: {cat.slug}</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCategoryMutation.mutate(cat.id)}
                        disabled={deleteCategoryMutation.isPending}
                        data-testid={`button-delete-category-${cat.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Добавить товар</CardTitle>
              <CardDescription>Создайте новый товар</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...productForm}>
                <form onSubmit={productForm.handleSubmit((data) => addProductMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ID товара</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1" data-testid="input-product-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Категория</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-product-category">
                                <SelectValue placeholder="Выберите категорию" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat.id} value={cat.id} data-testid={`select-option-category-${cat.id}`}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={productForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Название товара</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Бельгийский шоколад" data-testid="input-product-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={productForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Описание</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Описание товара..." data-testid="input-product-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={productForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Цена (₽)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              placeholder="1200" 
                              data-testid="input-product-price" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={productForm.control}
                      name="salePrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Цена со скидкой (опционально)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ""}
                              placeholder="999" 
                              data-testid="input-product-saleprice" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={productForm.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL изображения (опционально)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="https://example.com/image.jpg" data-testid="input-product-image" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={addProductMutation.isPending} data-testid="button-add-product">
                    <Plus className="w-4 h-4 mr-2" />
                    {addProductMutation.isPending ? "Добавление..." : "Добавить товар"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Существующие товары</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <p className="text-muted-foreground">Загрузка...</p>
              ) : products.length === 0 ? (
                <p className="text-muted-foreground">Товаров пока нет</p>
              ) : (
                <div className="space-y-2">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 border rounded-md" data-testid={`product-${product.id}`}>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.price}₽ {product.salePrice && `→ ${product.salePrice}₽`} • {product.category}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteProductMutation.mutate(product.id)}
                        disabled={deleteProductMutation.isPending}
                        data-testid={`button-delete-product-${product.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
