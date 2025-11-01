import { createContext, useContext, useState, useEffect } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email === ADMIN_EMAIL) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (email !== ADMIN_EMAIL) {
        return { success: false, error: "Доступ запрещен" };
      }

      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error: any) {
      console.error("Ошибка при входе:", error);
      
      let errorMessage = "Ошибка входа";
      if (error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
        errorMessage = "Неверный email или пароль";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Неверный формат email";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Слишком много попыток. Попробуйте позже";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Неверные данные для входа";
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
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
