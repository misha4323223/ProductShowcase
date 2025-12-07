import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function AuthCallbackPage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const { loginWithTelegram } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    const provider = params.get("provider");
    const error = params.get("error");
    const message = params.get("message");
    const newUser = params.get("newUser");

    const handleAuth = async () => {
      if (error) {
        setStatus("error");
        toast({
          title: "Ошибка авторизации",
          description: message || "Не удалось войти через Яндекс",
          variant: "destructive",
        });
        setTimeout(() => setLocation("/login"), 2000);
        return;
      }

      if (!token) {
        setStatus("error");
        toast({
          title: "Ошибка",
          description: "Токен авторизации не получен",
          variant: "destructive",
        });
        setTimeout(() => setLocation("/login"), 2000);
        return;
      }

      try {
        await loginWithTelegram(token);
        setStatus("success");
        
        const providerName = provider === "yandex" ? "Яндекс" : provider;
        
        toast({
          title: "Добро пожаловать!",
          description: newUser 
            ? `Аккаунт создан через ${providerName}` 
            : `Вы вошли через ${providerName}`,
        });
        
        setTimeout(() => setLocation("/"), 500);
      } catch (err: any) {
        setStatus("error");
        toast({
          title: "Ошибка",
          description: err.message || "Не удалось авторизоваться",
          variant: "destructive",
        });
        setTimeout(() => setLocation("/login"), 2000);
      }
    };

    handleAuth();
  }, [search, loginWithTelegram, setLocation, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Авторизация...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg text-green-600">Успешный вход!</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-lg text-red-600">Ошибка авторизации</p>
          </>
        )}
      </div>
    </div>
  );
}
