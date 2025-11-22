import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentTheme } from '@/services/site-settings-client';

type Theme = 'light' | 'dark' | 'sakura' | 'new-year' | 'spring' | 'autumn';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('sakura');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        const serverTheme = await getCurrentTheme();
        const validTheme = ['light', 'dark', 'sakura', 'new-year', 'spring', 'autumn'].includes(serverTheme) 
          ? serverTheme as Theme 
          : 'sakura';
        setThemeState(validTheme);
      } catch (error) {
        console.error('Failed to load theme from server, using default:', error);
        const localTheme = localStorage.getItem('theme') as Theme;
        setThemeState(localTheme || 'sakura');
      } finally {
        setIsLoading(false);
      }
    }
    
    // Initial load
    loadTheme();

    // Poll for theme changes every 3 seconds
    const pollInterval = setInterval(loadTheme, 3000);

    const handleThemeChange = (event: CustomEvent) => {
      const newTheme = event.detail.theme as Theme;
      setThemeState(newTheme);
    };

    window.addEventListener('theme-changed', handleThemeChange as EventListener);
    
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('theme-changed', handleThemeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    const root = document.documentElement;
    
    root.classList.remove('light', 'dark', 'sakura', 'new-year', 'spring', 'autumn');
    root.classList.add(theme);
    
    // Используем правильный ключ localStorage для совместимости с App.tsx
    localStorage.setItem('sweetDelights_theme', theme);
    
    // Отправляем кастомное событие для других слушателей
    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
  }, [theme, isLoading]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
