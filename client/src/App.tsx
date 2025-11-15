import { Switch, Route, Router as WouterRouter } from "wouter";
import { lazy, Suspense, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { WheelProvider } from "@/contexts/WheelContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import CookieBanner from "@/components/CookieBanner";
import { useScrollPause } from "@/hooks/use-scroll-pause";
import { initAnalytics } from "@/lib/analytics";

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
const AdminPage = lazy(() => import("@/pages/AdminPage")); // 76 KB - самая тяжелая!
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const FaqPage = lazy(() => import("@/pages/FaqPage"));
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
          <Route path="/category/:slug" component={CategoryPage} />
          <Route path="/product/:id" component={ProductPage} />
          <Route path="/checkout" component={CheckoutPage} />
          <Route path="/payment-success" component={PaymentSuccess} />
          <Route path="/search" component={SearchPage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/account" component={AccountPage} />
          <Route path="/wishlist" component={WishlistPage} />
          <Route path="/privacy" component={PrivacyPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/faq" component={FaqPage} />
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

function App() {
  // ОПТИМИЗАЦИЯ: Автоматическая пауза анимаций при скролле
  useScrollPause();

  // Инициализация аналитики при монтировании
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <WishlistProvider>
                <WheelProvider>
                  <TooltipProvider>
                    <Toaster />
                    <CookieBanner />
                    <Router />
                  </TooltipProvider>
                </WheelProvider>
              </WishlistProvider>
            </CartProvider>
          </AdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;