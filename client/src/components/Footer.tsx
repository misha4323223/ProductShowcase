import { Mail, Phone, MapPin } from "lucide-react";
import { SiTelegram, SiInstagram, SiVk } from "react-icons/si";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";
import LegalDialog from "@/components/LegalDialog";

export default function Footer() {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

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
            <p className="text-sm text-muted-foreground mb-4">
              Лучшие сладости и аксессуары с доставкой по всей России. Качество и вкус в каждом продукте.
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
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span data-testid="text-phone">+7 (999) 123-45-67</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span data-testid="text-email">info@sweetdelights.ru</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span data-testid="text-address">Москва, ул. Сладкая, 10</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Подписка на новости</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Получайте эксклюзивные предложения и новости о новинках
            </p>
            <div className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Ваш email" 
                className="flex-1"
                data-testid="input-newsletter-email"
              />
              <Button data-testid="button-subscribe">
                Подписаться
              </Button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p data-testid="text-copyright">© 2025 Sweet Delights. Все права защищены.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link href="/faq" className="hover:text-foreground transition-colors" data-testid="link-faq">
                Частые вопросы
              </Link>
              <button 
                onClick={() => setPrivacyOpen(true)} 
                className="hover:text-foreground transition-colors" 
                data-testid="link-privacy"
              >
                Политика конфиденциальности
              </button>
              <button 
                onClick={() => setTermsOpen(true)} 
                className="hover:text-foreground transition-colors" 
                data-testid="link-terms"
              >
                Договор оферты
              </button>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Реквизиты:</strong> [Будут добавлены после регистрации ИП/ООО]
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
