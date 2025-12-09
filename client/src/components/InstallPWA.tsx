import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    'pwa-install-trigger': CustomEvent;
  }
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Проверка установлено ли приложение
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Определение iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Для iOS показываем баннер с инструкциями
    if (isIOSDevice) {
      setShowBanner(true);
      return;
    }

    // Для Android/Chrome - стандартный prompt
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    const externalTrigger = () => {
      if (isIOSDevice) {
        setShowIOSInstructions(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(({ outcome }) => {
          if (outcome === 'accepted') {
            setShowBanner(false);
          }
          setDeferredPrompt(null);
        });
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('pwa-install-trigger', externalTrigger);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('pwa-install-trigger', externalTrigger);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (isInstalled || !showBanner) return null;

  // Модальное окно с инструкциями для iOS
  if (showIOSInstructions) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in">
        <div className="bg-card border border-border rounded-lg shadow-xl p-6 max-w-md w-full animate-in slide-in-from-bottom-4">
          <button
            onClick={() => setShowIOSInstructions(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="font-semibold text-lg text-foreground mb-4">
            📱 Установка на iPhone
          </h3>
          
          <ol className="space-y-3 text-sm text-foreground">
            <li className="flex gap-2">
              <span className="font-semibold">1.</span>
              <span>Нажмите кнопку <strong>"Поделиться"</strong> внизу экрана Safari (значок со стрелкой вверх)</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">2.</span>
              <span>Прокрутите вниз и выберите <strong>"На экран «Домой»"</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">3.</span>
              <span>Нажмите <strong>"Добавить"</strong> в правом верхнем углу</span>
            </li>
          </ol>

          <div className="mt-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              💡 После установки приложение появится на главном экране вашего iPhone
            </p>
          </div>

          <Button
            onClick={() => setShowIOSInstructions(false)}
            className="mt-4 w-full"
          >
            Понятно
          </Button>
        </div>
      </div>
    );
  }

  // Обычный баннер
  return (
    <div 
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border border-border rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4"
      data-testid="banner-install-pwa"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        data-testid="button-dismiss-pwa"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6 text-pink-500" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground">
            Установить приложение
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {isIOS 
              ? 'Добавьте приложение на главный экран' 
              : 'Быстрый доступ к магазину прямо с экрана телефона'}
          </p>
          
          <Button
            onClick={handleInstall}
            size="sm"
            className="mt-3 w-full"
            data-testid="button-install-pwa"
          >
            <Download className="w-4 h-4 mr-2" />
            {isIOS ? 'Как установить?' : 'Установить'}
          </Button>
        </div>
      </div>
    </div>
  );
}
