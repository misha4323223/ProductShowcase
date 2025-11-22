import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentTheme, setCurrentTheme } from '@/services/site-settings-client';

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
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load theme from server:', error);
        setThemeState('sakura');
        setIsLoading(false);
      }
    }
    
    // Initial load
    loadTheme();

    // Poll for theme changes every 3 seconds
    const pollInterval = setInterval(loadTheme, 3000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    
    // Apply theme class to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'sakura', 'new-year', 'spring', 'autumn');
    root.classList.add(theme);
    console.log('🎨 Theme applied:', theme);
  }, [theme, isLoading]);

  const setTheme = async (newTheme: Theme) => {
    try {
      // Save to YDB first
      await setCurrentTheme(newTheme);
      // Then update local state
      setThemeState(newTheme);
      console.log('✅ Theme saved:', newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
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
