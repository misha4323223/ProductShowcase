import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getUserOrders, hideOrderForUser } from "@/services/yandex-orders";
import type { Order } from "@/types/firebase-types";
import { Package, User, LogOut, Trash2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { user, signOut, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderToHide, setOrderToHide] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    
    setLoadingOrders(true);
    try {
      const userOrders = await getUserOrders(user.uid);
      console.log('Загруженные заказы:', userOrders);
      setOrders(userOrders);
    } catch (error: any) {
      console.error('Ошибка загрузки заказов:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось загрузить заказы",
        variant: "destructive",
      });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "До свидания!",
        description: "Вы успешно вышли из аккаунта",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из аккаунта",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const handleHideOrder = async () => {
    if (!orderToHide) return;
    
    try {
      await hideOrderForUser(orderToHide);
      setOrders(orders.filter(order => order.id !== orderToHide));
      toast({
        title: "Успешно",
        description: "Заказ скрыт из списка",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скрыть заказ",
        variant: "destructive",
      });
    } finally {
      setOrderToHide(null);
    }
  };

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30">
      <Header cartCount={0} onCartClick={() => setCartOpen(true)} />
      
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <button
          onClick={() => setLocation("/")}
          className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 hover:scale-110 transition-all shadow-md hover:shadow-lg jelly-wobble mb-6 inline-flex items-center"
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            boxShadow: '0 3px 0 rgba(8, 145, 178, 0.4), 0 4px 8px rgba(14, 165, 233, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
          }}
          data-testid="button-back"
        >
          <ArrowLeft className="h-3 w-3 mr-1.5" />
          Назад
        </button>

        <div className="flex items-start justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-accent mb-2" data-testid="text-account-title">
              Личный кабинет
            </h1>
            <p className="text-muted-foreground" data-testid="text-user-email">{user.email}</p>
          </div>
          <button 
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-gradient-to-br from-red-400 via-pink-500 to-red-600 hover:scale-110 transition-all shadow-lg hover:shadow-xl jelly-wobble flex items-center gap-2"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              boxShadow: '0 4px 0 rgba(220, 38, 38, 0.4), 0 6px 12px rgba(236, 72, 153, 0.3), inset 0 -2px 4px rgba(0,0,0,0.1), inset 0 2px 4px rgba(255,255,255,0.5)'
            }}
            data-testid="button-signout"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="h-4 w-4 mr-2" />
              Мои заказы
            </TabsTrigger>
            <TabsTrigger value="profile" data-testid="tab-profile">
              <User className="h-4 w-4 mr-2" />
              Профиль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            {loadingOrders ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Загрузка заказов...</p>
              </div>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4" data-testid="text-no-orders">
                    У вас пока нет заказов
                  </p>
                  <Button onClick={() => setLocation("/")} data-testid="button-start-shopping">
                    Начать покупки
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-2">
                {orders.map((order) => (
                  <AccordionItem 
                    key={order.id} 
                    value={order.id} 
                    className="border rounded-lg px-4"
                    data-testid={`accordion-order-${order.id}`}
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">
                            {order.createdAt.toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                            {getStatusText(order.status)}
                          </Badge>
                        </div>
                        <span className="text-sm font-bold text-primary">
                          {order.total} ₽
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground mb-3">
                          Заказ #{order.id.slice(0, 8)}
                        </div>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between py-1.5">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.quantity} шт × {item.price} ₽
                              </p>
                            </div>
                            <span className="text-sm font-medium">
                              {item.quantity * item.price} ₽
                            </span>
                          </div>
                        ))}
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOrderToHide(order.id)}
                            data-testid={`button-hide-${order.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Скрыть заказ
                          </Button>
                          <div className="text-right">
                            <div className="text-xs text-muted-foreground">Итого:</div>
                            <div className="text-lg font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                              {order.total} ₽
                            </div>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Информация профиля</CardTitle>
                <CardDescription>Ваши данные</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg" data-testid="text-profile-email">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID пользователя</label>
                  <p className="text-sm font-mono bg-muted px-2 py-1 rounded" data-testid="text-profile-uid">
                    {user.uid}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />

      <AlertDialog open={!!orderToHide} onOpenChange={(open) => !open && setOrderToHide(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Сделать заказ невидимым? 🍭</AlertDialogTitle>
            <AlertDialogDescription>
              Этот заказ уйдёт из списка, оставив только сладкое воспоминание. Продолжить?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-hide">
              Оставить
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleHideOrder} data-testid="button-confirm-hide">
              Скрыть
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}