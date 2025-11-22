import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { getAllProducts, getAllCategories, createProduct, updateProduct, deleteProduct, createCategory, updateCategory, deleteCategory } from "@/services/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Package, FolderOpen, ShoppingBag, MessageSquare, Star, Ticket, Bell, Upload, X, LogOut, Mail, Send, Edit, Palette, Check } from "lucide-react";
import { getUserOrders, updateOrderStatus, getAllOrders, deleteOrder } from "@/services/yandex-orders";
import { getAllReviews, deleteReview } from "@/services/yandex-reviews";
import { getAllPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, getPromoCodeUsageCount } from "@/services/yandex-promocodes";
import { sendStockNotifications, getAllNotifications, deleteNotification } from "@/services/yandex-stock-notifications";
import { getAllNewsletterSubscriptions, getActiveNewsletterEmails, unsubscribeFromNewsletter, type NewsletterSubscription } from "@/services/yandex-newsletter";
import { sendNewsletter } from "@/services/postbox-client";
import { setCurrentTheme as saveThemeToServer, getHeroSlides, setHeroSlides, getBackgroundSettings, setBackgroundSettings, setPreferredTheme as savePreferredTheme, type HeroSlide, type BackgroundSettings, type BackgroundSetting } from "@/services/site-settings-client";
import { useTheme } from "@/contexts/ThemeContext";
import type { Order, Review, PromoCode } from "@/types/firebase-types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { uploadImageToYandexStorage, validateImageFile } from "@/services/yandex-storage";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import heroImage1 from '@assets/generated_images/Candy_characters_big_gift_box_7a7377e6.png';
import heroImage1WebP from '@assets/generated_images/Candy_characters_big_gift_box_7a7377e6.webp';
import heroImage2 from '@assets/generated_images/Lollipop_delivery_character_scene_9b1fad01.png';
import heroImage2WebP from '@assets/generated_images/Lollipop_delivery_character_scene_9b1fad01.webp';
import heroImage3 from '@assets/generated_images/Candy_box_explosion_celebration_bbc9c118.png';
import heroImage3WebP from '@assets/generated_images/Candy_box_explosion_celebration_bbc9c118.webp';

