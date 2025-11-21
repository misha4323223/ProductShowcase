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
          className="w-full max-w-4xl h-auto opacity-40 dark:opacity-20"
          loading="eager"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/90 via-purple-50/90 to-blue-50/90 dark:from-gray-950/90 dark:via-gray-900/90 dark:to-gray-950/90" />

      <div className="w-full max-w-md relative z-10 p-6">
        <div className="text-center mb-8">
          <h1 className="font-serif text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 dark:from-pink-400 dark:via-purple-400 dark:to-blue-400 mb-2">
            Sweet Delights
          </h1>
          <p className="text-muted-foreground text-lg">Сладкие Наслаждения</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/30 dark:border-white/10">
            <TabsTrigger 
              value="login" 
              data-testid="tab-login"
              className="data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/10"
            >
              Вход
            </TabsTrigger>
            <TabsTrigger 
              value="signup" 
              data-testid="tab-signup"
              className="data-[state=active]:bg-white/40 dark:data-[state=active]:bg-white/10"
            >
              Регистрация
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-md border border-white/20 dark:border-white/10 p-6 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Вход в аккаунт</h2>
                <p className="text-sm text-muted-foreground">Введите свои данные для входа</p>
              </div>
              
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-foreground">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    data-testid="input-login-email"
                    className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/30 dark:border-white/10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-foreground">Пароль</Label>
                    <Button 
                      variant="ghost" 
                      className="px-0 text-xs h-auto text-primary hover:underline"
                      type="button"
                      onClick={() => setIsResetDialogOpen(true)}
                      data-testid="button-forgot-password"
                    >
                      Забыли пароль?
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
                      className="pr-10 bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/30 dark:border-white/10 text-foreground"
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
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg border-0" 
                  disabled={isLoading}
                  data-testid="button-login-submit"
                >
                  {isLoading ? "Вход..." : "Войти"}
                </Button>
              </form>
            </div>
          </TabsContent>
          
          <TabsContent value="signup">
            <div className="bg-white/10 dark:bg-black/10 backdrop-blur-xl rounded-md border border-white/20 dark:border-white/10 p-6 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Регистрация</h2>
                <p className="text-sm text-muted-foreground">Создайте новый аккаунт</p>
              </div>
              
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="your@email.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    required
                    data-testid="input-signup-email"
                    className="bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/30 dark:border-white/10 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-foreground">Пароль</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-signup-password"
                      className="pr-10 bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/30 dark:border-white/10 text-foreground"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      data-testid="button-toggle-signup-password"
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password" className="text-foreground">Подтвердите пароль</Label>
                  <div className="relative">
                    <Input
                      id="signup-confirm-password"
                      type={showSignupConfirmPassword ? "text" : "password"}
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-signup-confirm-password"
                      className="pr-10 bg-white/20 dark:bg-black/20 backdrop-blur-sm border-white/30 dark:border-white/10 text-foreground"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                      data-testid="button-toggle-confirm-password"
                    >
                      {showSignupConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-white font-semibold shadow-lg border-0" 
                  disabled={isLoading}
                  data-testid="button-signup-submit"
                >
                  {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
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
