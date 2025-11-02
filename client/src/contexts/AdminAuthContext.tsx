import { createContext, useContext, useState, useEffect } from "react";

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';
const ADMIN_EMAIL = "admin@sweetdelights.com";

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
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
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
      if (email !== ADMIN_EMAIL) {
        return { success: false, error: "Доступ запрещен" };
      }

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        let errorMessage = "Ошибка входа";
        
        if (error.error === "Неверный email или пароль") {
          errorMessage = "Неверный email или пароль";
        }
        
        return { success: false, error: errorMessage };
      }

      const data = await response.json();
      
      if (data.user.role !== 'admin') {
        return { success: false, error: "Доступ запрещен" };
      }

      localStorage.setItem('adminAuthToken', data.token);
      setIsAuthenticated(true);
      return { success: true };
      
    } catch (error: any) {
      console.error("Ошибка при входе:", error);
      return { success: false, error: "Ошибка соединения" };
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
