import { createContext, useContext, useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';
const ADMIN_EMAIL = "pimashin2015@gmail.com";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminAuthToken');
    if (token) {
      verifyAdminToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyAdminToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.user && data.user.email === ADMIN_EMAIL && data.user.role === 'admin') {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('adminAuthToken');
          setIsAuthenticated(false);
        }
      } else {
        localStorage.removeItem('adminAuthToken');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Admin token verification failed:', error);
      localStorage.removeItem('adminAuthToken');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedAdminEmail = ADMIN_EMAIL.trim().toLowerCase();
      
      console.log("🔐 Попытка входа:", { email: trimmedEmail, adminEmail: trimmedAdminEmail, match: trimmedEmail === trimmedAdminEmail });
      
      if (trimmedEmail !== trimmedAdminEmail) {
        console.log("❌ Email не совпадает с ADMIN_EMAIL");
        return { success: false, error: "Доступ запрещен" };
      }

      console.log("📤 Отправляем запрос на /auth/login");
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      console.log("📥 Ответ:", response.status);

      if (!response.ok) {
        const error = await response.json();
        console.log("❌ Ошибка от сервера:", error);
        let errorMessage = "Ошибка входа";
        
        if (error.error === "Неверный email или пароль") {
          errorMessage = "Неверный email или пароль";
        }
        
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      console.log("✅ Данные от сервера:", data);
      
      if (data.user.role !== 'admin') {
        console.log("❌ Роль не admin:", data.user.role);
        return { success: false, error: "Доступ запрещен" };
      }

      console.log("✅ Вход успешен!");
      localStorage.setItem('adminAuthToken', data.token);
      setIsAuthenticated(true);
      return { success: true };
      
    } catch (error: any) {
      console.error("❌ Ошибка при входе:", error);
      return { success: false, error: "Ошибка соединения: " + error.message };
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('adminAuthToken');
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}
