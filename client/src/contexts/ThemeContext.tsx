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
  // Инициализируем тему: сначала localStorage (для независимости браузеров), затем pre-load скрипт
  const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      // Приоритет 1: localStorage (для независимости каждого браузера)
      const stored = localStorage.getItem('user-theme');
      if (stored && ['light', 'dark', 'sakura', 'new-year', 'spring', 'autumn'].includes(stored)) {
        return stored as Theme;
      }
      // Приоритет 2: pre-load скрипт из index.html
      const preloaded = (window as any).__initialTheme;
      if (preloaded) {
        return preloaded as Theme;
      }
    }
    return 'sakura';
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme());
  const [preferredThemeState, setPreferredThemeState] = useState<PreferredTheme>('sakura');
  // isLoading = false потому что тема и фон уже предзагружены в index.html
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundSettings, setBackgroundSettings] = useState<BackgroundSettings>({
    sakura: { image: '', webpImage: '', title: '' },
    newyear: { image: '', webpImage: '', title: '' },
    spring: { image: '', webpImage: '', title: '' },
    autumn: { image: '', webpImage: '', title: '' },
  });

  // Загружаем данные с сервера для синхронизации сезонных тем (глобальные)
  // light/dark темы НЕ синхронизируются (локальные для каждого браузера)
  useEffect(() => {
    async function syncTheme() {
      try {
        // Load preferred theme
        const serverPreferred = await getPreferredTheme();
        const validPreferred = ['sakura', 'new-year', 'spring', 'autumn'].includes(serverPreferred)
          ? serverPreferred as PreferredTheme
          : 'sakura';
        
        setPreferredThemeState(prev => prev !== validPreferred ? validPreferred : prev);

        // Load current theme - но ТОЛЬКО если это сезонная тема (не light/dark)
        const serverTheme = await getCurrentTheme();
        const validTheme = ['sakura', 'new-year', 'spring', 'autumn'].includes(serverTheme)
          ? serverTheme as Theme 
          : validPreferred;
        
        // Синхронизируем только сезонные темы (свет/темнота остаются локальными)
        setThemeState(prev => {
          // Если текущая тема - light/dark, не переключаем на глобальную
          if (['light', 'dark'].includes(prev)) {
            return prev;
          }
          // Иначе синхронизируем сезонную тему
          return prev !== validTheme ? validTheme : prev;
        });
      } catch (error) {
        console.error('Failed to sync theme from server:', error);
      }
    }
    
    // Первый синк сразу, потом polling каждые 3 сек
    syncTheme();
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
      // Используем 1024px как breakpoint - совпадает с CSS media queries
      const isMobile = window.innerWidth <= 1024;
      
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
        // Надежный iOS detection с несколькими fallback методами
        const detectIOS = (): boolean => {
          // Метод 1: navigator.userAgentData (новый API)
          if ('userAgentData' in navigator) {
            const uaData = (navigator as any).userAgentData;
            if (uaData?.platform === 'iOS') return true;
          }
          
          // Метод 2: классический userAgent
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return true;
          
          // Метод 3: MacIntel + touch support (iPad в desktop режиме)
          if (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
          
          // Метод 4: проверка touchstart event (последний fallback)
          if ('ontouchstart' in window && navigator.maxTouchPoints > 0) {
            // Дополнительная проверка что это не Android
            if (!/Android/.test(navigator.userAgent)) {
              return true;
            }
          }
          
          return false;
        };
        
        const isIOS = detectIOS();
        
        if (isIOS && isMobile) {
          // Для iOS: используем ::before псевдоэлемент с contain вместо cover
          const rootElement = document.getElementById('root');
          const htmlElement = document.documentElement;
          const bodyElement = document.body;
          
          // Очищаем html и body
          htmlElement.style.setProperty('background-image', 'none', 'important');
          htmlElement.style.setProperty('background-color', 'transparent', 'important');
          bodyElement.style.setProperty('background-color', 'transparent', 'important');
          bodyElement.style.setProperty('background-image', 'none', 'important');
          
          // Применяем фон через ::before используя CSS custom property
          if (rootElement) {
            rootElement.classList.add('ios-background');
            htmlElement.style.setProperty('--ios-bg-image', `url('${imageUrl}')`);
            (rootElement as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
            (rootElement as HTMLElement).style.setProperty('background-image', 'none', 'important');
          }
          console.log('🖼️ Background applied for theme:', currentTheme, 'Device:', 'iOS (::before + contain)', 'URL:', imageUrl);
        } else {
          // Для Android и десктопа: фон на html элемент
          const htmlElement = document.documentElement;
          const rootElement = document.getElementById('root');
          
          htmlElement.style.setProperty('background-image', `url('${imageUrl}')`, 'important');
          htmlElement.style.setProperty('background-repeat', 'no-repeat', 'important');
          htmlElement.style.setProperty('background-color', 'transparent', 'important');
          htmlElement.style.setProperty('background-size', 'cover', 'important');
          htmlElement.style.setProperty('background-attachment', 'fixed', 'important');
          htmlElement.style.setProperty('background-position', 'center center', 'important');
          
          // Body и root прозрачные, убираем iOS класс
          document.body.style.setProperty('background-color', 'transparent', 'important');
          document.body.style.setProperty('background-image', 'none', 'important');
          if (rootElement) {
            rootElement.classList.remove('ios-background');
            htmlElement.style.removeProperty('--ios-bg-image');
            (rootElement as HTMLElement).style.setProperty('background-color', 'transparent', 'important');
            (rootElement as HTMLElement).style.setProperty('background-image', 'none', 'important');
          }
          
          console.log('🖼️ Background applied for theme:', currentTheme, 'Device:', isMobile ? 'Android/Mobile' : 'Desktop', 'URL:', imageUrl);
        }
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
      // Light/dark темы сохраняем в localStorage (локальные)
      if (['light', 'dark'].includes(newTheme)) {
        localStorage.setItem('user-theme', newTheme);
        setThemeState(newTheme);
        console.log('✅ Theme saved to localStorage (local):', newTheme);
      } else {
        // Сезонные темы сохраняем на сервер (глобальные)
        await setCurrentTheme(newTheme);
        setThemeState(newTheme);
        console.log('✅ Theme saved to server (global):', newTheme);
      }
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const setPreferredThemeFunc = async (newPreferred: PreferredTheme) => {
    try {
      // Save to server first (это глобальное предпочтение)
      await setPreferredTheme(newPreferred);
      // Then update local state
      setPreferredThemeState(newPreferred);
      // Also set current theme to the preferred theme (глобальная синхронизация)
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
