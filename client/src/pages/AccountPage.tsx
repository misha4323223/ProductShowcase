import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWheel } from "@/contexts/WheelContext";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { getProfile, updateProfile, type UserProfile, isBirthdayToday, markBirthdayGiftSent } from "@/services/profile-api";
import type { Order, WheelPrize } from "@/types/firebase-types";
import { Package, User, LogOut, Trash2, ArrowLeft, Sparkles, Gift, Trophy, Calendar, Clock, Percent, Coins, Truck, Star, Save, Loader2, Edit3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function WheelTab() {
  const { spins, history, activePrizes, stats, isLoading, totalWheelSpins, loyaltyPoints } = useWheel();

  const getPrizeIcon = (type: string) => {
    switch (type) {
      case 'discount_10': return <Percent className="h-5 w-5 text-purple-500" />;
      case 'discount_20': return <Gift className="h-5 w-5 text-pink-500" />;
      case 'points': return <Coins className="h-5 w-5 text-amber-500" />;
      case 'delivery': return <Truck className="h-5 w-5 text-blue-500" />;
      case 'free_item': return <Star className="h-5 w-5 text-green-500" />;
      case 'jackpot': return <Trophy className="h-5 w-5 text-orange-500" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  const getPrizeLabel = (type: string) => {
    switch (type) {
      case 'discount_10': return 'Скидка 10%';
      case 'discount_20': return 'Товар -20%';
      case 'points': return '+200 баллов';
      case 'delivery': return 'Бесплатная доставка';
      case 'free_item': return 'Подарок';
      case 'jackpot': return 'ДЖЕКПОТ!';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <TabsContent value="wheel">
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Загрузка данных рулетки...</p>
        </div>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="wheel" className="space-y-6">
      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Кристаллы желаний 💎</p>
                <p className="text-3xl font-bold text-primary" data-testid="text-available-spins">{spins}</p>
              </div>
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего прокручено</p>
                <p className="text-3xl font-bold text-purple-500" data-testid="text-total-spins">{totalWheelSpins}</p>
              </div>
              <Trophy className="h-10 w-10 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Бонусные баллы</p>
                <p className="text-3xl font-bold text-amber-500" data-testid="text-loyalty-points">{loyaltyPoints}</p>
              </div>
              <Coins className="h-10 w-10 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Активные призы */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Активные призы
          </CardTitle>
          <CardDescription>Ваши доступные промокоды и призы</CardDescription>
        </CardHeader>
        <CardContent>
          {activePrizes.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground" data-testid="text-no-active-prizes">
                У вас пока нет активных призов
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Покрутите рулетку, чтобы получить призы!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activePrizes.map((prize) => (
                <div 
                  key={prize.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
                  data-testid={`prize-card-${prize.id}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getPrizeIcon(prize.prizeType)}
                    <div className="flex-1">
                      <p className="font-medium">{getPrizeLabel(prize.prizeType)}</p>
                      {prize.productName && (
                        <p className="text-sm text-muted-foreground">Товар: {prize.productName}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm font-mono text-primary font-bold">{prize.promoCode}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          до {new Date(prize.expiresAt).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant={prize.used ? "secondary" : "default"}>
                    {prize.used ? "Использован" : "Активен"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* История выигрышей */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            История выигрышей
          </CardTitle>
          <CardDescription>Все ваши призы за всё время</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground" data-testid="text-no-history">
                История пуста
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Ваши выигрыши будут отображаться здесь
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                  data-testid={`history-item-${item.id}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getPrizeIcon(item.prizeType)}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.prizeValue}</p>
                      {item.prizeDetails?.productName && (
                        <p className="text-xs text-muted-foreground">Товар: {item.prizeDetails.productName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  {item.prizeDetails?.savedAmount && (
                    <Badge variant="secondary">
                      Экономия: {item.prizeDetails.savedAmount}₽
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export default function AccountPage() {
  const { user, signOut, loading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderToHide, setOrderToHide] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('openWheelTab')) {
      localStorage.removeItem('openWheelTab');
      return 'wheel';
    }
    return 'orders';
  });

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isBirthday, setIsBirthday] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    patronymic: "",
    birthDate: "",
    phone: "",
  });

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
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoadingProfile(true);
    try {
      const userProfile = await getProfile(user.email);
      setProfile(userProfile);
      setProfileForm({
        firstName: userProfile.firstName || "",
        lastName: userProfile.lastName || "",
        patronymic: userProfile.patronymic || "",
        birthDate: userProfile.birthDate || "",
        phone: userProfile.phone || "",
      });
      
      const isBday = isBirthdayToday(userProfile.birthDate);
      setIsBirthday(isBday);
      
      if (isBday) {
        try {
          await markBirthdayGiftSent(user.email);
        } catch (error) {
          console.error('Ошибка отметки дня рождения:', error);
        }
      }
    } catch (error: any) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSavingProfile(true);
    try {
      const updatedProfile = await updateProfile({
        email: user.email,
        ...profileForm,
      });
      setProfile(updatedProfile);
      setIsEditingProfile(false);
      toast({
        title: "Профиль обновлён",
        description: "Ваши данные успешно сохранены",
      });
    } catch (error: any) {
      console.error('Ошибка сохранения профиля:', error);
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось сохранить профиль",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    
    setLoadingOrders(true);
    try {
      const userOrders = await getUserOrders(user.userId);
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="orders" data-testid="tab-orders">
              <Package className="h-4 w-4 mr-2" />
              Мои заказы
            </TabsTrigger>
            <TabsTrigger value="wheel" data-testid="tab-wheel">
              <Sparkles className="h-4 w-4 mr-2" />
              Рулетка
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

          <WheelTab />

          <TabsContent value="profile">
            {isBirthday && (
              <div className="mb-6 p-4 bg-gradient-to-r from-pink-100 via-purple-100 to-blue-100 border border-pink-300 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">🎂</div>
                  <div className="flex-1">
                    <p className="font-bold text-lg text-pink-900">С Днём Рождения! 🎉</p>
                    <p className="text-sm text-pink-800">Поздравляем! Получите <span className="font-bold">15% скидку</span> на весь заказ в честь вашего дня рождения!</p>
                  </div>
                </div>
              </div>
            )}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Информация профиля</CardTitle>
                    <CardDescription>Ваши личные данные</CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                      data-testid="button-edit-profile"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Редактировать
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingProfile ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isEditingProfile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Фамилия</Label>
                        <Input
                          id="lastName"
                          placeholder="Иванов"
                          value={profileForm.lastName}
                          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                          data-testid="input-lastName"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Имя</Label>
                        <Input
                          id="firstName"
                          placeholder="Иван"
                          value={profileForm.firstName}
                          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                          data-testid="input-firstName"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="patronymic">Отчество</Label>
                        <Input
                          id="patronymic"
                          placeholder="Иванович"
                          value={profileForm.patronymic}
                          onChange={(e) => setProfileForm({ ...profileForm, patronymic: e.target.value })}
                          data-testid="input-patronymic"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Дата рождения</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={profileForm.birthDate}
                          onChange={(e) => setProfileForm({ ...profileForm, birthDate: e.target.value })}
                          data-testid="input-birthDate"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Телефон</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+7 (999) 123-45-67"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        data-testid="input-phone"
                      />
                    </div>
                    <Separator />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          if (profile) {
                            setProfileForm({
                              firstName: profile.firstName || "",
                              lastName: profile.lastName || "",
                              patronymic: profile.patronymic || "",
                              birthDate: profile.birthDate || "",
                              phone: profile.phone || "",
                            });
                          }
                        }}
                        data-testid="button-cancel-edit"
                      >
                        Отмена
                      </Button>
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        data-testid="button-save-profile"
                      >
                        {savingProfile ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Фамилия</Label>
                        <p className="text-lg" data-testid="text-profile-lastName">
                          {profile?.lastName || <span className="text-muted-foreground italic">Не указано</span>}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Имя</Label>
                        <p className="text-lg" data-testid="text-profile-firstName">
                          {profile?.firstName || <span className="text-muted-foreground italic">Не указано</span>}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-muted-foreground">Отчество</Label>
                        <p className="text-lg" data-testid="text-profile-patronymic">
                          {profile?.patronymic || <span className="text-muted-foreground italic">Не указано</span>}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Дата рождения</Label>
                        <p className="text-lg" data-testid="text-profile-birthDate">
                          {profile?.birthDate ? new Date(profile.birthDate).toLocaleDateString('ru-RU') : <span className="text-muted-foreground italic">Не указано</span>}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Телефон</Label>
                      <p className="text-lg" data-testid="text-profile-phone">
                        {profile?.phone || <span className="text-muted-foreground italic">Не указано</span>}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-muted-foreground">Email</Label>
                      <p className="text-lg" data-testid="text-profile-email">{user.email}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">ID пользователя</Label>
                      <p className="text-sm font-mono bg-muted px-2 py-1 rounded inline-block" data-testid="text-profile-uid">
                        {user.userId}
                      </p>
                    </div>
                  </div>
                )}
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