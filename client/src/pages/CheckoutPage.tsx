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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ChevronRight, ShoppingBag, Check } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import { createOrder } from "@/services/yandex-orders";
import { validatePromoCode } from "@/services/yandex-promocodes";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWheel } from "@/contexts/WheelContext";
import { getAllProducts, initRobokassaPayment } from "@/services/api-client";
import { DeliverySelector } from "@/components/DeliverySelector";
import { CdekPointSelector } from "@/components/CdekPointSelector";
import { DeliveryCalculator } from "@/components/DeliveryCalculator";

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
  payment: z.literal("card"),
  privacyConsent: z.boolean().refine((val) => val === true, {
    message: "Необходимо согласие на обработку персональных данных",
  }),
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
  
  const [bonusDiscount, setBonusDiscount] = useState(0);
  const [bonusInput, setBonusInput] = useState("");
  const [isBonusApplied, setIsBonusApplied] = useState(false);
  
  const [deliveryService, setDeliveryService] = useState<string | null>(null);
  const [deliveryType, setDeliveryType] = useState<string | null>(null);
  const [selectedCdekPoint, setSelectedCdekPoint] = useState<any>(null);
  const [cdekDeliveryCost, setCdekDeliveryCost] = useState<number>(0);
  const [cdekTariffCode, setCdekTariffCode] = useState<number | null>(null);
  const [cdekEstimatedDays, setCdekEstimatedDays] = useState<number | null>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const { loyaltyPoints, refreshStatus } = useWheel();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Guard: проверка старых pendingPaymentOrderId
  useEffect(() => {
    const checkPendingPayment = async () => {
      const pendingOrderId = localStorage.getItem('pendingPaymentOrderId');
      
      if (!pendingOrderId) {
        return;
      }

      console.log('🔍 Найден старый pendingPaymentOrderId:', pendingOrderId);

      try {
        const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL;
        const response = await fetch(
          `${API_GATEWAY_URL}/api/payment/robokassa/check?orderId=${pendingOrderId}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.isPaid) {
            console.log('✅ Старый заказ оплачен, очищаем корзину');
            clearCart();
            localStorage.removeItem('pendingPaymentOrderId');
            
            toast({
              title: "Ваш предыдущий заказ оплачен",
              description: `Заказ #${pendingOrderId.substring(0, 8).toUpperCase()} успешно завершен`,
            });
          } else if (data.isFailed) {
            console.log('❌ Старый заказ не оплачен, удаляем из localStorage');
            localStorage.removeItem('pendingPaymentOrderId');
          }
        }
      } catch (error) {
        console.error('Ошибка проверки старого заказа:', error);
      }
    };

    checkPendingPayment();
  }, [clearCart, toast]);

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
      payment: "card",
      privacyConsent: false,
    },
  });

  const paymentOptions = [
    { id: "card", name: "Банковская карта", description: "Оплата онлайн картой" },
  ];

  const POST_RUSSIA_PRICE = 200;
  const deliveryPrice = deliveryService === 'CDEK' 
    ? cdekDeliveryCost 
    : deliveryService === 'POST' 
      ? POST_RUSSIA_PRICE 
      : 0;
  const subtotal = total + deliveryPrice;
  const totalDiscount = promoDiscount + bonusDiscount;
  const finalTotal = Math.max(0, subtotal - totalDiscount);
  
  const totalWeight = cartItems.reduce((sum, item) => sum + (item.quantity * 250), 0);
  const deliveryPackages = [{
    weight: totalWeight,
    height: 10,
    width: 10,
    length: 10
  }];

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
      const result = await validatePromoCode(promoCodeInput, subtotal, deliveryPrice);
      
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

  const maxBonusAllowed = Math.floor(subtotal * 0.5);

  const handleApplyBonus = () => {
    const requestedBonus = parseInt(bonusInput) || 0;
    
    if (requestedBonus <= 0) {
      toast({
        title: "Введите количество баллов",
        variant: "destructive",
      });
      return;
    }

    if (requestedBonus > loyaltyPoints) {
      toast({
        title: "Недостаточно баллов",
        description: `У вас есть только ${loyaltyPoints} баллов`,
        variant: "destructive",
      });
      return;
    }

    if (requestedBonus > maxBonusAllowed) {
      toast({
        title: "Превышен лимит на использование баллов",
        description: `Максимум ${maxBonusAllowed}₽ (50% от суммы заказа)`,
        variant: "destructive",
      });
      return;
    }

    setBonusDiscount(requestedBonus);
    setIsBonusApplied(true);
    toast({
      title: "Баллы применены!",
      description: `Скидка: ${requestedBonus}₽`,
    });
  };

  const handleRemoveBonus = () => {
    setBonusDiscount(0);
    setBonusInput("");
    setIsBonusApplied(false);
    toast({
      title: "Баллы удалены",
    });
  };

  const onSubmit = async (data: CheckoutFormData) => {
    if (!deliveryService) {
      toast({
        title: "Выберите способ доставки",
        description: "Пожалуйста, выберите СДЭК или Почту России",
        variant: "destructive",
      });
      return;
    }

    if (deliveryService === 'CDEK') {
      if (!deliveryType) {
        toast({
          title: "Выберите тип доставки",
          description: "Пожалуйста, выберите способ доставки СДЭК",
          variant: "destructive",
        });
        return;
      }
      
      if (deliveryType === 'PICKUP' && !selectedCdekPoint) {
        toast({
          title: "Выберите пункт выдачи",
          description: "Пожалуйста, выберите пункт выдачи СДЭК",
          variant: "destructive",
        });
        return;
      }
      
      if (!cdekTariffCode || cdekDeliveryCost === 0) {
        toast({
          title: "Рассчитайте стоимость доставки",
          description: "Пожалуйста, нажмите кнопку 'Рассчитать доставку'",
          variant: "destructive",
        });
        return;
      }
    }

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
        userId: user?.userId || 'guest',
        userEmail: user?.email || data.email,
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

      if (bonusDiscount > 0) {
        orderData.bonusPointsUsed = bonusDiscount;
      }

      if (deliveryService === 'CDEK') {
        orderData.deliveryService = 'CDEK';
        orderData.deliveryType = deliveryType;
        orderData.deliveryCalculatedAt = new Date().toISOString();
        
        if (selectedCdekPoint) {
          orderData.deliveryPointCode = selectedCdekPoint.code;
          orderData.deliveryPointName = selectedCdekPoint.name;
          orderData.deliveryPointAddress = selectedCdekPoint.location.address_full;
        }
        
        if (cdekTariffCode) {
          orderData.cdekTariffCode = cdekTariffCode;
        }
        
        if (cdekDeliveryCost) {
          orderData.cdekDeliveryCost = cdekDeliveryCost;
        }
        
        if (cdekEstimatedDays) {
          orderData.estimatedDeliveryDays = cdekEstimatedDays;
        }
        
        orderData.deliveryRecipientName = `${data.firstName} ${data.lastName}`;
        orderData.deliveryRecipientPhone = data.phone;
      } else if (deliveryService === 'POST') {
        orderData.deliveryService = 'POST';
        orderData.deliveryType = 'POST';
        orderData.deliveryCost = POST_RUSSIA_PRICE;
        orderData.estimatedDeliveryDays = 7;
      }

      console.log('🔍 CheckoutPage - Creating order with data:', {
        userId: orderData.userId,
        userEmail: orderData.userEmail,
        customerEmail: orderData.customerEmail,
        total: orderData.total,
        user_email: user?.email,
        data_email: data.email,
      });

      const orderId = await createOrder(orderData);

      // ВАЖНО: Email-подтверждение отправляется ПОСЛЕ успешной оплаты
      // через robokassa-callback Cloud Function, а не здесь!
      // Это гарантирует, что письмо придет только если оплата прошла успешно.

      try {
        const paymentResult = await initRobokassaPayment(
          orderId, 
          finalTotal, 
          data.email,
          `Заказ #${orderId.substring(0, 8).toUpperCase()}`
        );
        
        if (paymentResult.success && paymentResult.paymentUrl) {
          localStorage.setItem('pendingPaymentOrderId', orderId);
          
          // Обновляем статус рулетки (баллы будут пересчитаны на сервере)
          await refreshStatus();
          
          toast({
            title: "Заказ успешно оформлен!",
            description: `Номер заказа: ${orderId.substring(0, 8).toUpperCase()}. Переадресация на оплату...`,
          });
          
          window.location.href = paymentResult.paymentUrl;
        } else {
          throw new Error('Не удалось получить ссылку на оплату');
        }
      } catch (paymentError: any) {
        console.error('Ошибка инициализации платежа:', paymentError);
        toast({
          title: "Ошибка инициализации оплаты",
          description: paymentError.message || "Не удалось перейти к оплате. Попробуйте еще раз или свяжитесь с поддержкой.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Контактная информация</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-first-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Фамилия</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-last-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} data-testid="input-email" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Телефон</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Адрес доставки</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Адрес</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Город</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Почтовый индекс</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-postal-code" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Способ доставки</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <DeliverySelector
                        onSelect={(service, type) => {
                          setDeliveryService(service);
                          setDeliveryType(type);
                          setSelectedCdekPoint(null);
                          setCdekDeliveryCost(0);
                          setCdekTariffCode(null);
                          setCdekEstimatedDays(null);
                        }}
                      />

                      {deliveryService === 'CDEK' && deliveryType === 'PICKUP' && (
                        <>
                          <CdekPointSelector
                            cityCode={270}
                            onSelect={(point) => {
                              setSelectedCdekPoint(point);
                              setCdekDeliveryCost(0);
                              setCdekTariffCode(null);
                              setCdekEstimatedDays(null);
                            }}
                          />

                          {selectedCdekPoint && (
                            <DeliveryCalculator
                              cityCode={selectedCdekPoint.location.city_code}
                              packages={deliveryPackages}
                              onCalculated={(cost, days, tariffCode) => {
                                setCdekDeliveryCost(cost);
                                setCdekEstimatedDays(days);
                                setCdekTariffCode(tariffCode);
                              }}
                            />
                          )}
                        </>
                      )}

                      {deliveryService === 'CDEK' && deliveryType === 'DOOR' && (
                        <DeliveryCalculator
                          cityCode={270}
                          packages={deliveryPackages}
                          onCalculated={(cost, days, tariffCode) => {
                            setCdekDeliveryCost(cost);
                            setCdekEstimatedDays(days);
                            setCdekTariffCode(tariffCode);
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Способ оплаты</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="payment"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-3"
                              >
                                {paymentOptions.map((option) => (
                                  <div key={option.id} className="flex items-center space-x-3 border rounded-lg p-4 hover-elevate">
                                    <RadioGroupItem value={option.id} id={option.id} data-testid={`radio-payment-${option.id}`} />
                                    <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                                      <div className="font-medium">{option.name}</div>
                                      <div className="text-sm text-muted-foreground">{option.description}</div>
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <FormField
                        control={form.control}
                        name="privacyConsent"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-privacy-consent"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                Я согласен с{" "}
                                <Link 
                                  href="/privacy" 
                                  className="text-primary hover:underline font-medium"
                                  data-testid="link-privacy-consent"
                                  target="_blank"
                                >
                                  политикой конфиденциальности
                                </Link>
                                {" "}и даю согласие на обработку моих персональных данных
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full" 
                    disabled={
                      isSubmitting || 
                      cartItems.length === 0 ||
                      !deliveryService ||
                      (deliveryService === 'CDEK' && (
                        !deliveryType || 
                        (deliveryType === 'PICKUP' && !selectedCdekPoint) ||
                        !cdekTariffCode ||
                        cdekDeliveryCost === 0
                      ))
                    } 
                    data-testid="button-place-order"
                  >
                    {isSubmitting ? "Обработка..." : "Оформить заказ"}
                  </Button>
                </form>
              </Form>
            </div>

            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Ваш заказ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3" data-testid={`order-item-${item.id}`}>
                        <img src={item.image} alt={`${item.name} - цена ${item.price}₽ в корзине Sweet Delights`} className="w-16 h-16 object-cover rounded" />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{item.name}</div>
                          <div className="text-sm text-muted-foreground">Количество: {item.quantity}</div>
                        </div>
                        <div className="font-semibold">{item.price * item.quantity}₽</div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Товары</span>
                      <span data-testid="text-subtotal">{total}₽</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Доставка</span>
                      <span data-testid="text-delivery">{deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice}₽`}</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Скидка по промокоду</span>
                        <span data-testid="text-discount">-{promoDiscount}₽</span>
                      </div>
                    )}
                    {bonusDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Скидка баллами</span>
                        <span data-testid="text-bonus-discount">-{bonusDiscount}₽</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Итого</span>
                    <span data-testid="text-total">{finalTotal}₽</span>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Промокод</Label>
                      {!promoCode ? (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Введите промокод"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value)}
                            data-testid="input-promo-code"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleApplyPromoCode}
                            disabled={isCheckingPromo}
                            data-testid="button-apply-promo"
                          >
                            {isCheckingPromo ? "..." : "Применить"}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">{promoCode}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemovePromoCode}
                            data-testid="button-remove-promo"
                          >
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Бонусные баллы <span className="text-muted-foreground">({loyaltyPoints} доступно)</span></Label>
                      {!isBonusApplied ? (
                        <>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Введите количество баллов"
                              value={bonusInput}
                              onChange={(e) => setBonusInput(e.target.value)}
                              min="0"
                              max={maxBonusAllowed}
                              data-testid="input-bonus-amount"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleApplyBonus}
                              disabled={loyaltyPoints === 0}
                              data-testid="button-apply-bonus"
                            >
                              Применить
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Максимум можно потратить: <span className="font-semibold text-primary">{maxBonusAllowed}₽</span> (50% от суммы заказа)</p>
                        </>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">{bonusDiscount} баллов</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveBonus}
                            data-testid="button-remove-bonus"
                          >
                            Удалить
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}