const categorySchema = z.object({
  id: z.string().trim().min(1, "ID обязателен"),
  name: z.string().trim().min(1, "Название обязательно"),
  slug: z.string().trim().min(1, "Slug обязателен"),
  image: z.string().trim().optional(),
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

const promoCodeSchema = z.object({
  code: z.string().trim().min(1, "Код обязателен").toUpperCase(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().min(0.01, "Значение скидки должно быть больше 0"),
  minOrderAmount: z.number().min(0).optional(),
  maxUses: z.number().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().default(true),
}).refine((data) => {
  if (data.discountType === 'percentage' && data.discountValue >= 100) {
    return false;
  }
  return true;
}, {
  message: "Процентная скидка должна быть меньше 100%",
  path: ["discountValue"],
});

type Category = z.infer<typeof categorySchema>;
type Product = z.infer<typeof productSchema>;
type PromoCodeForm = z.infer<typeof promoCodeSchema>;

const newsletterSchema = z.object({
  subject: z.string().trim().min(1, "Тема обязательна"),
  title: z.string().trim().min(1, "Заголовок обязателен"),
  message: z.string().trim().min(1, "Сообщение обязательно"),
});

const heroSlideSchema = z.object({
  id: z.number(),
  title: z.string().trim().min(1, "Заголовок обязателен"),
  subtitle: z.string().trim().optional(),
  image: z.string().trim().min(1, "Изображение обязательно"),
  webpImage: z.string().trim().min(1, "WebP изображение обязательно"),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;
type HeroSlideForm = z.infer<typeof heroSlideSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const { logout } = useAdminAuth();
  const { preferredTheme, setPreferredTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("categories");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [promoUsageCounts, setPromoUsageCounts] = useState<Record<string, number>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState<string>("");
  const [isUploadingCategoryImage, setIsUploadingCategoryImage] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>("sakura");
  
  const [heroSlides, setHeroSlidesState] = useState<HeroSlide[]>([]);
  const [slidesLoading, setSlidesLoading] = useState(false);
  const [selectedSlidesTheme, setSelectedSlidesTheme] = useState<'sakura' | 'new-year' | 'spring' | 'autumn'>('sakura');
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const [editingSlideTitle, setEditingSlideTitle] = useState<string>("");
  const [editingSlideSubtitle, setEditingSlideSubtitle] = useState<string>("");
  const [slideImageFile, setSlideImageFile] = useState<File | null>(null);
  const [slideImagePreview, setSlideImagePreview] = useState<string>("");
  const [isUploadingSlideImage, setIsUploadingSlideImage] = useState(false);
  const [isSavingSlide, setIsSavingSlide] = useState(false);

  const [backgroundSettings, setBackgroundSettingsState] = useState<BackgroundSettings>({
    sakura: { image: '', webpImage: '', title: '' },
    newyear: { image: '', webpImage: '', title: '' },
    spring: { image: '', webpImage: '', title: '' },
    autumn: { image: '', webpImage: '', title: '' },
  });
  const [backgroundsLoading, setBackgroundsLoading] = useState(false);
  const [editingBackgroundTheme, setEditingBackgroundTheme] = useState<keyof BackgroundSettings | null>(null);
  const [editingBackgroundTitle, setEditingBackgroundTitle] = useState<string>("");
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string>("");
  const [isSavingBackground, setIsSavingBackground] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: getAllCategories as any,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: getAllProducts as any
  });

  const { data: allOrders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: getAllOrders,
  });

  const filteredOrders = selectedStatus === "all" 
    ? allOrders 
    : allOrders.filter(order => order.status === selectedStatus);

  const { data: allReviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
    queryFn: getAllReviews,
  });

  const { data: promoCodes = [], isLoading: promoCodesLoading } = useQuery<PromoCode[]>({
    queryKey: ["/api/admin/promocodes"],
    queryFn: getAllPromoCodes,
  });

  const { data: stockNotifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/admin/stock-notifications"],
    queryFn: getAllNotifications,
  });

  const { data: newsletterSubscriptions = [], isLoading: newsletterLoading} = useQuery<NewsletterSubscription[]>({
    queryKey: ["/api/admin/newsletter-subscriptions"],
    queryFn: getAllNewsletterSubscriptions,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    async function loadTheme() {
      try {
        const { getCurrentTheme } = await import("@/services/site-settings-client");
        const theme = await getCurrentTheme();
        setCurrentTheme(theme);
      } catch (error) {
        const localTheme = localStorage.getItem("sweetDelights_theme") || "sakura";
        setCurrentTheme(localTheme);
      }
    }
    loadTheme();
  }, []);

  useEffect(() => {
    async function loadHeroSlides() {
      setSlidesLoading(true);
      try {
        const slides = await getHeroSlides(selectedSlidesTheme);
        // Если слайдов нет, загружаем текущие слайды (без фильтра по теме)
        if (!slides || slides.length === 0) {
          // Для sakura - копируем текущие слайды если они есть
          if (selectedSlidesTheme === 'sakura') {
            const defaultSlides = await getHeroSlides();
            if (defaultSlides && defaultSlides.length > 0) {
              await setHeroSlides(defaultSlides, 'sakura');
              setHeroSlidesState(defaultSlides);
            } else {
              throw new Error('No default slides found');
            }
          } else {
            // Для остальных тем - создаём с названием темы
            const defaultSlides: HeroSlide[] = [
              {
                id: 1,
                image: heroImage1,
                webpImage: heroImage1WebP,
                title: `${selectedSlidesTheme} слайд 1`,
                subtitle: 'Первый слайд',
              },
              {
                id: 2,
                image: heroImage2,
                webpImage: heroImage2WebP,
                title: `${selectedSlidesTheme} слайд 2`,
                subtitle: 'Второй слайд',
              },
              {
                id: 3,
                image: heroImage3,
                webpImage: heroImage3WebP,
                title: `${selectedSlidesTheme} слайд 3`,
                subtitle: 'Третий слайд',
              },
            ];
            await setHeroSlides(defaultSlides, selectedSlidesTheme);
            setHeroSlidesState(defaultSlides);
          }
        } else {
          setHeroSlidesState(slides);
        }
      } catch (error) {
        console.error('Error loading hero slides:', error);
        // Fallback - создаём дефолтные слайды если ничего не получилось
        const defaultSlides: HeroSlide[] = [
          {
            id: 1,
            image: heroImage1,
            webpImage: heroImage1WebP,
            title: 'Sweet Delights',
            subtitle: 'Мир сладостей и радости',
          },
          {
            id: 2,
            image: heroImage2,
            webpImage: heroImage2WebP,
            title: 'Доставим сладость в каждый дом',
            subtitle: '',
          },
          {
            id: 3,
            image: heroImage3,
            webpImage: heroImage3WebP,
            title: 'Ваши улыбки — наша награда!',
            subtitle: '',
          },
        ];
        setHeroSlidesState(defaultSlides);
      } finally {
        setSlidesLoading(false);
      }
    }
    loadHeroSlides();
  }, [selectedSlidesTheme]);

  useEffect(() => {
    async function loadBackgrounds() {
      setBackgroundsLoading(true);
      try {
        const settings = await getBackgroundSettings();
        // Если фоны не загрузились или пусты, создаём дефолтные
        if (!settings || Object.keys(settings).length === 0 || !settings.sakura?.webpImage) {
          const defaultBackgrounds: BackgroundSettings = {
            sakura: { 
              image: heroImage1, 
              webpImage: heroImage1WebP, 
              title: 'Сакура фон' 
            },
            newyear: { 
              image: heroImage2, 
              webpImage: heroImage2WebP, 
              title: 'Новогодний фон' 
            },
            spring: { 
              image: heroImage3, 
              webpImage: heroImage3WebP, 
              title: 'Весенний фон' 
            },
            autumn: { 
              image: heroImage1, 
              webpImage: heroImage1WebP, 
              title: 'Осенний фон' 
            },
          };
          await setBackgroundSettings(defaultBackgrounds);
          setBackgroundSettingsState(defaultBackgrounds);
        } else {
          setBackgroundSettingsState(settings);
        }
      } catch (error) {
        console.error('Error loading background settings:', error);
      } finally {
        setBackgroundsLoading(false);
      }
    }
    loadBackgrounds();
  }, []);

  useEffect(() => {
    async function loadPromoUsageCounts() {
      if (promoCodes.length > 0) {
        const counts: Record<string, number> = {};
        await Promise.all(
          promoCodes.map(async (promo) => {
            const count = await getPromoCodeUsageCount(promo.code);
            counts[promo.id] = count;
          })
        );
        setPromoUsageCounts(counts);
      }
    }
    loadPromoUsageCounts();
  }, [promoCodes]);

  const categoryForm = useForm<Category>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: "",
      name: "",
      slug: "",
      image: "",
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

  const promoCodeForm = useForm<PromoCodeForm>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      discountType: "percentage",
      discountValue: 0,
      minOrderAmount: undefined,
      maxUses: undefined,
      startDate: "",
      endDate: "",
      active: true,
    },
  });

  const newsletterForm = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      subject: "Магазин Sweet Delights открыт!",
      title: "Мы открылись!",
      message: "<p>Дорогие подписчики!</p><p>Наш магазин <strong>Sweet Delights</strong> теперь открыт! Мы рады предложить вам широкий ассортимент вкусных сладостей.</p><p>Заходите к нам за лучшими десертами!</p>",
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (data: Category) => {
      console.log("📤 Отправляем категорию в БД:", data);
      await createCategory(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Категория добавлена!" });
      categoryForm.reset();
      setCategoryImageFile(null);
      setCategoryImagePreview("");
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: Category) => {
      if (!editingCategory) return;
      console.log("📤 Обновляем категорию:", editingCategory.id, data);
      await updateCategory(editingCategory.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Категория обновлена!" });
      categoryForm.reset();
      setCategoryImageFile(null);
      setCategoryImagePreview("");
      setEditingCategory(null);
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
      console.log("📦 Данные товара перед сохранением:", data);
      console.log("🖼️ Значение поля image:", data.image);
      console.log("📏 Длина строки image:", data.image?.length);
      
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
        console.log("✅ URL изображения будет сохранен:", data.image);
      } else {
        console.log("⚠️ URL изображения отсутствует или пустой");
        console.log("   Тип данных:", typeof data.image);
        console.log("   Значение:", JSON.stringify(data.image));
      }
      console.log("💾 Сохраняем в YDB:", cleanData);
      await createProduct(cleanData as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ 
        title: "Товар успешно создан!", 
        description: "Товар добавлен в базу данных"
      });
      productForm.reset();
      setSelectedFile(null);
      setImagePreview("");
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
      await deleteCategory(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({ title: "Категория удалена" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Товар удалён" });
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ productId, newStock, oldStock, productName }: { 
      productId: string; 
      newStock: number; 
      oldStock: number; 
      productName: string;
    }) => {
      const finalStock = Math.max(0, newStock);
      await updateProduct(productId, { stock: finalStock });
      
      if (oldStock === 0 && finalStock > 0) {
        const productUrl = `${window.location.origin}`;
        const sentCount = await sendStockNotifications(productId, productName, productUrl);
        if (sentCount > 0) {
          toast({ 
            title: "Уведомления отправлены", 
            description: `Отправлено ${sentCount} уведомлений о поступлении товара` 
          });
        }
      }
      
      return finalStock;
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

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await deleteOrder(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Заказ удалён" });
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

  const addPromoCodeMutation = useMutation({
    mutationFn: async (data: PromoCodeForm) => {
      const promoData = {
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderAmount: data.minOrderAmount,
        maxUses: data.maxUses,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        active: data.active,
      };
      await createPromoCode(promoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promocodes"] });
      toast({ title: "Промокод создан!" });
      promoCodeForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const togglePromoCodeMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await updatePromoCode(id, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promocodes"] });
      toast({ title: "Статус промокода обновлён" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deletePromoCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      await deletePromoCode(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promocodes"] });
      toast({ title: "Промокод удалён" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteStockNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-notifications"] });
      toast({ title: "Подписка удалена" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteNewsletterSubscriptionMutation = useMutation({
    mutationFn: async (id: string) => {
      await unsubscribeFromNewsletter(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/newsletter-subscriptions"] });
      toast({ title: "Подписчик удален" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка удаления подписки", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const setThemeMutation = useMutation({
    mutationFn: async (theme: string) => {
      await saveThemeToServer(theme);
      localStorage.setItem("sweetDelights_theme", theme);
      return { theme };
    },
    onSuccess: (data) => {
      setCurrentTheme(data.theme);
      document.documentElement.classList.remove('new-year', 'sakura', 'spring', 'autumn', 'light', 'dark');
      document.documentElement.classList.add(data.theme);
      window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: data.theme } }));
      toast({ 
        title: "Тема сохранена на сервере!", 
        description: `Выбрана тема: ${data.theme}. Все пользователи увидят эту тему.` 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка сохранения темы", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const saveHeroSlidesMutation = useMutation({
    mutationFn: async (slides: HeroSlide[]) => {
      await setHeroSlides(slides, selectedSlidesTheme);
      return slides;
    },
    onSuccess: (data) => {
      setHeroSlidesState(data);
      toast({ 
        title: "Слайды сохранены!", 
        description: "Все пользователи увидят обновленные слайды" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Ошибка сохранения слайдов", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast({ 
        title: "Ошибка", 
        description: error,
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async () => {
    if (!selectedFile) return;

    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadImageToYandexStorage(selectedFile, 'products');
      
      // Устанавливаем URL изображения в форму и помечаем поле как "touched"
      productForm.setValue('image', imageUrl, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      console.log("✅ URL изображения установлен в форму:", imageUrl);
      console.log("📋 Текущее значение image в форме:", productForm.getValues('image'));
      
      toast({ 
        title: "Изображение загружено!", 
        description: `URL: ${imageUrl.substring(0, 50)}...` 
      });
    } catch (error: any) {
      toast({ 
        title: "Ошибка загрузки", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleClearImage = () => {
    setSelectedFile(null);
    setImagePreview("");
    productForm.setValue('image', '');
  };

  const handleCategoryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const error = validateImageFile(file);
    if (error) {
      toast({ 
        title: "Ошибка", 
        description: error,
        variant: "destructive"
      });
      return;
    }

    setCategoryImageFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setCategoryImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCategoryImage = async () => {
    if (!categoryImageFile) return;

    setIsUploadingCategoryImage(true);
    try {
      const imageUrl = await uploadImageToYandexStorage(categoryImageFile, 'categories');
      
      console.log("✅ Изображение категории загружено в Yandex Storage:", imageUrl);
      
      categoryForm.setValue('image', imageUrl, { 
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      
      console.log("✅ Поле image в форме установлено:", categoryForm.getValues('image'));
      
      toast({ 
        title: "Изображение загружено!", 
        description: `URL: ${imageUrl.substring(0, 50)}...` 
      });
    } catch (error: any) {
      toast({ 
        title: "Ошибка загрузки", 
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploadingCategoryImage(false);
    }
  };

  const handleClearCategoryImage = () => {
    setCategoryImageFile(null);
    setCategoryImagePreview("");
    categoryForm.setValue('image', '');
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    categoryForm.reset({
      id: category.id,
      name: category.name,
      slug: category.slug,
      image: category.image || "",
    });
    if (category.image) {
      setCategoryImagePreview(category.image);
    }
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    categoryForm.reset();
    setCategoryImageFile(null);
    setCategoryImagePreview("");
  };

  const handleCategorySubmit = (data: Category) => {
    if (editingCategory) {
      updateCategoryMutation.mutate(data);
    } else {
      addCategoryMutation.mutate(data);
    }
  };

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
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Админ-панель</h1>
          <p className="text-muted-foreground">Управление категориями и товарами</p>
        </div>
        <Button 
          variant="outline" 
          onClick={logout}
          data-testid="button-admin-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Выйти
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-8 mb-6">
          <TabsTrigger value="orders" data-testid="tab-orders">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Заказы ({allOrders.length})
          </TabsTrigger>
          <TabsTrigger value="reviews" data-testid="tab-reviews">
            <MessageSquare className="w-4 h-4 mr-2" />
            Отзывы ({allReviews.length})
          </TabsTrigger>
          <TabsTrigger value="promocodes" data-testid="tab-promocodes">
            <Ticket className="w-4 h-4 mr-2" />
            Промокоды
          </TabsTrigger>
          <TabsTrigger value="newsletter" data-testid="tab-newsletter">
            <Mail className="w-4 h-4 mr-2" />
            Рассылка ({newsletterSubscriptions.length})
          </TabsTrigger>
          <TabsTrigger value="stock-notifications" data-testid="tab-stock-notifications">
            <Bell className="w-4 h-4 mr-2" />
            Уведомления о товарах ({stockNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="products" data-testid="tab-products">
            <Package className="w-4 h-4 mr-2" />
            Товары
          </TabsTrigger>
          <TabsTrigger value="categories" data-testid="tab-categories">
            <FolderOpen className="w-4 h-4 mr-2" />
            Категории
          </TabsTrigger>
          <TabsTrigger value="settings" data-testid="tab-settings">
            <Palette className="w-4 h-4 mr-2" />
            Оформление
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
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-bold text-lg">{order.total} ₽</p>
                            <p className="text-sm text-muted-foreground">{order.items.length} товаров</p>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteOrderMutation.mutate(order.id)}
                            disabled={deleteOrderMutation.isPending}
                            data-testid={`button-delete-order-${order.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
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

                      {order.promoCode && (
                        <div className="flex items-center gap-2">
                          <Ticket className="w-4 h-4 text-primary" />
                          <Badge variant="secondary" className="text-xs" data-testid={`order-promo-${order.id}`}>
                            {order.promoCode.code} • -{order.promoCode.discountAmount} ₽
                          </Badge>
                        </div>
                      )}

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

        <TabsContent value="promocodes" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Создать промокод</CardTitle>
              <CardDescription>Добавьте новый промокод для скидок</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...promoCodeForm}>
                <form onSubmit={promoCodeForm.handleSubmit((data) => addPromoCodeMutation.mutate(data))} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={promoCodeForm.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Код промокода</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ЛЕТО2025" data-testid="input-promo-code" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={promoCodeForm.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Тип скидки</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-discount-type">
                                <SelectValue placeholder="Выберите тип" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="percentage">Процент (%)</SelectItem>
                              <SelectItem value="fixed">Фиксированная сумма (₽)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={promoCodeForm.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Размер скидки</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              placeholder="10" 
                              data-testid="input-discount-value" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={promoCodeForm.control}
                      name="minOrderAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Мин. сумма заказа (опц.)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              value={field.value || ""}
                              placeholder="1000" 
                              data-testid="input-min-order" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={promoCodeForm.control}
                      name="maxUses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Макс. использований (опц.)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              value={field.value || ""}
                              placeholder="100" 
                              data-testid="input-max-uses" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={promoCodeForm.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 pt-8">
                          <FormControl>
                            <input 
                              type="checkbox" 
                              checked={field.value} 
                              onChange={field.onChange}
                              className="w-4 h-4" 
                              data-testid="checkbox-promo-active" 
                            />
                          </FormControl>
                          <FormLabel className="!mt-0">Активен</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField
                      control={promoCodeForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата начала (опц.)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-start-date" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={promoCodeForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Дата окончания (опц.)</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              data-testid="input-end-date" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={addPromoCodeMutation.isPending} data-testid="button-add-promo">
                    <Plus className="w-4 h-4 mr-2" />
                    {addPromoCodeMutation.isPending ? "Создание..." : "Создать промокод"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Существующие промокоды</CardTitle>
              <CardDescription>Управление промокодами</CardDescription>
            </CardHeader>
            <CardContent>
              {promoCodesLoading ? (
                <p className="text-muted-foreground">Загрузка...</p>
              ) : promoCodes.length === 0 ? (
                <p className="text-muted-foreground">Промокодов пока нет</p>
              ) : (
                <div className="space-y-4">
                  {promoCodes.map((promo) => (
                    <div 
                      key={promo.id} 
                      className="border rounded-lg p-4 space-y-3" 
                      data-testid={`promo-${promo.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="bg-primary/10 px-3 py-1 rounded font-mono text-lg font-bold">
                              {promo.code}
                            </code>
                            <Badge variant={promo.active ? "default" : "secondary"}>
                              {promo.active ? "Активен" : "Неактивен"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">
                            Скидка: {promo.discountType === 'percentage' ? `${promo.discountValue}%` : `${promo.discountValue}₽`}
                            {promo.minOrderAmount && ` • От ${promo.minOrderAmount}₽`}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePromoCodeMutation.mutate(promo.id)}
                          disabled={deletePromoCodeMutation.isPending}
                          data-testid={`button-delete-promo-${promo.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Использований:</p>
                          <p className="font-medium">
                            {promoUsageCounts[promo.id] ?? 0}{promo.maxUses ? ` / ${promo.maxUses}` : ' / ∞'}
                          </p>
                        </div>
                        {(promo.startDate || promo.endDate) && (
                          <div>
                            <p className="text-muted-foreground">Период действия:</p>
                            <p className="font-medium">
                              {promo.startDate && promo.startDate.toLocaleDateString('ru-RU')}
                              {promo.startDate && promo.endDate && ' - '}
                              {promo.endDate && promo.endDate.toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={promo.active ? "outline" : "default"}
                          size="sm"
                          onClick={() => togglePromoCodeMutation.mutate({ id: promo.id, active: !promo.active })}
                          disabled={togglePromoCodeMutation.isPending}
                          data-testid={`button-toggle-promo-${promo.id}`}
                        >
                          {promo.active ? "Деактивировать" : "Активировать"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="newsletter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Массовая рассылка по Email</CardTitle>
              <CardDescription>
                Отправьте письмо всем подписчикам на рассылку ({newsletterSubscriptions.length} чел.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...newsletterForm}>
                <form
                  onSubmit={newsletterForm.handleSubmit(async (data) => {
                    try {
                      const emails = newsletterSubscriptions.map(sub => sub.email);
                      if (emails.length === 0) {
                        toast({
                          title: "Нет подписчиков",
                          description: "На рассылку пока никто не подписался",
                          variant: "destructive",
                        });
                        return;
                      }

                      const sentCount = await sendNewsletter(emails, {
                        subject: data.subject,
                        title: data.title,
                        message: data.message,
                      });

                      toast({
                        title: "Рассылка отправлена!",
                        description: `Успешно отправлено ${sentCount} из ${emails.length} писем`,
                      });
                      newsletterForm.reset();
                    } catch (error: any) {
                      toast({
                        title: "Ошибка отправки",
                        description: error.message,
                        variant: "destructive",
                      });
                    }
                  })}
                  className="space-y-4"
                >
                  <FormField
                    control={newsletterForm.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тема письма</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Магазин открыт!" data-testid="input-newsletter-subject" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newsletterForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Заголовок в письме</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Мы открылись!" data-testid="input-newsletter-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newsletterForm.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Текст письма (HTML)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="<p>Ваше сообщение...</p>" rows={8} data-testid="input-newsletter-message" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Можно использовать HTML: &lt;p&gt;, &lt;strong&gt;, &lt;a&gt; и т.д.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" data-testid="button-send-newsletter">
                    <Send className="w-4 h-4 mr-2" />
                    Отправить рассылку всем подписчикам
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Подписчики на рассылку</CardTitle>
              <CardDescription>
                Список email адресов подписанных на новости
              </CardDescription>
            </CardHeader>
            <CardContent>
              {newsletterLoading ? (
                <p className="text-muted-foreground">Загрузка...</p>
              ) : newsletterSubscriptions.length === 0 ? (
                <p className="text-muted-foreground">Пока нет подписчиков</p>
              ) : (
                <div className="space-y-2">
                  {newsletterSubscriptions.map((subscription) => (
                    <div
                      key={subscription.id}
                      className="border rounded-lg p-3 flex items-center justify-between gap-4"
                      data-testid={`newsletter-subscription-${subscription.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium">{subscription.email}</p>
                        <p className="text-xs text-muted-foreground">
                          Подписан: {subscription.createdAt.toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteNewsletterSubscriptionMutation.mutate(subscription.id)}
                        disabled={deleteNewsletterSubscriptionMutation.isPending}
                        data-testid={`button-delete-newsletter-${subscription.id}`}
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

        <TabsContent value="stock-notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Уведомления о товарах</CardTitle>
              <CardDescription>
                Email-подписки пользователей на уведомления о поступлении товаров
              </CardDescription>
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <p className="text-muted-foreground">Загрузка...</p>
              ) : stockNotifications.length === 0 ? (
                <p className="text-muted-foreground">Нет активных подписок</p>
              ) : (
                <div className="space-y-4">
                  {stockNotifications.map((notification) => {
                    const product = products.find(p => p.id === notification.productId);
                    return (
                      <div 
                        key={notification.id} 
                        className="border rounded-lg p-4 flex items-start justify-between gap-4"
                        data-testid={`notification-${notification.id}`}
                      >
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="font-semibold">{notification.productName}</p>
                            <p className="text-sm text-muted-foreground">ID товара: {notification.productId}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email:</p>
                            <p className="font-medium">{notification.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Дата подписки:</p>
                            <p className="font-medium">
                              {notification.createdAt.toLocaleDateString('ru-RU', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {product && (
                            <div>
                              <Badge variant={product.stock === 0 ? "destructive" : "outline"}>
                                {product.stock === 0 ? "Нет в наличии" : `В наличии: ${product.stock} шт`}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteStockNotificationMutation.mutate(notification.id)}
                            disabled={deleteStockNotificationMutation.isPending}
                            data-testid={`button-delete-notification-${notification.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Удалить
                          </Button>
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
              <CardTitle>{editingCategory ? "Редактировать категорию" : "Добавить категорию"}</CardTitle>
              <CardDescription>{editingCategory ? "Обновите данные категории" : "Создайте новую категорию товаров"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID категории</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="chocolates" disabled={!!editingCategory} data-testid="input-category-id" />
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
                  
                  <FormField
                    control={categoryForm.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Изображение категории (опционально)</FormLabel>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input 
                                type="file" 
                                accept="image/*"
                                onChange={handleCategoryFileChange}
                                className="cursor-pointer"
                                data-testid="input-category-image-file"
                              />
                            </div>
                            {categoryImageFile && (
                              <Button
                                type="button"
                                onClick={handleUploadCategoryImage}
                                disabled={isUploadingCategoryImage}
                                data-testid="button-upload-category-image"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {isUploadingCategoryImage ? "Загрузка..." : "Загрузить"}
                              </Button>
                            )}
                          </div>

                          {categoryImagePreview && (
                            <div className="relative inline-block">
                              <img 
                                src={categoryImagePreview} 
                                alt="Предпросмотр изображения категории Sweet Delights" 
                                className="max-w-xs max-h-48 rounded-lg border"
                                data-testid="category-image-preview"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={handleClearCategoryImage}
                                data-testid="button-clear-category-image"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}

                          <div className="text-sm text-muted-foreground">
                            или введите URL изображения вручную:
                          </div>

                          <FormControl>
                            <Input {...field} placeholder="https://example.com/category-image.jpg" data-testid="input-category-image-url" />
                          </FormControl>

                          {field.value && field.value.trim() !== "" && (
                            <div className="text-sm space-y-1">
                              <div className="text-green-600 font-semibold">
                                ✓ URL изображения установлен
                              </div>
                              <div className="text-xs text-muted-foreground break-all bg-muted/50 p-2 rounded">
                                {field.value}
                              </div>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending} 
                      data-testid="button-add-category"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {editingCategory 
                        ? (updateCategoryMutation.isPending ? "Сохранение..." : "Сохранить изменения")
                        : (addCategoryMutation.isPending ? "Добавление..." : "Добавить категорию")
                      }
                    </Button>
                    {editingCategory && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancelEditCategory}
                        data-testid="button-cancel-edit-category"
                      >
                        Отменить
                      </Button>
                    )}
                  </div>
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
                    <div key={cat.id} className="flex items-center justify-between gap-3 p-3 border rounded-md" data-testid={`category-${cat.id}`}>
                      <div className="flex items-center gap-3 flex-1">
                        {cat.image && (
                          <img 
                            src={cat.image} 
                            alt={`Изображение категории ${cat.name} Sweet Delights`}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        )}
                        <div>
                          <p className="font-medium">{cat.name}</p>
                          <p className="text-sm text-muted-foreground">ID: {cat.id} • Slug: {cat.slug}</p>
                          {cat.image && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[300px]">
                              Изображение: {cat.image}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCategory(cat)}
                          data-testid={`button-edit-category-${cat.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
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
                        <FormLabel>Изображение товара (опционально)</FormLabel>
                        <div className="space-y-4">
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                                className="cursor-pointer"
                                data-testid="input-product-image-file"
                              />
                            </div>
                            {selectedFile && (
                              <Button
                                type="button"
                                onClick={handleUploadImage}
                                disabled={isUploadingImage}
                                data-testid="button-upload-image"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                {isUploadingImage ? "Загрузка..." : "Загрузить"}
                              </Button>
                            )}
                          </div>

                          {imagePreview && (
                            <div className="relative inline-block">
                              <img 
                                src={imagePreview} 
                                alt="Предпросмотр изображения товара Sweet Delights" 
                                className="max-w-xs max-h-48 rounded-lg border"
                                data-testid="image-preview"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={handleClearImage}
                                data-testid="button-clear-image"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}

                          <div className="text-sm text-muted-foreground">
                            или введите URL изображения вручную:
                          </div>

                          <FormControl>
                            <Input {...field} placeholder="https://example.com/image.jpg" data-testid="input-product-image-url" />
                          </FormControl>

                          {field.value && field.value.trim() !== "" && (
                            <div className="text-sm space-y-1">
                              <div className="text-green-600 font-semibold">
                                ✓ URL изображения установлен
                              </div>
                              <div className="text-xs text-muted-foreground break-all bg-muted/50 p-2 rounded">
                                {field.value}
                              </div>
                            </div>
                          )}
                        </div>
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
                                  newStock: stock - 10,
                                  oldStock: stock,
                                  productName: product.name
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
                                  newStock: stock - 1,
                                  oldStock: stock,
                                  productName: product.name
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
                                  newStock: stock + 1,
                                  oldStock: stock,
                                  productName: product.name
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
                                  newStock: stock + 10,
                                  oldStock: stock,
                                  productName: product.name
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
                                  newStock: stock + 50,
                                  oldStock: stock,
                                  productName: product.name
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
                                  newStock: stock + 100,
                                  oldStock: stock,
                                  productName: product.name
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

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Оформление сайта</CardTitle>
              <CardDescription>Настройка внешнего вида и темы</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme-select" className="text-base font-semibold mb-3 block">
                    Выбрать тему сайта
                  </Label>
                  <Select value={currentTheme} onValueChange={(value) => setThemeMutation.mutate(value)}>
                    <SelectTrigger id="theme-select" data-testid="select-theme">
                      <SelectValue placeholder="Выберите тему" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sakura" data-testid="select-option-theme-sakura">
                        🌸 Сакура (текущая)
                      </SelectItem>
                      <SelectItem value="new-year" data-testid="select-option-theme-new-year">
                        🎄 Новогодняя
                      </SelectItem>
                      <SelectItem value="spring" data-testid="select-option-theme-spring">
                        🌼 Весенняя
                      </SelectItem>
                      <SelectItem value="autumn" data-testid="select-option-theme-autumn">
                        🍂 Осенняя
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-3">
                    Выбранная тема будет применена ко всему сайту для всех пользователей
                  </p>
                </div>

                {setThemeMutation.isPending && (
                  <div className="p-3 bg-muted rounded-md text-sm">
                    Применение темы...
                  </div>
                )}

                <div className="p-4 bg-card border rounded-lg space-y-3">
                  <div className="font-semibold text-sm">📋 Доступные темы:</div>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• <strong>🌸 Сакура</strong> - нежная розовая тема с японской эстетикой</li>
                    <li>• <strong>🎄 Новогодняя</strong> - красная и золотая праздничная тема</li>
                    <li>• <strong>🌼 Весенняя</strong> - светлые пастельные цвета (скоро)</li>
                    <li>• <strong>🍂 Осенняя</strong> - теплые осенние оттенки (скоро)</li>
                  </ul>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-4">🎨 Основная тема пользователей</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Выберите основную сезонную тему, которая будет применяться пользователям по умолчанию. Пользователи смогут переключаться между этой темой и темной версией.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['sakura', 'new-year', 'spring', 'autumn'] as const).map((theme) => {
                      const themeNames: Record<string, string> = {
                        'sakura': '🌸 Сакура',
                        'new-year': '🎄 Новый год',
                        'spring': '🌼 Весна',
                        'autumn': '🍂 Осень'
                      };
                      const isSelected = preferredTheme === theme;
                      return (
                        <Button
                          key={theme}
                          onClick={() => setPreferredTheme(theme)}
                          variant={isSelected ? "default" : "outline"}
                          className="w-full"
                          data-testid={`button-set-preferred-theme-${theme}`}
                        >
                          {themeNames[theme]}
                          {isSelected && <Check className="w-4 h-4 ml-2" />}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold mb-4">🎬 Управление слайдами героя</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Добавьте, отредактируйте или удалите слайды, которые показываются на главной странице
                  </p>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-sm">Текущие слайды:</h4>
                      <div className="flex gap-2">
                        {(['sakura', 'new-year', 'spring', 'autumn'] as const).map((theme) => {
                          const themeNames: Record<string, string> = {
                            'sakura': '🌸 Сакура',
                            'new-year': '🎄 Новый год',
                            'spring': '🌼 Весна',
                            'autumn': '🍂 Осень'
                          };
                          const isSelected = selectedSlidesTheme === theme;
                          return (
                            <Button
                              key={theme}
                              onClick={() => setSelectedSlidesTheme(theme)}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className="text-xs"
                              data-testid={`button-select-slides-theme-${theme}`}
                            >
                              {themeNames[theme]}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    {slidesLoading ? (
                      <div className="text-center py-4 text-muted-foreground">Загрузка слайдов...</div>
                    ) : (
                      <div className="space-y-2">
                        {heroSlides.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground">
                            Слайды еще не добавлены
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {heroSlides.map((slide, index) => (
                              <div
                                key={slide.id}
                                className={`border rounded-lg p-3 cursor-pointer transition-all hover-elevate ${
                                  editingSlideId === slide.id
                                    ? "bg-accent/10 border-accent"
                                    : "bg-card hover:bg-muted/50"
                                }`}
                                onClick={() => {
                                  setEditingSlideId(slide.id);
                                  setEditingSlideTitle(slide.title);
                                  setEditingSlideSubtitle(slide.subtitle);
                                  setSlideImagePreview(slide.image);
                                  setSlideImageFile(null);
                                }}
                                data-testid={`button-edit-slide-${slide.id}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm">
                                      {index + 1}. {slide.title}
                                      {slide.subtitle && ` → ${slide.subtitle}`}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 truncate">
                                      {slide.image}
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="ml-2 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newSlides = heroSlides.filter(s => s.id !== slide.id);
                                      saveHeroSlidesMutation.mutate(newSlides);
                                    }}
                                    data-testid={`button-delete-slide-${slide.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {editingSlideId !== null && (
                    <div className="mt-6 p-4 border-2 border-accent bg-accent/5 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-sm">✏️ Редактирование слайда</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingSlideId(null);
                            setEditingSlideTitle("");
                            setEditingSlideSubtitle("");
                            setSlideImageFile(null);
                            setSlideImagePreview("");
                          }}
                          data-testid="button-close-edit"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Заголовок слайда</Label>
                          <Input
                            type="text"
                            value={editingSlideTitle}
                            onChange={(e) => setEditingSlideTitle(e.target.value)}
                            placeholder="Введите заголовок"
                            data-testid="input-edit-slide-title"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium mb-1 block">Подзаголовок слайда (опционально)</Label>
                          <Input
                            type="text"
                            value={editingSlideSubtitle}
                            onChange={(e) => setEditingSlideSubtitle(e.target.value)}
                            placeholder="Введите подзаголовок"
                            data-testid="input-edit-slide-subtitle"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium mb-1 block">Изображение (опционально - оставьте пустым для сохранения текущего)</Label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const error = validateImageFile(file);
                                    if (error) {
                                      toast({
                                        title: "Ошибка",
                                        description: error,
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    setSlideImageFile(file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setSlideImagePreview(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                data-testid="input-edit-slide-image"
                              />
                            </div>
                            {slideImageFile && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSlideImageFile(null);
                                  const currentSlide = heroSlides.find(s => s.id === editingSlideId);
                                  if (currentSlide) {
                                    setSlideImagePreview(currentSlide.image);
                                  }
                                }}
                                data-testid="button-clear-edit-image"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {slideImagePreview && (
                          <div className="relative inline-block">
                            <img
                              src={slideImagePreview}
                              alt="Предпросмотр редактируемого слайда"
                              className="max-w-xs max-h-32 rounded border"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            onClick={async () => {
                              if (!editingSlideTitle.trim()) {
                                toast({
                                  title: "Ошибка",
                                  description: "Заголовок не может быть пустым",
                                  variant: "destructive"
                                });
                                return;
                              }

                              setIsSavingSlide(true);
                              try {
                                let imageUrl = slideImagePreview;

                                // Загружаем новое изображение если оно выбрано
                                if (slideImageFile) {
                                  imageUrl = await uploadImageToYandexStorage(slideImageFile, 'hero-slides');
                                }

                                // Обновляем слайд в массиве
                                const updatedSlides = heroSlides.map(slide => {
                                  if (slide.id === editingSlideId) {
                                    return {
                                      ...slide,
                                      title: editingSlideTitle,
                                      subtitle: editingSlideSubtitle,
                                      image: imageUrl,
                                      webpImage: imageUrl,
                                    };
                                  }
                                  return slide;
                                });

                                await saveHeroSlidesMutation.mutateAsync(updatedSlides);

                                // Закрываем форму редактирования
                                setEditingSlideId(null);
                                setEditingSlideTitle("");
                                setEditingSlideSubtitle("");
                                setSlideImageFile(null);
                                setSlideImagePreview("");

                                toast({
                                  title: "Слайд сохранен!",
                                  description: "Изменения применены"
                                });
                              } catch (error: any) {
                                toast({
                                  title: "Ошибка сохранения",
                                  description: error.message,
                                  variant: "destructive"
                                });
                              } finally {
                                setIsSavingSlide(false);
                              }
                            }}
                            disabled={isSavingSlide || saveHeroSlidesMutation.isPending}
                            data-testid="button-save-slide"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {isSavingSlide ? "Сохранение..." : "Сохранить"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingSlideId(null);
                              setEditingSlideTitle("");
                              setEditingSlideSubtitle("");
                              setSlideImageFile(null);
                              setSlideImagePreview("");
                            }}
                            data-testid="button-cancel-edit"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">Добавить новый слайд</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium mb-1 block">Загруженные слайды используют формат: image (PNG/JPG) и webpImage (WebP)</Label>
                        <div className="flex gap-2 mt-2">
                          <div className="flex-1">
                            <Input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const error = validateImageFile(file);
                                  if (error) {
                                    toast({ 
                                      title: "Ошибка", 
                                      description: error,
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  setSlideImageFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setSlideImagePreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              data-testid="input-slide-image"
                            />
                          </div>
                          {slideImageFile && (
                            <Button
                              type="button"
                              onClick={async () => {
                                if (!slideImageFile) return;
                                setIsUploadingSlideImage(true);
                                try {
                                  const imageUrl = await uploadImageToYandexStorage(slideImageFile, 'hero-slides');
                                  const newSlide: HeroSlide = {
                                    id: Math.max(...heroSlides.map(s => s.id), 0) + 1,
                                    title: `Слайд ${heroSlides.length + 1}`,
                                    subtitle: '',
                                    image: imageUrl,
                                    webpImage: imageUrl,
                                  };
                                  saveHeroSlidesMutation.mutate([...heroSlides, newSlide]);
                                  setSlideImageFile(null);
                                  setSlideImagePreview('');
                                } catch (error: any) {
                                  toast({ 
                                    title: "Ошибка загрузки", 
                                    description: error.message,
                                    variant: "destructive"
                                  });
                                } finally {
                                  setIsUploadingSlideImage(false);
                                }
                              }}
                              disabled={isUploadingSlideImage}
                              data-testid="button-upload-slide"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {isUploadingSlideImage ? "Загрузка..." : "Загрузить"}
                            </Button>
                          )}
                        </div>
                      </div>

                      {slideImagePreview && (
                        <div className="relative inline-block">
                          <img 
                            src={slideImagePreview} 
                            alt="Предпросмотр слайда" 
                            className="max-w-xs max-h-32 rounded border"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1"
                            onClick={() => {
                              setSlideImageFile(null);
                              setSlideImagePreview('');
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6 space-y-4">
                <div>
                  <h3 className="text-base font-semibold mb-4">🖼️ Управление фонами тем</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Загрузьте фоновые изображения для каждой темы сайта
                  </p>

                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-3">Текущие фоны:</h4>
                    {backgroundsLoading ? (
                      <div className="text-center py-4 text-muted-foreground">Загрузка фонов...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {(['sakura', 'newyear', 'spring', 'autumn'] as Array<keyof BackgroundSettings>).map((theme) => {
                          const bg = backgroundSettings[theme];
                          const themeLabel = theme === 'newyear' ? '🎄 Новогодняя' : 
                                            theme === 'sakura' ? '🌸 Сакура' :
                                            theme === 'spring' ? '🌼 Весенняя' : '🍂 Осенняя';
                          return (
                            <div
                              key={theme}
                              className={`border rounded-lg p-3 cursor-pointer transition-all hover-elevate ${
                                editingBackgroundTheme === theme
                                  ? "bg-accent/10 border-accent"
                                  : "bg-card hover:bg-muted/50"
                              }`}
                              onClick={() => {
                                setEditingBackgroundTheme(theme);
                                setEditingBackgroundTitle(bg?.title || '');
                                setBackgroundImagePreview(bg?.webpImage || bg?.image || '');
                                setBackgroundImageFile(null);
                              }}
                              data-testid={`button-edit-background-${theme}`}
                            >
                              <div className="text-sm font-semibold mb-2">{themeLabel}</div>
                              {bg?.webpImage || bg?.image ? (
                                <img 
                                  src={bg.webpImage || bg.image}
                                  alt={themeLabel}
                                  className="w-full h-24 object-cover rounded border"
                                />
                              ) : (
                                <div className="w-full h-24 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                                  Нет фона
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {editingBackgroundTheme !== null && (
                    <div className="mt-4 p-4 border-2 border-accent bg-accent/5 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-sm">✏️ Редактирование фона</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBackgroundTheme(null);
                            setEditingBackgroundTitle("");
                            setBackgroundImageFile(null);
                            setBackgroundImagePreview("");
                          }}
                          data-testid="button-close-background-edit"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs font-medium mb-1 block">Название (опционально)</Label>
                          <Input
                            type="text"
                            value={editingBackgroundTitle}
                            onChange={(e) => setEditingBackgroundTitle(e.target.value)}
                            placeholder="Введите название фона"
                            data-testid="input-edit-background-title"
                          />
                        </div>

                        <div>
                          <Label className="text-xs font-medium mb-1 block">Изображение (опционально - оставьте пустым для сохранения текущего)</Label>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const error = validateImageFile(file);
                                    if (error) {
                                      toast({
                                        title: "Ошибка",
                                        description: error,
                                        variant: "destructive"
                                      });
                                      return;
                                    }
                                    setBackgroundImageFile(file);
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      setBackgroundImagePreview(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                data-testid="input-edit-background-image"
                              />
                            </div>
                            {backgroundImageFile && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setBackgroundImageFile(null);
                                  if (backgroundSettings[editingBackgroundTheme]) {
                                    setBackgroundImagePreview(
                                      backgroundSettings[editingBackgroundTheme].webpImage || 
                                      backgroundSettings[editingBackgroundTheme].image || 
                                      ""
                                    );
                                  }
                                }}
                                data-testid="button-clear-background-image"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {backgroundImagePreview && (
                          <div className="relative inline-block">
                            <img
                              src={backgroundImagePreview}
                              alt="Предпросмотр фона"
                              className="max-w-xs max-h-32 rounded border"
                            />
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            type="button"
                            onClick={async () => {
                              setIsSavingBackground(true);
                              try {
                                let imageUrl = backgroundImagePreview;

                                // Загружаем новое изображение если оно выбрано
                                if (backgroundImageFile) {
                                  imageUrl = await uploadImageToYandexStorage(
                                    backgroundImageFile, 
                                    `backgrounds/${editingBackgroundTheme}`
                                  );
                                }

                                // Обновляем фон в настройках
                                const updated: BackgroundSettings = {
                                  ...backgroundSettings,
                                  [editingBackgroundTheme]: {
                                    image: imageUrl,
                                    webpImage: imageUrl,
                                    title: editingBackgroundTitle,
                                  }
                                };

                                await setBackgroundSettings(updated);
                                setBackgroundSettingsState(updated);

                                // Закрываем форму редактирования
                                setEditingBackgroundTheme(null);
                                setEditingBackgroundTitle("");
                                setBackgroundImageFile(null);
                                setBackgroundImagePreview("");

                                toast({
                                  title: "Фон сохранен!",
                                  description: "Изменения применены"
                                });
                              } catch (error: any) {
                                toast({
                                  title: "Ошибка сохранения",
                                  description: error.message,
                                  variant: "destructive"
                                });
                              } finally {
                                setIsSavingBackground(false);
                              }
                            }}
                            disabled={isSavingBackground}
                            data-testid="button-save-background"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {isSavingBackground ? "Сохранение..." : "Сохранить"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setEditingBackgroundTheme(null);
                              setEditingBackgroundTitle("");
                              setBackgroundImageFile(null);
                              setBackgroundImagePreview("");
                            }}
                            data-testid="button-cancel-background-edit"
                          >
                            Отмена
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
