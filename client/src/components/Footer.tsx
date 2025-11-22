import { Mail, Phone, MapPin, HelpCircle, Lock, FileText } from "lucide-react";
import { SiTelegram, SiInstagram, SiVk } from "react-icons/si";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Link } from "wouter";
import LegalDialog from "@/components/LegalDialog";
import { subscribeToNewsletter } from "@/services/yandex-newsletter";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterConsent, setNewsletterConsent] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const { toast } = useToast();
  const { theme } = useTheme();
  
  const mutedClass = theme === 'new-year' ? 'text-white' : 'text-muted-foreground';

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newsletterEmail.trim()) {
      toast({
        title: "Введите email",
        description: "Пожалуйста, введите ваш email для подписки",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      toast({
        title: "Некорректный email",
        description: "Пожалуйста, введите правильный email адрес",
        variant: "destructive",
      });
      return;
    }

    if (!newsletterConsent) {
      toast({
        title: "Требуется согласие",
        description: "Необходимо дать согласие на обработку персональных данных",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);
    try {
      await subscribeToNewsletter(newsletterEmail);
      toast({
        title: "Успешно подписались!",
        description: "Вы будете получать новости об открытии магазина и эксклюзивные предложения",
      });
      setNewsletterEmail("");
      setNewsletterConsent(false);
    } catch (error: any) {
      toast({
        title: "Ошибка подписки",
        description: error.message || "Не удалось подписаться на рассылку",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <>
    <footer className="bg-gradient-to-b from-pink-50/30 to-sidebar border-t border-pink-200/30 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-pink-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-300/30 rounded-full blur-3xl" />
      </div>
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="font-serif text-xl font-bold text-primary mb-4">
              Sweet Delights
            </h3>
            <p className={`text-sm ${mutedClass} mb-4`}>
              Лучшие сладости с доставкой по всей России.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent transition-colors"
                data-testid="link-telegram"
              >
                <SiTelegram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent transition-colors"
                data-testid="link-instagram"
              >
                <SiInstagram className="h-4 w-4" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 rounded-full bg-accent/10 hover:bg-accent/20 flex items-center justify-center text-accent transition-colors"
                data-testid="link-vk"
              >
                <SiVk className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Контакты</h4>
            <div className={`space-y-3 text-sm ${mutedClass}`}>
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a href="mailto:Storesweeet@gmail.com" className="hover:text-foreground transition-colors">
                  Storesweeet@gmail.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <a href="tel:+79531814136" className="hover:text-foreground transition-colors">
                  +7 953 181 41 36
                </a>
              </div>
              <p className="text-xs">
                ИНН: 711612442203<br />
                Пн-Пт 11:00-18:00 (МСК)
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Подписка на новости</h4>
            <p className={`text-sm ${mutedClass} mb-3`}>
              Узнайте первыми об открытии магазина и получайте эксклюзивные предложения
            </p>
            <form onSubmit={handleNewsletterSubscribe} className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="Ваш email" 
                  className="flex-1"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  disabled={isSubscribing}
                  data-testid="input-newsletter-email"
                />
                <Button 
                  type="submit" 
                  disabled={isSubscribing}
                  data-testid="button-subscribe"
                >
                  {isSubscribing ? "..." : "Подписаться"}
                </Button>
              </div>
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="newsletter-consent"
                  checked={newsletterConsent}
                  onCheckedChange={(checked) => setNewsletterConsent(checked as boolean)}
                  disabled={isSubscribing}
                  data-testid="checkbox-newsletter-consent"
                />
                <Label 
                  htmlFor="newsletter-consent" 
                  className={`text-xs ${mutedClass} leading-tight cursor-pointer`}
                >
                  Я согласен с{" "}
                  <button
                    type="button"
                    onClick={() => setPrivacyOpen(true)}
                    className="text-primary hover:underline font-medium"
                    data-testid="link-newsletter-privacy"
                  >
                    политикой конфиденциальности
                  </button>
                  {" "}и на получение рассылки
                </Label>
              </div>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className={`flex flex-wrap justify-center items-center gap-6 text-sm ${mutedClass}`}>
            <Link href="/faq" className="flex items-center gap-2 hover:text-foreground hover:underline transition-colors" data-testid="link-faq">
              <HelpCircle className="h-4 w-4" />
              Частые вопросы
            </Link>
            <button 
              onClick={() => setPrivacyOpen(true)} 
              className="flex items-center gap-2 hover:text-foreground hover:underline transition-colors" 
              data-testid="link-privacy"
            >
              <Lock className="h-4 w-4" />
              Политика конфиденциальности
            </button>
            <button 
              onClick={() => setTermsOpen(true)} 
              className="flex items-center gap-2 hover:text-foreground hover:underline transition-colors" 
              data-testid="link-terms"
            >
              <FileText className="h-4 w-4" />
              Договор оферты
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className={`text-xs ${mutedClass} text-center`}>
              ИП Пимашин Михаил Игоревич | ИНН: 711612442203 | Самозанятый (НПД)
            </p>
          </div>
        </div>
      </div>

      <LegalDialog isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} type="privacy" />
      <LegalDialog isOpen={termsOpen} onClose={() => setTermsOpen(false)} type="terms" />
    </footer>
    </>
  );
}
