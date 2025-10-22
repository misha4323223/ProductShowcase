import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Package, FolderOpen, ShoppingBag, MessageSquare, Star } from "lucide-react";
import { getUserOrders, updateOrderStatus } from "@/services/firebase-orders";
import { getAllReviews, deleteReview } from "@/services/firebase-reviews";
import type { Order, Review } from "@/types/firebase-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/contexts/AuthContext";

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
  stock: z.number().min(0, "Остаток не может быть отрицательным").optional(),
});

type Category = z.infer<typeof categorySchema>;
type Product = z.infer<typeof productSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    if (user) {
      console.log("=== ADMIN DEBUG ===");
      console.log("Your email:", user.email);
      console.log("Use this email in Firebase rules!");
    }
  }, [user]);

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

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "orders"));
      const orders = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Order));
      return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
  });

  const filteredOrders = selectedStatus === "all" 
    ? allOrders 
    : allOrders.filter(order => order.status === selectedStatus);

  const { data: allReviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
    queryFn: getAllReviews,
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
      stock: undefined,
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
      
      if (data.stock !== undefined && data.stock >= 0) {
        cleanData.stock = data.stock;
      }
      
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

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, newStock }: { productId: string; newStock: number }) => {
      const productRef = doc(db, "products", productId);
      await setDoc(productRef, { stock: Math.max(0, newStock) }, { merge: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Остаток обновлён" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: Order['status'] }) => {
      await updateOrderStatus(orderId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Статус заказа обновлён" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'В обработке';
      case 'shipped': return 'Отправлен';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменён';
      default: return status;
    }
  };

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      await deleteReview(reviewId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
      toast({ title: "Отзыв удалён" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating 
                ? "fill-yellow-500 text-yellow-500" 
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Админ-панель</h1>
        <p className="text-muted-foreground">Управление категориями и товарами</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Заказы ({allOrders.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            <MessageSquare className="w-4 h-4 mr-2" />
            Отзывы ({allReviews.length})
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="w-4 h-4 mr-2" />
            Товары
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <FolderOpen className="w-4 h-4 mr-2" />
            Категории
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Управление заказами</CardTitle>
                  <CardDescription>Просмотр и изменение статуса заказов</CardDescription>
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]" data-testid="select-order-status-filter">
                    <SelectValue placeholder="Все заказы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все заказы</SelectItem>
                    <SelectItem value="pending">Ожидает</SelectItem>
                    <SelectItem value="processing">В обработке</SelectItem>
                    <SelectItem value="shipped">Отправлен</SelectItem>
                    <SelectItem value="delivered">Доставлен</SelectItem>
                    <SelectItem value="cancelled">Отменён</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <p className="text-muted-foreground">Загрузка заказов...</p>
              ) : filteredOrders.length === 0 ? (
                <p className="text-muted-foreground">
                  {selectedStatus === "all" ? "Заказов пока нет" : "Нет заказов с таким статусом"}
                </p>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3" data-testid={`order-${order.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">Заказ #{order.id.slice(0, 8)}</p>
                            <Badge className={getStatusColor(order.status)} data-testid={`order-status-${order.id}`}>
                              {getStatusText(order.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.createdAt.toLocaleDateString('ru-RU', { 
                              day: 'numeric', 
                              month: 'long', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{order.total} ₽</p>
                          <p className="text-sm text-muted-foreground">{order.items.length} товаров</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Клиент:</p>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-muted-foreground">{order.customerEmail}</p>
                          <p className="text-muted-foreground">{order.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Адрес доставки:</p>
                          <p className="font-medium">{order.shippingAddress}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-2">Состав заказа:</p>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.name} x {item.quantity}</span>
                              <span>{item.price * item.quantity} ₽</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t">
                        <Label className="text-sm">Изменить статус:</Label>
                        <Select 
                          value={order.status} 
                          onValueChange={(newStatus) => 
                            updateOrderStatusMutation.mutate({ 
                              orderId: order.id, 
                              status: newStatus as Order['status'] 
                            })
                          }
                        >
                          <SelectTrigger className="mt-1" data-testid={`select-order-status-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Ожидает</SelectItem>
                            <SelectItem value="processing">В обработке</SelectItem>
                            <SelectItem value="shipped">Отправлен</SelectItem>
                            <SelectItem value="delivered">Доставлен</SelectItem>
                            <SelectItem value="cancelled">Отменён</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Управление отзывами</CardTitle>
              <CardDescription>Просмотр и модерация отзывов пользователей</CardDescription>
            </CardHeader>
            <CardContent>
              {reviewsLoading ? (
                <p className="text-muted-foreground">Загрузка отзывов...</p>
              ) : allReviews.length === 0 ? (
                <p className="text-muted-foreground">Отзывов пока нет</p>
              ) : (
                <div className="space-y-4">
                  {allReviews.map((review) => {
                    const product = products.find(p => p.id === review.productId);
                    return (
                      <div key={review.id} className="border rounded-lg p-4 space-y-3" data-testid={`review-${review.id}`}>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{review.userName}</p>
                              {renderStars(review.rating)}
                              <Badge variant="outline" className="ml-2">
                                {review.rating}/5
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {review.createdAt.toLocaleDateString('ru-RU', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteReviewMutation.mutate(review.id)}
                            disabled={deleteReviewMutation.isPending}
                            data-testid={`button-delete-review-${review.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">Товар:</p>
                            <p className="font-medium">{product?.name || `ID: ${review.productId}`}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Комментарий:</p>
                            <p className="text-sm bg-muted/50 p-3 rounded-md">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Остаток товара (шт)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            value={field.value ?? ""}
                            placeholder="Оставьте пустым для безлимитного товара" 
                            data-testid="input-product-stock" 
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Оставьте поле пустым если товар не требует учета остатков
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
              <CardDescription>Управление остатками и товарами</CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <p className="text-muted-foreground">Загрузка...</p>
              ) : products.length === 0 ? (
                <p className="text-muted-foreground">Товаров пока нет</p>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => {
                    const stock = product.stock;
                    const hasStock = stock !== undefined;
                    const isLowStock = hasStock && stock < 10;
                    const isOutOfStock = hasStock && stock === 0;
                    
                    return (
                      <div 
                        key={product.id} 
                        className="border rounded-lg p-4 space-y-3 bg-card" 
                        data-testid={`product-${product.id}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-lg">{product.name}</p>
                              {isOutOfStock && (
                                <Badge variant="destructive" data-testid={`badge-out-of-stock-${product.id}`}>
                                  Нет в наличии
                                </Badge>
                              )}
                              {!isOutOfStock && isLowStock && (
                                <Badge variant="outline" className="border-yellow-500 text-yellow-700" data-testid={`badge-low-stock-${product.id}`}>
                                  ⚠️ Мало
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
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

                        <div className="pt-3 border-t space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Остаток на складе:</p>
                            <p className={`text-2xl font-bold ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`} data-testid={`text-stock-${product.id}`}>
                              {hasStock ? `${stock} шт` : 'Безлимитный'}
                            </p>
                          </div>

                          {hasStock ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStockMutation.mutate({ 
                                  productId: product.id, 
                                  newStock: stock - 10 
                                })}
                                disabled={updateStockMutation.isPending || stock === 0}
                                data-testid={`button-stock-minus10-${product.id}`}
                              >
                                -10
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStockMutation.mutate({ 
                                  productId: product.id, 
                                  newStock: stock - 1 
                                })}
                                disabled={updateStockMutation.isPending || stock === 0}
                                data-testid={`button-stock-minus1-${product.id}`}
                              >
                                -1
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStockMutation.mutate({ 
                                  productId: product.id, 
                                  newStock: stock + 1 
                                })}
                                disabled={updateStockMutation.isPending}
                                data-testid={`button-stock-plus1-${product.id}`}
                              >
                                +1
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStockMutation.mutate({ 
                                  productId: product.id, 
                                  newStock: stock + 10 
                                })}
                                disabled={updateStockMutation.isPending}
                                data-testid={`button-stock-plus10-${product.id}`}
                              >
                                +10
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStockMutation.mutate({ 
                                  productId: product.id, 
                                  newStock: stock + 50 
                                })}
                                disabled={updateStockMutation.isPending}
                                data-testid={`button-stock-plus50-${product.id}`}
                              >
                                +50
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateStockMutation.mutate({ 
                                  productId: product.id, 
                                  newStock: stock + 100 
                                })}
                                disabled={updateStockMutation.isPending}
                                data-testid={`button-stock-plus100-${product.id}`}
                              >
                                +100
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              Для безлимитных товаров управление остатками недоступно. 
                              Добавьте начальный остаток через форму редактирования.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
