import { useState, useEffect, useRef } from "react";
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
import { useTelegramApp } from "@/hooks/useTelegramApp";
import { authenticateWithTelegram, loginWithTelegramId } from "@/lib/telegram";

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => Promise<void>;
  }
}

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const telegramWidgetRef = useRef<HTMLDivElement>(null);
  
  let auth: any = null;
  try {
    auth = useAuth();
  } catch (e) {
    console.error('AuthContext error:', e);
    return <div className="flex items-center justify-center min-h-screen">Ошибка загрузки</div>;
  }
  
  const { signIn, resetPassword, requestEmailVerification, verifyEmailCode, loginWithTelegram } = auth;
  const { toast } = useToast();
  const { isInMiniApp, telegramUser } = useTelegramApp();

  // Обработчик callback от Telegram Login Widget
  useEffect(() => {
    // Callback для Telegram Login Widget
    window.onTelegramAuth = async (user: any) => {
      console.log('✅ Telegram widget auth successful:', user);
      try {
        const response = await fetch(`${API_BASE_URL}/api/telegram/widget-callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        });

        const data = await response.json();
        if (data.success && data.token) {
          await loginWithTelegram(data.token);
          toast({
            title: "Добро пожаловать!",
            description: "Вы вошли через Telegram",
          });
          setLocation("/");
        } else {
          toast({
            title: "Ошибка",
            description: data.error || "Не удалось войти через Telegram",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: "Ошибка",
          description: error.message || "Ошибка при входе",
          variant: "destructive",
        });
      }
    };

    return () => {
      delete window.onTelegramAuth;
    };
  }, []);

  // Инициализация Telegram Login Widget
  useEffect(() => {
    // Добавляем скрипт Telegram widget в контейнер
    if (telegramWidgetRef.current && !(window as any).tg_widget_loaded) {
      (window as any).tg_widget_loaded = true;
      
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'SweetWeb71');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-onauth', 'onTelegramAuth');
      
      telegramWidgetRef.current.appendChild(script);
      console.log('✅ Telegram widget script added');
    }
  }, []);
  
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupStep, setSignupStep] = useState(1);
  const [signupVerificationCode, setSignupVerificationCode] = useState("");
  const [isSignupDialogOpen, setIsSignupDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [isTelegramAuthLoading, setIsTelegramAuthLoading] = useState(false);
  const [isLoginTelegramLoading, setIsLoginTelegramLoading] = useState(false);

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
    
    if (signupStep === 1) {
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
        await requestEmailVerification(signupEmail, signupPassword);
        setSignupStep(2);
        toast({
          title: "Письмо отправлено!",
          description: "Проверьте почту и введите код подтверждения",
        });
      } catch (error: any) {
        toast({
          title: "Ошибка регистрации",
          description: error.message || "Попробуйте другой email",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!signupVerificationCode) {
        toast({
          title: "Ошибка",
          description: "Введите код подтверждения",
          variant: "destructive",
        });
        return;
      }
      
      setIsLoading(true);
      
      try {
        await verifyEmailCode(signupEmail, signupPassword, signupVerificationCode);
        toast({
          title: "Регистрация успешна!",
          description: "Добро пожаловать в Sweet Delights",
        });
        setLocation("/");
      } catch (error: any) {
        toast({
          title: "Ошибка верификации",
          description: error.message || "Попробуйте ещё раз",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleTelegramLogin = async () => {
    console.log('🔐 handleTelegramLogin called');
    setIsLoginTelegramLoading(true);
    try {
      const result = await loginWithTelegramId();
      
      if (result.success && result.token) {
        console.log('✅ Telegram login successful');
        await loginWithTelegram(result.token);
        toast({
          title: "Добро пожаловать!",
          description: "Вы вошли через Telegram",
        });
        setLocation("/");
      } else {
        toast({
          title: "Ошибка входа",
          description: result.error || result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Ошибка при входе через Telegram",
        variant: "destructive",
      });
    } finally {
      setIsLoginTelegramLoading(false);
    }
  };

  const handleTelegramAuth = async () => {
    console.log('🔔 handleTelegramAuth called, isInMiniApp:', isInMiniApp);

    if (!loginEmail) {
      console.log('❌ Email not provided');
      toast({
        title: "Ошибка",
        description: "Введите ваш email для привязки Telegram",
        variant: "destructive",
      });
      return;
    }

    setIsTelegramAuthLoading(true);
    try {
      console.log('📤 Calling authenticateWithTelegram with email:', loginEmail);
      const result = await authenticateWithTelegram(loginEmail);
      
      if (result.success) {
        toast({
          title: "Успех!",
          description: "Telegram ID успешно привязан к аккаунту",
        });
        
        // Try to auto-login with Telegram ID
        console.log('🚀 Attempting auto-login with Telegram ID');
        setTimeout(async () => {
          try {
            const loginResult = await loginWithTelegramId();
            if (loginResult.success && loginResult.token) {
              console.log('✅ Auto-login successful, redirecting to home');
              await loginWithTelegram(loginResult.token);
              setLoginEmail("");
              setLocation("/");
            } else {
              console.log('ℹ️ Auto-login not available, redirecting to home');
              setTimeout(() => setLocation("/"), 2000);
            }
          } catch (error) {
            console.log('ℹ️ Auto-login attempt finished, redirecting');
            setLocation("/");
          }
        }, 500);
      } else {
        toast({
          title: "Ошибка привязки",
          description: result.error || result.message,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Ошибка при привязке Telegram",
        variant: "destructive",
      });
    } finally {
      setIsTelegramAuthLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResetLoading(true);
    
    try {
      if (resetStep === 1) {
        await resetPassword(resetEmail);
        setResetStep(2);
        toast({
          title: "Письмо отправлено!",
          description: "Введите код из письма и новый пароль",
        });
      } else {
        if (!resetCode || !newPassword) {
          toast({
            title: "Ошибка",
            description: "Заполните все поля",
            variant: "destructive",
          });
          return;
        }
        
        if (newPassword !== confirmPassword) {
          toast({
            title: "Ошибка",
            description: "Пароли не совпадают",
            variant: "destructive",
          });
          return;
        }
        
        if (newPassword.length < 6) {
          toast({
            title: "Ошибка",
            description: "Пароль должен быть минимум 6 символов",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: resetEmail,
            action: "verify",
            resetCode: resetCode.toUpperCase(),
            newPassword,
          }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Ошибка сброса пароля");

        toast({
          title: "Успех!",
          description: "Пароль успешно изменён",
        });
        setIsResetDialogOpen(false);
        setResetEmail("");
        setResetCode("");
        setNewPassword("");
        setConfirmPassword("");
        setResetStep(1);
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Попробуйте ещё раз",
        variant: "destructive",
      });
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="w-screen min-h-screen relative overflow-hidden flex items-center justify-center bg-white">
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
          className="w-full max-w-4xl h-auto -mt-96 sm:-mt-72 md:mt-0 lg:mt-0"
          loading="eager"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/10 via-purple-50/10 to-blue-50/10 dark:from-gray-950/20 dark:via-gray-900/20 dark:to-gray-950/20" />

      <div className="w-full max-w-sm relative z-10 -ml-12" style={{marginTop: "8rem"}}>
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-3">
          
          <div className="w-full space-y-2">
            <div className="space-y-1">
              <Input
                id="login-email"
                type="email"
                placeholder="Ваш логин/почта"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                data-testid="input-login-email"
                className="bg-white/5 dark:bg-black/5 backdrop-blur-sm border-2 border-pink-300/60 dark:border-pink-400/40 text-slate-900 placeholder:text-slate-700 text-sm h-9 font-medium focus:border-pink-400/80 transition-colors"
              />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center bg-white/5 dark:bg-black/5 backdrop-blur-sm border-2 border-purple-300/60 dark:border-purple-400/40 rounded-md focus-within:border-purple-400/80 transition-colors">
                <Input
                  id="login-password"
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Пароль"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  data-testid="input-login-password"
                  className="flex-1 bg-transparent border-0 text-slate-900 placeholder:text-slate-700 text-sm h-9 font-medium focus-visible:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="px-2 py-1 hover:bg-transparent h-auto"
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
            className="w-full bg-white/10 hover:bg-white/20 text-slate-900 font-semibold border-2 border-slate-900/40 hover:border-slate-900/60 h-8 text-sm transition-all" 
            disabled={isLoading}
            data-testid="button-login-submit"
          >
            {isLoading ? "..." : "Войти"}
          </Button>

          {/* Telegram Login Widget */}
          <div 
            ref={telegramWidgetRef}
            className="w-full flex justify-center" 
            data-testid="telegram-widget"
            id="telegram-login-widget"
          ></div>

          <Button 
            variant="ghost" 
            className="text-xs text-slate-900 font-medium hover:text-slate-700 h-auto py-0"
            type="button"
            onClick={() => setIsResetDialogOpen(true)}
            data-testid="button-forgot-password"
            style={{textShadow: "0 1px 2px rgba(255, 255, 255, 0.5)"}}
          >
            Забыли пароль?
          </Button>

          <Button 
            type="button"
            variant="ghost"
            className="text-xs text-slate-900 font-medium hover:text-slate-700 h-auto py-0"
            onClick={(e) => {
              e.preventDefault();
              setIsSignupDialogOpen(true);
              setSignupStep(1);
              setSignupEmail("");
              setSignupPassword("");
              setSignupConfirmPassword("");
              setSignupVerificationCode("");
            }}
            data-testid="button-go-signup"
            style={{textShadow: "0 1px 2px rgba(255, 255, 255, 0.5)"}}
          >
            Нет аккаунта? Зарегистрируйтесь
          </Button>
        </form>
      </div>

      <Dialog open={isSignupDialogOpen} onOpenChange={(open) => {
        setIsSignupDialogOpen(open);
        if (!open) {
          setSignupStep(1);
          setSignupEmail("");
          setSignupPassword("");
          setSignupConfirmPassword("");
          setSignupVerificationCode("");
        }
      }}>
        <DialogContent data-testid="dialog-signup" className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/30 dark:border-white/10">
          <form onSubmit={handleSignup}>
            <DialogHeader>
              <DialogTitle>Регистрация</DialogTitle>
              <DialogDescription>
                {signupStep === 1 ? "Создайте новый аккаунт" : "Подтвердите ваш email"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {signupStep === 1 ? (
                <>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      data-testid="input-signup-email"
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Пароль</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Минимум 6 символов"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      data-testid="input-signup-password"
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signup-confirm-password">Повторите пароль</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Подтвердите пароль"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      data-testid="input-signup-confirm-password"
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <Label htmlFor="signup-code">Код из письма</Label>
                  <Input
                    id="signup-code"
                    type="text"
                    placeholder="Введите код"
                    value={signupVerificationCode}
                    onChange={(e) => setSignupVerificationCode(e.target.value)}
                    required
                    data-testid="input-signup-code"
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm uppercase"
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-signup-submit"
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white"
              >
                {isLoading ? "Обработка..." : signupStep === 1 ? "Продолжить" : "Подтвердить"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isResetDialogOpen} onOpenChange={(open) => {
        setIsResetDialogOpen(open);
        if (!open) {
          setResetStep(1);
          setResetEmail("");
          setResetCode("");
          setNewPassword("");
          setConfirmPassword("");
        }
      }}>
        <DialogContent data-testid="dialog-reset-password" className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-white/30 dark:border-white/10">
          <form onSubmit={handleResetPassword}>
            <DialogHeader>
              <DialogTitle>Восстановление пароля</DialogTitle>
              <DialogDescription>
                {resetStep === 1 ? "Введите email для получения кода восстановления" : "Введите код из письма и новый пароль"}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              {resetStep === 1 ? (
                <div>
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
              ) : (
                <>
                  <div>
                    <Label htmlFor="reset-code">Код из письма</Label>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="Введите код"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      data-testid="input-reset-code"
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm uppercase"
                    />
                  </div>
                  <div>
                    <Label htmlFor="new-password">Новый пароль</Label>
                    <div className="flex items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-md border border-input">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Новый пароль"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        data-testid="input-new-password"
                        className="border-0 bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="pr-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirm-password">Подтвердить пароль</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Подтвердите пароль"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      data-testid="input-confirm-password"
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isResetLoading}
                data-testid="button-reset-submit"
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white"
              >
                {isResetLoading ? "Обработка..." : resetStep === 1 ? "Отправить код" : "Изменить пароль"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
