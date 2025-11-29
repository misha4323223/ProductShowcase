import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

interface User {
  userId: string;
  email: string;
  role: string;
  telegramId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  requestEmailVerification: (email: string, password: string) => Promise<void>;
  verifyEmailCode: (email: string, password: string, verificationCode: string) => Promise<void>;
  loginWithTelegram: (token: string) => Promise<void>;
  attachEmail: (email: string, password: string, passwordConfirm: string) => Promise<void>;
  attachTelegram: (initData: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string, newPasswordConfirm: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.valid && data.user) {
          setUser(data.user);
        } else {
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } else {
        localStorage.removeItem('authToken');
        setUser(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка регистрации');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  };

  const signIn = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка входа');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  };

  const signOut = async () => {
    localStorage.removeItem('authToken');
    setUser(null);
  };

  const loginWithTelegram = async (token: string) => {
    console.log('🔑 loginWithTelegram: saving token...');
    localStorage.setItem('authToken', token);
    
    const verifyResponse = await fetch(`${API_BASE_URL}/auth/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    console.log('✅ Token verify response:', verifyResponse.status);
    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      console.log('👤 Verify data:', data);
      if (data.valid && data.user) {
        console.log('✅ Setting user:', data.user);
        setUser(data.user);
      } else {
        console.log('❌ Invalid token response:', data);
      }
    } else {
      console.log('❌ Verify failed:', verifyResponse.status);
    }
  };

  const resetPassword = async (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) {
      throw new Error('Введите email адрес');
    }

    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, action: 'request' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка сброса пароля');
    }
  };

  const requestEmailVerification = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: trimmedEmail, password, action: 'send_verification' }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка отправки кода');
    }
  };

  const verifyEmailCode = async (email: string, password: string, verificationCode: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: trimmedEmail, 
        password, 
        action: 'verify_email',
        verificationCode: verificationCode.toUpperCase()
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Ошибка верификации');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  };

  const attachEmail = async (email: string, password: string, passwordConfirm: string) => {
    console.log('🔗 attachEmail called');
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Пожалуйста, авторизуйтесь');
    }

    const trimmedEmail = email.trim().toLowerCase();
    console.log('📧 Email:', trimmedEmail);
    console.log('🔑 Token:', token.substring(0, 20) + '...');
    console.log('🌐 API_BASE_URL:', API_BASE_URL || '(пусто - используется локальный сервер)');
    
    const url = `${API_BASE_URL}/api/users/attach-email`;
    console.log('🌐 ПОЛНЫЙ URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token,
        email: trimmedEmail,
        password,
        passwordConfirm
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
      console.error('❌ Error response:', error);
      throw new Error(error.error || `Ошибка ${response.status}: Ошибка привязки email`);
    }

    const data = await response.json();
    console.log('✅ Email успешно привязан');
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  };

  const attachTelegram = async (initData: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Пожалуйста, авторизуйтесь');
    }

    if (!initData) {
      throw new Error('Telegram данные не получены');
    }

    console.log('🔗 attachTelegram called');
    console.log('🌐 API_BASE_URL:', API_BASE_URL || '(пусто - используется локальный сервер)');
    const url = `${API_BASE_URL}/api/users/attach-telegram`;
    console.log('🌐 ПОЛНЫЙ URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token,
        initData
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
      console.error('❌ Error response:', error);
      throw new Error(error.error || `Ошибка ${response.status}: Ошибка привязки Telegram`);
    }

    const data = await response.json();
    console.log('✅ Telegram успешно привязан');
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  };

  const changePassword = async (oldPassword: string, newPassword: string, newPasswordConfirm: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Пожалуйста, авторизуйтесь');
    }

    if (!oldPassword || !newPassword || !newPasswordConfirm) {
      throw new Error('Все поля обязательны');
    }

    if (newPassword !== newPasswordConfirm) {
      throw new Error('Новые пароли не совпадают');
    }

    if (newPassword.length < 6) {
      throw new Error('Пароль должен быть минимум 6 символов');
    }

    console.log('🔐 changePassword called');
    const url = `${API_BASE_URL}/api/users/change-password`;
    console.log('🌐 URL:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        token,
        oldPassword,
        newPassword,
        newPasswordConfirm
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
      console.error('❌ Error response:', error);
      throw new Error(error.error || `Ошибка ${response.status}: Не удалось изменить пароль`);
    }

    const data = await response.json();
    console.log('✅ Пароль успешно изменён');
    localStorage.setItem('authToken', data.token);
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword, requestEmailVerification, verifyEmailCode, loginWithTelegram, attachEmail, attachTelegram, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
