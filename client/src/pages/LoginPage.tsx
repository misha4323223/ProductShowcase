import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Home } from "lucide-react";
import { Link } from "wouter";
import logoUrl from "@assets/logo.webp";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signIn(loginEmail, loginPassword);
      toast({
        title: "Добро пожаловать!",
        description: "Вы успешно вошли в аккаунт",
      });
      setLocation("/");
    } catch (error: any) {
      let errorMessage = "Проверьте email и пароль";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "Пользователь с таким email не найден. Зарегистрируйтесь!";
      } else if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Неверный пароль. Попробуйте ещё раз или восстановите пароль";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Неверный формат email";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Слишком много попыток входа. Попробуйте позже";
      }
      
      toast({
        title: "Ошибка входа",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      toast({
        title: "Ошибка",
        description: "Пароли не совпадают",
        variant: "destructive",
      });
      return;
    }
    
    if (signupPassword.length < 6) {
      toast({
        title: "Ошибка",
        description: "Пароль должен быть не менее 6 символов",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(signupEmail, signupPassword);
      toast({
        title: "Регистрация успешна!",
        description: "Добро пожаловать в Sweet Delights",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Попробуйте другой email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    
    try {
      await resetPassword(resetEmail);
      toast({
        title: "Письмо отправлено!",
        description: "Проверьте свою почту для сброса пароля. Письмо может попасть в спам.",
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      let errorMessage = "Не удалось отправить письмо";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "Пользователь с таким email не найден. Сначала зарегистрируйтесь!";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Неверный формат email";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Слишком много запросов. Попробуйте позже";
      } else if (error.code === "auth/missing-email") {
        errorMessage = "Введите email адрес";
      } else if (error.code === "auth/network-request-failed") {
        errorMessage = "Проблема с интернет-соединением";
      } else if (error.code === "auth/invalid-api-key") {
        errorMessage = "Ошибка конфигурации Firebase. Обратитесь к администратору";
      } else {
        errorMessage = `Ошибка: ${error.code || error.message}`;
      }
      
      toast({
        title: "Ошибка восстановления пароля",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      <Link 
        href="/" 
        className="absolute top-4 left-4 z-50 p-2 rounded-md bg-white/10 dark:bg-black/10 backdrop-blur-sm hover-elevate active-elevate-2 transition-all"
        data-testid="link-home"
      >
        <Home className="w-5 h-5 text-foreground" />
      </Link>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <img 
          src={logoUrl} 
          alt="Sweet Delights Background" 
          className="w-full max-w-4xl h-auto"
          loading="eager"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30 dark:from-gray-950/50 dark:via-gray-900/50 dark:to-gray-950/50" />

      <div className="w-full max-w-sm relative z-10">
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-4">
          <h2 className="font-serif text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 mt-4">
            Вход
          </h2>
          
          <div className="w-full space-y-3">
            <div className="space-y-1">
              <Label htmlFor="login-email" className="text-slate-900 font-semibold text-sm" style={{textShadow: "0 1px 3px rgba(255, 255, 255, 0.5)"}}>Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                data-testid="input-login-email"
                className="bg-white/5 dark:bg-black/5 backdrop-blur-sm border-white/30 dark:border-white/10 text-slate-900 placeholder:text-slate-700 text-sm h-9 font-medium"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password" className="text-slate-900 font-semibold text-sm" style={{textShadow: "0 1px 3px rgba(255, 255, 255, 0.5)"}}>Пароль</Label>
                <Button 
                  variant="ghost" 
                  className="px-0 text-xs h-auto text-slate-900 font-semibold hover:text-slate-700"
                  type="button"
                  onClick={() => setIsResetDialogOpen(true)}
                  data-testid="button-forgot-password"
                  style={{textShadow: "0 1px 2px rgba(255, 255, 255, 0.5)"}}
                >
                  Забыли?
                </Button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  data-testid="input-login-password"
                  className="pr-10 bg-white/5 dark:bg-black/5 backdrop-blur-sm border-white/30 dark:border-white/10 text-slate-900 text-sm h-9 font-medium"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  data-testid="button-toggle-login-password"
                >
                  {showLoginPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-700" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-700" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg border-0 h-9" 
            disabled={isLoading}
            data-testid="button-login-submit"
          >
            {isLoading ? "Вход..." : "Войти"}
          </Button>

          <Button 
            type="button"
            variant="ghost"
            className="text-sm text-slate-900 font-medium hover:text-slate-700"
            onClick={() => setLocation("/register")}
            data-testid="button-go-signup"
            style={{textShadow: "0 1px 3px rgba(255, 255, 255, 0.5)"}}
          >
            Нет аккаунта? Зарегистрируйтесь
          </Button>
        </form>
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent data-testid="dialog-reset-password" className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/30 dark:border-white/10">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Восстановление пароля</DialogTitle>
              <DialogDescription>
                Введите email, на который зарегистрирован ваш аккаунт. Мы отправим вам письмо со ссылкой для сброса пароля.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                data-testid="input-reset-email"
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
              />
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isResetLoading}
                data-testid="button-reset-submit"
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white"
              >
                {isResetLoading ? "Отправка..." : "Отправить письмо"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
