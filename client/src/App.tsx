import { Switch, Route, Router as WouterRouter } from "wouter";
import { lazy, Suspense, useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { WheelProvider } from "@/contexts/WheelContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { LegalDialogProvider } from "@/contexts/LegalDialogContext";
import { ChatbotProvider } from "@/contexts/ChatbotContext";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import CookieBanner from "@/components/CookieBanner";
import LegalDialog from "@/components/LegalDialog";
import ChatbotWidget from "@/components/ChatbotWidget";
import { useLegalDialog } from "@/contexts/LegalDialogContext";
import { useScrollPause } from "@/hooks/use-scroll-pause";
import { initAnalytics } from "@/lib/analytics";
import AutumnRain from "@/components/AutumnRain";
import SunflareParticles from "@/components/SunflareParticles";
import { useTelegramApp } from "@/hooks/useTelegramApp";
import { useLocation } from "wouter";

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

// Главная страница загружается сразу (критичная для первого отображения)
import Home from "@/pages/Home";

// Lazy loading для всех остальных страниц
// Это уменьшает начальный bundle на ~200 KB!
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const ProductPage = lazy(() => import("@/pages/ProductPage"));
const CheckoutPage = lazy(() => import("@/pages/CheckoutPage"));
const PaymentSuccess = lazy(() => import("@/pages/PaymentSuccess"));
const SearchPage = lazy(() => import("@/pages/SearchPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const AccountPage = lazy(() => import("@/pages/AccountPage"));
const WishlistPage = lazy(() => import("@/pages/WishlistPage"));
const SharedWishlistPage = lazy(() => import("@/pages/SharedWishlistPage"));
const AdminPage = lazy(() => import("@/pages/AdminPage")); // 76 KB - самая тяжелая!
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const FaqPage = lazy(() => import("@/pages/FaqPage"));
const TelegramPage = lazy(() => import("@/pages/TelegramPage"));
const TelegramAttachPopup = lazy(() => import("@/pages/TelegramAttachPopup"));
const CertificatesPage = lazy(() => import("@/pages/CertificatesPage"));
const GiftViewPage = lazy(() => import("@/pages/GiftViewPage"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Компонент загрузки для Suspense
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      </div>
    </div>
  );
}

const base = import.meta.env.BASE_URL;

function Router() {
  return (
    <WouterRouter base={base}>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/telegram" component={TelegramPage} />
          <Route path="/telegram-attach-popup" component={TelegramAttachPopup} />
          <Route path="/category/:slug" component={CategoryPage} />
          <Route path="/product/:id" component={ProductPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/search" component={SearchPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/wishlist" component={WishlistPage} />
          <Route path="/shared-wishlist/:userId" component={SharedWishlistPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/faq" component={FaqPage} />
          <Route path="/certificates" component={CertificatesPage} />
          <Route path="/gift/:code" component={GiftViewPage} />
          <Route path="/admin">
            <AdminProtectedRoute>
              <AdminPage />
            </AdminProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </WouterRouter>
  );
}

function LegalDialogContainer() {
  const { privacyOpen, termsOpen, setPrivacyOpen, setTermsOpen } = useLegalDialog();
  return (
    <>
      <LegalDialog isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} type="privacy" />
      <LegalDialog isOpen={termsOpen} onClose={() => setTermsOpen(false)} type="terms" />
    </>
  );
}

// Auto-login component for Telegram Mini App
function TelegramAutoLogin() {
  const { loginWithTelegram } = useAuth();
  const { isInMiniApp, initData } = useTelegramApp();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isInMiniApp && initData && !isProcessing && loginWithTelegram) {
      setIsProcessing(true);
      
      const autoLogin = async () => {
        try {
          console.log('🤖 Telegram Mini App detected - attempting auto-login');
          const response = await fetch(`${API_BASE_URL}/api/telegram/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData }),
          });

          const data = await response.json();
          if (data.success && data.token) {
            console.log('✅ Mini App auto-login successful, user:', data.user?.email);
            await loginWithTelegram(data.token);
          } else {
            console.warn('⚠️ Mini App login failed:', data.error);
          }
        } catch (error) {
          console.error('❌ Mini App auto-login error:', error);
        } finally {
          setIsProcessing(false);
        }
      };

      autoLogin();
    }
  }, [isInMiniApp, initData, loginWithTelegram, isProcessing]);

  return null;
}

function ChatbotContainer() {
  const [location] = useLocation();
  
  // Не показывать чат-бот на странице входа и в админке
  const hideChatbot = location === '/login' || location === '/admin';
  
  if (hideChatbot) {
    return null;
  }
  
  return <ChatbotWidget />;
}

function App() {
  // ОПТИМИЗАЦИЯ: Автоматическая пауза анимаций при скролле
  useScrollPause();

  // Инициализация Telegram Mini App
  useTelegramApp();

  // Инициализация аналитики при монтировании
  useEffect(() => {
    initAnalytics();
    
    // Load Telegram Web App SDK if not already loaded
    if (!window.Telegram) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SiteSettingsProvider>
          <AuthProvider>
            <TelegramAutoLogin />
            <AdminAuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <WheelProvider>
                    <LegalDialogProvider>
                      <ChatbotProvider>
                        <TooltipProvider>
                          <AutumnRain />
                          <SunflareParticles />
                          <Toaster />
                          <CookieBanner />
                          <Router />
                          <LegalDialogContainer />
                          <ChatbotContainer />
                        </TooltipProvider>
                      </ChatbotProvider>
                    </LegalDialogProvider>
                  </WheelProvider>
                </WishlistProvider>
              </CartProvider>
            </AdminAuthProvider>
          </AuthProvider>
        </SiteSettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;