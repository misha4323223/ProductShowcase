import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    await createUserWithEmailAndPassword(auth, trimmedEmail, password);
  };

  const signIn = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    await signInWithEmailAndPassword(auth, trimmedEmail, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    console.log('🔍 ОТЛАДКА resetPassword: Исходный email:', `"${email}"`);
    console.log('🔍 ОТЛАДКА: Длина исходной строки:', email.length);
    console.log('🔍 ОТЛАДКА: Коды символов исходного email:', [...email].map(c => `${c}(${c.charCodeAt(0)})`).join(', '));
    
    const trimmedEmail = email.trim().toLowerCase();
    console.log('🔍 ОТЛАДКА: Email после trim().toLowerCase():', `"${trimmedEmail}"`);
    console.log('🔍 ОТЛАДКА: Длина обработанной строки:', trimmedEmail.length);
    console.log('🔍 ОТЛАДКА: Коды символов обработанного email:', [...trimmedEmail].map(c => `${c}(${c.charCodeAt(0)})`).join(', '));
    
    if (!trimmedEmail) {
      console.error('❌ ОТЛАДКА: Email пустой после обработки!');
      throw new Error('Введите email адрес');
    }
    
    try {
      console.log('🔍 ОТЛАДКА: Отправляем запрос в Firebase с email:', `"${trimmedEmail}"`);
      await sendPasswordResetEmail(auth, trimmedEmail);
      console.log('✅ ОТЛАДКА: Письмо успешно отправлено на:', trimmedEmail);
    } catch (error: any) {
      console.error('❌ ОТЛАДКА: Полная ошибка от Firebase:', error);
      console.error('❌ ОТЛАДКА: Код ошибки:', error.code);
      console.error('❌ ОТЛАДКА: Сообщение ошибки:', error.message);
      console.error('❌ ОТЛАДКА: JSON ошибки:', JSON.stringify(error, null, 2));
      if (error.customData) {
        console.error('❌ ОТЛАДКА: Дополнительные данные:', error.customData);
      }
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, resetPassword }}>
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
