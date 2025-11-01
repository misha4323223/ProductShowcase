import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ShoppingBag, Check } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { createOrder } from "@/services/yandex-orders";
import { validatePromoCode } from "@/services/yandex-promocodes";
import { useAuth } from "@/contexts/AuthContext";
import { sendOrderConfirmation } from "@/services/emailjs";
import { getAllProducts } from "@/services/yandex-products";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const checkoutSchema = z.object({
  firstName: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  lastName: z.string().min(2, "Фамилия должна содержать минимум 2 символа"),
  email: z.string().email("Некорректный email"),
  phone: z.string().min(10, "Некорректный номер телефона"),
  address: z.string().min(5, "Адрес должен содержать минимум 5 символов"),
  city: z.string().min(2, "Город должен содержать минимум 2 символа"),
  postalCode: z.string().min(5, "Некорректный почтовый индекс"),
  delivery: z.enum(["courier", "pickup", "post"]),
  payment: z.enum(["card", "cash", "online"]),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [validPromoCodeId, setValidPromoCodeId] = useState<string | null>(null);
  const [validatedPromoCode, setValidatedPromoCode] = useState<{ code: string; discountAmount: number; discountType: 'percentage' | 'fixed' } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const cartItemsStr = localStorage.getItem('cartItems');
  const cartItems: CartItem[] = cartItemsStr ? JSON.parse(cartItemsStr) : [];
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postalCode: "",
      delivery: "courier",
      payment: "card",
    },
  });

  const deliveryOptions = [
    { id: "courier", name: "Курьерская доставка", price: 300, description: "Доставка в течение 1-3 дней" },
    { id: "pickup", name: "Самовывоз", price: 0, description: "Бесплатно из нашего магазина" },
    { id: "post", name: "Почта России", price: 200, description: "Доставка в течение 5-10 дней" },
  ];

  const paymentOptions = [
    { id: "card", name: "Банковская карта", description: "Оплата онлайн картой" },
    { id: "cash", name: "Наличными при получении", description: "Оплата курьеру" },
    { id: "online", name: "Электронный кошелек", description: "Яндекс.Деньги, QIWI" },
  ];

  const selectedDelivery = deliveryOptions.find(opt => opt.id === form.watch("delivery"));
  const deliveryPrice = selectedDelivery?.price || 0;
  const subtotal = total + deliveryPrice;
  const finalTotal = Math.max(0, subtotal - promoDiscount);

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      toast({
        title: "Введите промокод",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingPromo(true);
    try {
      const result = await validatePromoCode(promoCodeInput, subtotal);
      
      if (result.valid && result.promoCode && result.discountAmount) {
        setPromoCode(result.promoCode.code);
        setPromoDiscount(result.discountAmount);
        setValidPromoCodeId(result.promoCode.id);
        setValidatedPromoCode({
          code: result.promoCode.code,
          discountAmount: result.discountAmount,
          discountType: result.promoCode.discountType,
        });
        toast({
          title: "Промокод применён!",
          description: `Скидка: ${result.discountAmount}₽`,
        });
      } else {
        toast({
          title: "Промокод недействителен",
          description: result.message || "Проверьте правильность ввода",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось применить промокод",
        variant: "destructive",
      });
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleRemovePromoCode = () => {
    setPromoCode("");
    setPromoCodeInput("");
    setPromoDiscount(0);
    setValidPromoCodeId(null);
    setValidatedPromoCode(null);
    toast({
      title: "Промокод удалён",
    });
  };

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    try {
      const productsData = await getAllProducts();
      
      for (const cartItem of cartItems) {
        const product = productsData?.find((p: any) => p.id === cartItem.id);
        if (!product) {
          toast({
            title: "Товар не найден",
            description: `Товар "${cartItem.name}" больше не доступен`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        if (product.stock !== undefined && product.stock < cartItem.quantity) {
          toast({
            title: "Недостаточно товара",
            description: `Товара "${cartItem.name}" на складе только ${product.stock} шт., а в корзине ${cartItem.quantity} шт.`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        if (product.stock === 0) {
          toast({
            title: "Товар закончился",
            description: `Товар "${cartItem.name}" закончился на складе`,
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      }

      const orderData: any = {
        userId: user?.uid || 'guest',
        items: cartItems.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        total: finalTotal,
        status: 'pending' as const,
        customerName: `${data.firstName} ${data.lastName}`,
        customerEmail: data.email,
        customerPhone: data.phone,
        shippingAddress: `${data.address}, ${data.city}, ${data.postalCode}`,
      };

      if (promoDiscount > 0) {
        orderData.subtotal = subtotal;
        orderData.discount = promoDiscount;
        orderData.promoCode = validatedPromoCode;
      }

      const orderId = await createOrder(orderData);

      try {
        await sendOrderConfirmation({
          customerEmail: data.email,
          customerName: `${data.firstName} ${data.lastName}`,
          orderNumber: orderId.substring(0, 8).toUpperCase(),
          orderDate: new Date().toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }),
          items: cartItems.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
          totalAmount: finalTotal,
          shippingAddress: `${data.address}, ${data.city}, ${data.postalCode}`,
          phone: data.phone,
        });
      } catch (emailError) {
        console.error('Не удалось отправить email:', emailError);
      }

      toast({
        title: "Заказ успешно оформлен!",
        description: `Номер заказа: ${orderId.substring(0, 8).toUpperCase()}. Мы свяжемся с вами в ближайшее время.`,
      });
      
      localStorage.removeItem('cartItems');
      
      setTimeout(() => setLocation('/'), 2000);
    } catch (error: any) {
      toast({
        title: "Ошибка оформления заказа",
        description: error.message || "Попробуйте еще раз",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header cartCount={0} onCartClick={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">Корзина пуста</h1>
            <p className="text-muted-foreground mb-6">Добавьте товары в корзину, чтобы оформить заказ</p>
            <Link href="/"><Button data-testid="button-go-shopping">Перейти к покупкам</Button></Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col candy-pattern">
      <Header cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} onCartClick={() => {}} />
      <main className="flex-1 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-pink-400 via-pink-500 to-pink-600 hover:scale-110 transition-all shadow-md hover:shadow-lg jelly-wobble" style={{textShadow:'0 1px 2px rgba(0,0,0,0.3)', boxShadow:'0 3px 0 rgba(219, 39, 119, 0.4), 0 4px 8px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'}} data-testid="breadcrumb-home">Главная</Link>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-green-400 via-emerald-500 to-green-600 shadow-md" style={{textShadow:'0 1px 2px rgba(0,0,0,0.3)', boxShadow:'0 3px 0 rgba(34, 197, 94, 0.4), 0 4px 8px rgba(16, 185, 129, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'}} data-testid="breadcrumb-checkout">Оформление заказа</span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600" data-testid="text-checkout-title">Оформление заказа</h1>

          {/* Далее форма и блок заказа остаются как в твоем коде */}
        </div>
      </main>
      <Footer />
    </div>
  );
}