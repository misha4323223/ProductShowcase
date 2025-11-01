import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import Home from "@/pages/Home";
import CategoryPage from "@/pages/CategoryPage";
import ProductPage from "@/pages/ProductPage";
import CheckoutPage from "@/pages/CheckoutPage";
import SearchPage from "@/pages/SearchPage";
import LoginPage from "@/pages/LoginPage";
import AccountPage from "@/pages/AccountPage";
import WishlistPage from "@/pages/WishlistPage";
import AdminPage from "@/pages/AdminPage";
import AdminUploadPage from "@/pages/AdminUploadPage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import FaqPage from "@/pages/FaqPage";
import NotFound from "@/pages/not-found";

const base = import.meta.env.BASE_URL;

function Router() {
  return (
    <WouterRouter base={base}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route path="/product/:id" component={ProductPage} />
        <Route path="/checkout" component={CheckoutPage} />
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
        <Route path="/admin/upload">
          <AdminProtectedRoute>
            <AdminUploadPage />
          </AdminProtectedRoute>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminAuthProvider>
          <CartProvider>
            <WishlistProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </WishlistProvider>
          </CartProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
