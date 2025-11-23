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
  // Инициализируем с темой из pre-load скрипта если она есть
  // (она уже загружена и применена в index.html перед React монтированием)
  const initialTheme = (typeof window !== 'undefined' && (window as any).__initialTheme) || 'sakura';
  
  const [theme, setThemeState] = useState<Theme>(initialTheme as Theme);
  const [preferredThemeState, setPreferredThemeState] = useState<PreferredTheme>('sakura');
  // isLoading = false потому что тема и фон уже предзагружены в index.html
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({
    sakura: { image: '', webpImage: '', title: '' },
    newyear: { image: '', webpImage: '', title: '' },
    spring: { image: '', webpImage: '', title: '' },
    autumn: { image: '', webpImage: '', title: '' },
  });

  // Загружаем данные с сервера только для синхронизации (polling)
  // НЕ в initial load - избегаем повторного применения предзагруженной темы
  useEffect(() => {
    async function syncTheme() {
      try {
        // Load preferred theme
        const serverPreferred = await getPreferredTheme();
        const validPreferred = ['sakura', 'new-year', 'spring', 'autumn'].includes(serverPreferred)
          ? serverPreferred as PreferredTheme
          : 'sakura';
        
        setPreferredThemeState(prev => prev !== validPreferred ? validPreferred : prev);

        // Load current theme
        const serverTheme = await getCurrentTheme();
        const validTheme = ['light', 'dark', 'sakura', 'new-year', 'spring', 'autumn'].includes(serverTheme) 
          ? serverTheme as Theme 
          : validPreferred;
        
        // Только обновляем если изменилась (предотвращаем мерцание)
        setThemeState(prev => prev !== validTheme ? validTheme : prev);
      } catch (error) {
        console.error('Failed to sync theme from server:', error);
      }
    }
    
    // Не загружаем в initial render - начинаем polling со скоростью каждые 3 сек
    const pollInterval = setInterval(syncTheme, 3000);
    
    return () => {
      clearInterval(pollInterval);
    };
  }, []);

  // Загружаем фоны один раз при монтировании (они уже применены в index.html)
  useEffect(() => {
    async function loadBackgroundSettings() {
      try {
        const settings = await getBackgroundSettings();
        if (settings && Object.keys(settings).length > 0) {
          // Только обновляем если изменилась
          setBackgroundSettings(prev => {
            const changed = JSON.stringify(prev) !== JSON.stringify(settings);
            return changed ? settings : prev;
          });
        }
      } catch (error) {
        console.error('Failed to load background settings:', error);
      }
    }
    
    // Загружаем фоны один раз при монтировании, БЕЗ polling
    loadBackgroundSettings();
  }, []);

  const applyBackgroundToTheme = (currentTheme: Theme, settings: BackgroundSettings) => {
    const themeKey = currentTheme === 'new-year' ? 'newyear' : currentTheme;
    const themeSetting = settings[themeKey as keyof BackgroundSettings];
    
    if (themeSetting) {
      const isMobile = window.innerWidth <= 768;
      
      // Выбираем мобильную или десктопную версию
      let imageUrl: string;
      if (isMobile && (themeSetting.mobileWebpImage || themeSetting.mobileImage)) {
        // Используем мобильную версию, если она есть
        imageUrl = themeSetting.mobileWebpImage || themeSetting.mobileImage || themeSetting.webpImage || themeSetting.image;
      } else {
        // Используем десктопную версию
        imageUrl = themeSetting.webpImage || themeSetting.image;
      }
      
      if (imageUrl) {
        document.body.style.backgroundImage = `url('${imageUrl}')`;
        document.body.style.backgroundAttachment = isMobile ? 'scroll' : 'fixed';
        document.body.style.backgroundSize = 'cover';
        
        // На мобильных устройствах позиционируем фон от верха для портретных изображений
        if (isMobile) {
          document.body.style.backgroundPosition = 'top center';
        } else {
          document.body.style.backgroundPosition = 'center center';
        }
        
        document.body.style.backgroundRepeat = 'no-repeat';
        console.log('🖼️ Background applied for theme:', currentTheme, 'Device:', isMobile ? 'Mobile' : 'Desktop', 'URL:', imageUrl);
      }
    }
  };

  useEffect(() => {
    // Apply theme class to document (он уже применен в index.html, но обновляем при изменении)
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'sakura', 'new-year', 'spring', 'autumn');
    root.classList.add(theme);
    console.log('🎨 Theme applied:', theme);

    // Apply background для новой темы (когда тема измениласьс)
    if (backgroundSettings && Object.keys(backgroundSettings).length > 0) {
      applyBackgroundToTheme(theme, backgroundSettings);
    }

    // Обработка изменения размера окна (поворот устройства)
    const handleResize = () => {
      if (backgroundSettings && Object.keys(backgroundSettings).length > 0) {
        applyBackgroundToTheme(theme, backgroundSettings);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, backgroundSettings]);

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
