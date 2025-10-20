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
import { getUserOrders } from "@/services/firebase-orders";
import type { Order } from "@/types/firebase-types";
import { Package, User, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const { user, signOut, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);

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

  if (loading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30">
      <Header cartCount={0} onCartClick={() => setCartOpen(true)} />
      
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-accent mb-2" data-testid="text-account-title">
              Личный кабинет
            </h1>
            <p className="text-muted-foreground" data-testid="text-user-email">{user.email}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            data-testid="button-signout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
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
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} data-testid={`card-order-${order.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            Заказ #{order.id.slice(0, 8)}
                          </CardTitle>
                          <CardDescription>
                            {order.createdAt.toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(order.status)} data-testid={`badge-status-${order.id}`}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.quantity} шт × {item.price} ₽
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Separator className="my-4" />
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">Итого:</span>
                        <span className="text-xl font-bold text-primary" data-testid={`text-order-total-${order.id}`}>
                          {order.total} ₽
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
    </div>
  );
}
