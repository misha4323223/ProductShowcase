import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getCurrentTheme, setCurrentTheme, getBackgroundSettings, getPreferredTheme, setPreferredTheme, type BackgroundSettings } from '@/services/site-settings-client';

type Theme = 'light' | 'dark' | 'sakura' | 'new-year' | 'spring' | 'autumn';
type PreferredTheme = 'sakura' | 'new-year' | 'spring' | 'autumn';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  preferredTheme: PreferredTheme;
  setPreferredTheme: (theme: PreferredTheme) => void;
  isLoading: boolean;
  backgroundSettings: BackgroundSettings;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('sakura');
  const [preferredThemeState, setPreferredThemeState] = useState<PreferredTheme>('sakura');
  const [isLoading, setIsLoading] = useState(true);
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({
    sakura: { image: '', webpImage: '', title: '' },
    newyear: { image: '', webpImage: '', title: '' },
    spring: { image: '', webpImage: '', title: '' },
    autumn: { image: '', webpImage: '', title: '' },
  });

  useEffect(() => {
    async function loadTheme() {
      try {
        // Load preferred theme (user's main theme choice)
        const serverPreferred = await getPreferredTheme();
        const validPreferred = ['sakura', 'new-year', 'spring', 'autumn'].includes(serverPreferred)
          ? serverPreferred as PreferredTheme
          : 'sakura';
        
        // Только обновляем если изменилась
        setPreferredThemeState(prev => prev !== validPreferred ? validPreferred : prev);

        // Load current theme
        const serverTheme = await getCurrentTheme();
        const validTheme = ['light', 'dark', 'sakura', 'new-year', 'spring', 'autumn'].includes(serverTheme) 
          ? serverTheme as Theme 
          : validPreferred;
        
        // Только обновляем если изменилась (предотвращаем мерцание)
        setThemeState(prev => prev !== validTheme ? validTheme : prev);
        
        if (isLoading) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to load theme from server:', error);
        if (isLoading) {
          setThemeState('sakura');
          setPreferredThemeState('sakura');
          setIsLoading(false);
        }
      }
    }
    
    // Initial load
    loadTheme();

    // Poll for theme changes every 3 seconds (но не переменяет если не изменилась)
    const pollInterval = setInterval(loadTheme, 3000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [isLoading]);

  useEffect(() => {
    async function loadBackgroundSettings() {
      try {
        const settings = await getBackgroundSettings();
        if (settings && Object.keys(settings).length > 0) {
          // Только обновляем если изменилась (предотвращаем мерцание)
          setBackgroundSettings(prev => {
            const changed = JSON.stringify(prev) !== JSON.stringify(settings);
            return changed ? settings : prev;
          });
          applyBackgroundToTheme(theme, settings);
        }
      } catch (error) {
        console.error('Failed to load background settings:', error);
      }
    }
    
    // Initial load
    loadBackgroundSettings();

    // Poll for background changes every 3 seconds (но не переменяет если не изменилась)
    const pollInterval = setInterval(loadBackgroundSettings, 3000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, [theme]);

  const applyBackgroundToTheme = (currentTheme: Theme, settings: BackgroundSettings) => {
    const themeKey = currentTheme === 'new-year' ? 'newyear' : currentTheme;
    const themeSetting = settings[themeKey as keyof BackgroundSettings];
    
    if (themeSetting && themeSetting.webpImage) {
      // Apply WebP image if available, fallback to regular image
      const imageUrl = themeSetting.webpImage || themeSetting.image;
      document.body.style.backgroundImage = `url('${imageUrl}')`;
      document.body.style.backgroundAttachment = 'fixed';
      console.log('🖼️ Background applied for theme:', currentTheme, 'URL:', imageUrl);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    
    // Apply theme class to document
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'sakura', 'new-year', 'spring', 'autumn');
    root.classList.add(theme);
    console.log('🎨 Theme applied:', theme);

    // Apply background for the new theme
    if (backgroundSettings && Object.keys(backgroundSettings).length > 0) {
      applyBackgroundToTheme(theme, backgroundSettings);
    }
  }, [theme, isLoading, backgroundSettings]);

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

  const setPreferredThemeFunc = async (newPreferred: PreferredTheme) => {
    try {
      // Save to YDB first
      await setPreferredTheme(newPreferred);
      // Then update local state
      setPreferredThemeState(newPreferred);
      // Also set current theme to the preferred theme
      await setCurrentTheme(newPreferred);
      setThemeState(newPreferred);
      console.log('✅ Preferred theme saved:', newPreferred);
    } catch (error) {
      console.error('Failed to save preferred theme:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, preferredTheme: preferredThemeState, setPreferredTheme: setPreferredThemeFunc, isLoading, backgroundSettings }}>
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
