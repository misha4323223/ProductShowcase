import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";

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
    console.log('🔍 ОТЛАДКА handleResetPassword: Email из input поля:', `"${resetEmail}"`);
    console.log('🔍 ОТЛАДКА: Длина email из input:', resetEmail.length);
    console.log('🔍 ОТЛАДКА: Коды символов из input:', Array.from(resetEmail).map(c => `${c}(${c.charCodeAt(0)})`).join(', '));
    
    setIsResetLoading(true);
    
    try {
      console.log('🔍 ОТЛАДКА: Вызываем resetPassword...');
      await resetPassword(resetEmail);
      console.log('✅ ОТЛАДКА: resetPassword завершился успешно!');
      
      toast({
        title: "Письмо отправлено!",
        description: "Проверьте свою почту для сброса пароля. Письмо может попасть в спам.",
      });
      console.log('✅ ОТЛАДКА: Показано ЗЕЛЕНОЕ окно "Письмо отправлено!"');
      
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      console.error('❌ ОТЛАДКА handleResetPassword: Полная ошибка:', error);
      console.error("Ошибка восстановления пароля:", error.code, error.message, error);
      console.error('❌ ОТЛАДКА: СЕЙЧАС ПОКАЖЕМ КРАСНОЕ ОКНО С ОШИБКОЙ!');
      
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
      console.error('❌ ОТЛАДКА: Красное окно показано с текстом:', errorMessage);
    } finally {
      setIsResetLoading(false);
      console.log('🔍 ОТЛАДКА: handleResetPassword завершен');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-serif text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-pink-500 to-accent drop-shadow-lg cursor-pointer mb-2" data-testid="link-logo">
              Sweet Delights
            </h1>
          </Link>
          <p className="text-muted-foreground">Войдите или создайте аккаунт</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="login" data-testid="tab-login">Вход</TabsTrigger>
            <TabsTrigger value="signup" data-testid="tab-signup">Регистрация</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Вход в аккаунт</CardTitle>
                <CardDescription>Введите свои данные для входа</CardDescription>
              </CardHeader>
              <form onSubmit={handleLogin}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      data-testid="input-login-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Пароль</Label>
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
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      data-testid="input-login-password"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    data-testid="button-login-submit"
                  >
                    {isLoading ? "Вход..." : "Войти"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Регистрация</CardTitle>
                <CardDescription>Создайте новый аккаунт</CardDescription>
              </CardHeader>
              <form onSubmit={handleSignup}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                      data-testid="input-signup-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Пароль</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-signup-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Подтвердите пароль</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      data-testid="input-signup-confirm-password"
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading}
                    data-testid="button-signup-submit"
                  >
                    {isLoading ? "Регистрация..." : "Зарегистрироваться"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog восстановления пароля вынесен за пределы форм */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent data-testid="dialog-reset-password">
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
              />
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isResetLoading}
                data-testid="button-reset-submit"
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
