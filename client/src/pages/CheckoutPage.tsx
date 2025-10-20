import { useState } from "react";
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
  const { toast } = useToast();

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
  const finalTotal = total + deliveryPrice;

  const onSubmit = async (data: CheckoutFormData) => {
    setIsSubmitting(true);

    setTimeout(() => {
      console.log("Заказ оформлен:", data);
      toast({
        title: "Заказ успешно оформлен!",
        description: `Номер заказа: ${Math.random().toString(36).substr(2, 9).toUpperCase()}. Мы свяжемся с вами в ближайшее время.`,
      });
      
      localStorage.removeItem('cartItems');
      
      setTimeout(() => {
        setLocation('/');
      }, 2000);
    }, 1500);
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col candy-pattern">
        <Header cartCount={0} onCartClick={() => {}} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-muted-foreground mb-4">
              Корзина пуста
            </h1>
            <p className="text-muted-foreground mb-6">
              Добавьте товары в корзину, чтобы оформить заказ
            </p>
            <Link href="/">
              <Button data-testid="button-go-shopping">
                Перейти к покупкам
              </Button>
            </Link>
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-primary transition-colors" data-testid="breadcrumb-home">
              Главная
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium" data-testid="breadcrumb-checkout">
              Оформление заказа
            </span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-primary to-purple-600" data-testid="text-checkout-title">
            Оформление заказа
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          1
                        </span>
                        Контактные данные
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя</FormLabel>
                              <FormControl>
                                <Input placeholder="Иван" {...field} data-testid="input-first-name" />
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
                                <Input placeholder="Иванов" {...field} data-testid="input-last-name" />
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
                              <Input type="email" placeholder="ivan@example.com" {...field} data-testid="input-email" />
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
                              <Input type="tel" placeholder="+7 (999) 123-45-67" {...field} data-testid="input-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          2
                        </span>
                        Адрес доставки
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Город</FormLabel>
                              <FormControl>
                                <Input placeholder="Москва" {...field} data-testid="input-city" />
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
                                <Input placeholder="123456" {...field} data-testid="input-postal-code" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Адрес</FormLabel>
                            <FormControl>
                              <Input placeholder="Улица, дом, квартира" {...field} data-testid="input-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          3
                        </span>
                        Способ доставки
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="delivery"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="space-y-3"
                              >
                                {deliveryOptions.map((option) => (
                                  <div
                                    key={option.id}
                                    className="flex items-start space-x-3 rounded-lg border p-4 hover-elevate cursor-pointer"
                                    onClick={() => field.onChange(option.id)}
                                    data-testid={`delivery-option-${option.id}`}
                                  >
                                    <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                                    <div className="flex-1">
                                      <Label htmlFor={option.id} className="cursor-pointer">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-semibold">{option.name}</span>
                                          <span className="font-bold text-primary">
                                            {option.price === 0 ? "Бесплатно" : `${option.price} ₽`}
                                          </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{option.description}</p>
                                      </Label>
                                    </div>
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
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          4
                        </span>
                        Способ оплаты
                      </CardTitle>
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
                                  <div
                                    key={option.id}
                                    className="flex items-start space-x-3 rounded-lg border p-4 hover-elevate cursor-pointer"
                                    onClick={() => field.onChange(option.id)}
                                    data-testid={`payment-option-${option.id}`}
                                  >
                                    <RadioGroupItem value={option.id} id={`payment-${option.id}`} className="mt-1" />
                                    <div className="flex-1">
                                      <Label htmlFor={`payment-${option.id}`} className="cursor-pointer">
                                        <div className="font-semibold mb-1">{option.name}</div>
                                        <p className="text-sm text-muted-foreground">{option.description}</p>
                                      </Label>
                                    </div>
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

                  <Button
                    type="submit"
                    className="w-full rounded-full gummy-button squish-active bg-gradient-to-r from-primary via-pink-500 to-accent hover:from-pink-600 hover:via-primary hover:to-purple-500 text-white font-semibold py-6 text-lg"
                    disabled={isSubmitting}
                    data-testid="button-submit-order"
                  >
                    {isSubmitting ? (
                      "Оформление..."
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        Подтвердить заказ
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Ваш заказ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-3" data-testid={`order-item-${item.id}`}>
                        <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm line-clamp-2 mb-1">{item.name}</h3>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{item.quantity} шт.</span>
                            <span className="font-semibold">{item.price * item.quantity} ₽</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Товары ({cartItems.length}):</span>
                      <span data-testid="text-subtotal">{total} ₽</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Доставка:</span>
                      <span data-testid="text-delivery-price">
                        {deliveryPrice === 0 ? "Бесплатно" : `${deliveryPrice} ₽`}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Итого:</span>
                    <span className="text-primary" data-testid="text-final-total">{finalTotal} ₽</span>
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
