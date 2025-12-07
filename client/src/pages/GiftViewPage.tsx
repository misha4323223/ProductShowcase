import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Copy, Check, Calendar, ArrowLeft, Sparkles, ShoppingBag, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import classicCardImage from "@assets/generated_images/optimized/classic_pink_gift_card_v1.webp";
import birthdayCardImage from "@assets/generated_images/optimized/birthday_purple_gift_card_v1.webp";
import celebrationCardImage from "@assets/generated_images/optimized/celebration_orange_gift_card_v1.webp";
import loveCardImage from "@assets/generated_images/optimized/love_red_gift_card_v1.webp";

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

const DESIGN_IMAGES: Record<string, string> = {
  default: classicCardImage,
  birthday: birthdayCardImage,
  celebration: celebrationCardImage,
  love: loveCardImage,
};

interface GiftCertificate {
  id: string;
  code: string;
  amount: number;
  status: string;
  recipientName?: string;
  senderName?: string;
  message?: string;
  designTemplate?: string;
  expiresAt: string;
  createdAt: string;
}

export default function GiftViewPage() {
  const [, params] = useRoute("/gift/:code");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const [certificate, setCertificate] = useState<GiftCertificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const code = params?.code;

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!code) {
        setError("Код сертификата не указан");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/certificates?code=${encodeURIComponent(code)}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Сертификат не найден");
        }

        if (data.certificate.status !== 'active') {
          throw new Error("Этот сертификат ещё не активирован или уже использован");
        }

        setCertificate(data.certificate);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Не удалось загрузить сертификат");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificate();
  }, [code]);

  const handleCopyCode = async () => {
    if (!certificate) return;
    
    try {
      await navigator.clipboard.writeText(certificate.code);
      setCopied(true);
      toast({
        title: "Скопировано!",
        description: "Код сертификата скопирован в буфер обмена",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать код",
        variant: "destructive",
      });
    }
  };

  const designImage = certificate?.designTemplate 
    ? DESIGN_IMAGES[certificate.designTemplate] || DESIGN_IMAGES.default
    : DESIGN_IMAGES.default;

  const expiresDate = certificate?.expiresAt 
    ? new Date(certificate.expiresAt).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : '';

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

        <div className="max-w-lg mx-auto">
          {isLoading ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary animate-spin" />
                <p className="text-muted-foreground">Загрузка подарка...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-16 text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
                <h2 className="text-xl font-bold mb-2">Сертификат не найден</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => navigate("/")} data-testid="button-go-home">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Перейти в магазин
                </Button>
              </CardContent>
            </Card>
          ) : certificate && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-1">
                  <Gift className="h-3 w-3 mr-1" />
                  Вам подарили сертификат!
                </Badge>
              </div>

              <Card className="overflow-hidden">
                <div className="relative aspect-video">
                  <img 
                    src={designImage}
                    alt="Certificate design"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 p-6 text-white text-center flex flex-col justify-center">
                    <Gift className="h-12 w-12 mx-auto mb-3 drop-shadow-lg" />
                    <p className="text-sm drop-shadow-lg mb-1">Подарочный сертификат</p>
                    <p className="text-5xl font-bold mb-4 drop-shadow-lg" data-testid="text-amount">
                      {certificate.amount}₽
                    </p>
                    
                    {certificate.recipientName && (
                      <p className="text-lg drop-shadow-lg mb-1" data-testid="text-recipient">
                        Для: <span className="font-semibold">{certificate.recipientName}</span>
                      </p>
                    )}
                    {certificate.senderName && (
                      <p className="text-sm opacity-90 drop-shadow-lg" data-testid="text-sender">
                        От: {certificate.senderName}
                      </p>
                    )}
                    {certificate.message && (
                      <p className="mt-3 text-sm italic drop-shadow-lg bg-white/10 backdrop-blur-sm rounded-lg py-2 px-4 mx-auto max-w-xs" data-testid="text-message">
                        "{certificate.message}"
                      </p>
                    )}
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Код сертификата</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-2xl font-mono font-bold tracking-wider" data-testid="text-code">
                        {certificate.code}
                      </p>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={handleCopyCode}
                        data-testid="button-copy-code"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Действителен до:
                    </span>
                    <span className="font-medium" data-testid="text-expires">{expiresDate}</span>
                  </div>

                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={() => navigate("/")}
                    data-testid="button-shop"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Перейти к покупкам
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Введите код сертификата при оформлении заказа, чтобы применить скидку
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
