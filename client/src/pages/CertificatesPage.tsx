import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Gift, Mail, Send, CalendarIcon, Check, Sparkles, CreditCard, Clock, ArrowLeft } from "lucide-react";
import { SiTelegram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';
const CERTIFICATE_AMOUNTS = [500, 1000, 2000, 3000, 5000, 7000, 10000];

const DESIGN_TEMPLATES = [
  { id: "default", name: "Классика", color: "bg-gradient-to-br from-pink-400 to-pink-600" },
  { id: "birthday", name: "День рождения", color: "bg-gradient-to-br from-purple-400 to-purple-600" },
  { id: "celebration", name: "Праздник", color: "bg-gradient-to-br from-amber-400 to-orange-500" },
  { id: "love", name: "С любовью", color: "bg-gradient-to-br from-red-400 to-rose-600" },
];

export default function CertificatesPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [isGift, setIsGift] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"email" | "telegram">("email");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientTelegramId, setRecipientTelegramId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState(user?.email?.split("@")[0] || "");
  const [message, setMessage] = useState("");
  const [selectedDesign, setSelectedDesign] = useState("default");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Необходима авторизация",
        description: "Войдите в аккаунт, чтобы приобрести сертификат",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (isGift) {
      if (deliveryMethod === "email" && !recipientEmail) {
        toast({
          title: "Укажите email получателя",
          variant: "destructive",
        });
        return;
      }
      if (deliveryMethod === "telegram" && !recipientTelegramId) {
        toast({
          title: "Укажите Telegram ID получателя",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        action: "create",
        amount: selectedAmount,
        purchaserEmail: user.email,
        purchaserName: user.email?.split("@")[0],
        isGift,
        recipientEmail: isGift && deliveryMethod === "email" ? recipientEmail : undefined,
        recipientTelegramId: isGift && deliveryMethod === "telegram" ? recipientTelegramId : undefined,
        recipientName: isGift ? recipientName : undefined,
        senderName: isGift ? senderName : undefined,
        message: isGift ? message : undefined,
        designTemplate: selectedDesign,
        deliveryDate: isGift && isScheduled && scheduledDate ? scheduledDate.toISOString() : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/certificates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Ошибка создания сертификата');
      }

      toast({
        title: "Сертификат создан",
        description: `Код: ${data.certificate.code}. Переход к оплате...`,
      });

    } catch (error) {
      console.error("Certificate creation error:", error);
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось создать сертификат",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header cartCount={0} onCartClick={() => {}} />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          На главную
        </Button>

        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
              <Gift className="h-8 w-8 text-primary" />
              Подарочные сертификаты
            </h1>
            <p className="text-muted-foreground">
              Идеальный подарок для любителей сладостей
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Выберите номинал
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CERTIFICATE_AMOUNTS.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        className={cn(
                          "h-16 text-lg font-bold relative",
                          selectedAmount === amount && "ring-2 ring-primary ring-offset-2"
                        )}
                        onClick={() => setSelectedAmount(amount)}
                        data-testid={`button-amount-${amount}`}
                      >
                        {amount}₽
                        {selectedAmount === amount && (
                          <Check className="absolute top-1 right-1 h-4 w-4" />
                        )}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Тип сертификата
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is-gift" className="text-base font-medium">
                        Это подарок
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Отправим сертификат получателю
                      </p>
                    </div>
                    <Switch
                      id="is-gift"
                      checked={isGift}
                      onCheckedChange={setIsGift}
                      data-testid="switch-is-gift"
                    />
                  </div>

                  {isGift && (
                    <div className="space-y-4 pt-4 border-t">
                      <div>
                        <Label className="text-base font-medium mb-3 block">
                          Способ доставки
                        </Label>
                        <RadioGroup
                          value={deliveryMethod}
                          onValueChange={(v) => setDeliveryMethod(v as "email" | "telegram")}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="email" id="delivery-email" data-testid="radio-email" />
                            <Label htmlFor="delivery-email" className="flex items-center gap-2 cursor-pointer">
                              <Mail className="h-4 w-4" />
                              Email
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="telegram" id="delivery-telegram" data-testid="radio-telegram" />
                            <Label htmlFor="delivery-telegram" className="flex items-center gap-2 cursor-pointer">
                              <SiTelegram className="h-4 w-4" />
                              Telegram
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {deliveryMethod === "email" ? (
                        <div>
                          <Label htmlFor="recipient-email">Email получателя</Label>
                          <Input
                            id="recipient-email"
                            type="email"
                            placeholder="friend@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            data-testid="input-recipient-email"
                          />
                        </div>
                      ) : (
                        <div>
                          <Label htmlFor="recipient-telegram">Telegram ID получателя</Label>
                          <Input
                            id="recipient-telegram"
                            placeholder="123456789"
                            value={recipientTelegramId}
                            onChange={(e) => setRecipientTelegramId(e.target.value)}
                            data-testid="input-recipient-telegram"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Получатель должен писать боту @SweetDelightsBot
                          </p>
                        </div>
                      )}

                      <div>
                        <Label htmlFor="recipient-name">Имя получателя</Label>
                        <Input
                          id="recipient-name"
                          placeholder="Мария"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          data-testid="input-recipient-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="sender-name">Ваше имя (отправитель)</Label>
                        <Input
                          id="sender-name"
                          placeholder="Иван"
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                          data-testid="input-sender-name"
                        />
                      </div>

                      <div>
                        <Label htmlFor="message">Поздравление (опционально)</Label>
                        <Textarea
                          id="message"
                          placeholder="С днём рождения! Желаю сладкой жизни!"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="resize-none"
                          rows={3}
                          data-testid="textarea-message"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <Label htmlFor="is-scheduled" className="text-base font-medium">
                            Отложенная отправка
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Сертификат будет отправлен в выбранную дату
                          </p>
                        </div>
                        <Switch
                          id="is-scheduled"
                          checked={isScheduled}
                          onCheckedChange={setIsScheduled}
                          data-testid="switch-scheduled"
                        />
                      </div>

                      {isScheduled && (
                        <div>
                          <Label>Дата отправки</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !scheduledDate && "text-muted-foreground"
                                )}
                                data-testid="button-select-date"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {scheduledDate ? (
                                  format(scheduledDate, "PPP", { locale: ru })
                                ) : (
                                  "Выберите дату"
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={scheduledDate}
                                onSelect={setScheduledDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {isGift && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Дизайн открытки
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {DESIGN_TEMPLATES.map((design) => (
                        <button
                          key={design.id}
                          onClick={() => setSelectedDesign(design.id)}
                          className={cn(
                            "p-4 rounded-lg border-2 text-white font-medium text-center transition-all",
                            design.color,
                            selectedDesign === design.id
                              ? "ring-2 ring-primary ring-offset-2 border-transparent"
                              : "border-transparent hover:opacity-90"
                          )}
                          data-testid={`button-design-${design.id}`}
                        >
                          {design.name}
                          {selectedDesign === design.id && (
                            <Check className="h-4 w-4 mx-auto mt-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Предпросмотр</CardTitle>
                  <CardDescription>Так будет выглядеть ваш сертификат</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div 
                    className={cn(
                      "rounded-xl p-6 text-white text-center",
                      DESIGN_TEMPLATES.find(d => d.id === selectedDesign)?.color || "bg-gradient-to-br from-pink-400 to-pink-600"
                    )}
                  >
                    <Gift className="h-12 w-12 mx-auto mb-4 opacity-90" />
                    <p className="text-sm opacity-90 mb-2">Подарочный сертификат</p>
                    <p className="text-4xl font-bold mb-4">{selectedAmount}₽</p>
                    <div className="bg-white/20 rounded-lg py-2 px-4 inline-block">
                      <p className="text-xs opacity-80">Код сертификата</p>
                      <p className="font-mono font-bold tracking-wider">GC-XXXX-XXXX</p>
                    </div>
                    {isGift && recipientName && (
                      <p className="mt-4 text-sm">
                        Для: <span className="font-semibold">{recipientName}</span>
                      </p>
                    )}
                    {isGift && senderName && (
                      <p className="text-sm opacity-80">
                        От: {senderName}
                      </p>
                    )}
                    {isGift && message && (
                      <p className="mt-3 text-sm italic opacity-90">"{message}"</p>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Номинал:</span>
                      <span className="font-semibold">{selectedAmount}₽</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Тип:</span>
                      <span>{isGift ? "Подарок" : "Для себя"}</span>
                    </div>
                    {isGift && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Доставка:</span>
                          <span>{deliveryMethod === "email" ? "Email" : "Telegram"}</span>
                        </div>
                        {isScheduled && scheduledDate && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Дата отправки:</span>
                            <span>{format(scheduledDate, "dd.MM.yyyy")}</span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Срок действия:</span>
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        1 год
                      </Badge>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePurchase}
                    disabled={isSubmitting}
                    data-testid="button-purchase"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        Создание...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Купить за {selectedAmount}₽
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    После оплаты сертификат будет {isGift ? "отправлен получателю" : "доступен в вашем аккаунте"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Как это работает?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">1. Выберите и оплатите</h3>
                  <p className="text-sm text-muted-foreground">
                    Выберите номинал и оплатите сертификат любым удобным способом
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">2. Доставка</h3>
                  <p className="text-sm text-muted-foreground">
                    Сертификат будет отправлен на email или в Telegram
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Gift className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">3. Использование</h3>
                  <p className="text-sm text-muted-foreground">
                    Введите код при оформлении заказа для применения скидки
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
