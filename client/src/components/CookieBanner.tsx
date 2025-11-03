import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "wouter";

const COOKIE_CONSENT_KEY = "cookie-consent";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    }));
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none animate-in slide-in-from-bottom duration-500"
      data-testid="cookie-banner"
    >
      <div className="max-w-5xl mx-auto pointer-events-auto">
        <Card className="shadow-2xl border-2 border-pink-200/50 bg-gradient-to-br from-white via-pink-50/30 to-purple-50/30 backdrop-blur-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="flex-shrink-0 p-2 md:p-3 rounded-full bg-gradient-to-br from-pink-100 to-purple-100">
                <Cookie className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-serif text-lg md:text-xl font-bold text-primary leading-tight">
                    🍪 Мы используем cookies
                  </h3>
                  <button
                    onClick={handleClose}
                    className="flex-shrink-0 p-1 hover:bg-accent/20 rounded-full transition-colors"
                    data-testid="button-close-banner"
                    aria-label="Закрыть"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  Мы используем файлы cookie для улучшения работы сайта, анализа трафика и персонализации контента. 
                  Продолжая использовать наш сайт, вы соглашаетесь с использованием cookie-файлов в соответствии с нашей{" "}
                  <Link 
                    href="/privacy" 
                    className="text-primary hover:underline font-medium"
                    data-testid="link-privacy-policy"
                    onClick={() => setIsVisible(false)}
                  >
                    Политикой конфиденциальности
                  </Link>.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button 
                    onClick={handleAcceptAll}
                    className="w-full sm:w-auto font-semibold"
                    data-testid="button-accept-all"
                  >
                    Принять все
                  </Button>
                  <Button 
                    onClick={handleAcceptNecessary}
                    variant="outline"
                    className="w-full sm:w-auto"
                    data-testid="button-accept-necessary"
                  >
                    Только необходимые
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
