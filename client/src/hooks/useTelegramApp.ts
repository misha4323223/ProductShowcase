/**
 * Hook for managing Telegram Mini App lifecycle
 */

import { useEffect, useCallback, useState } from 'react';
import {
  isTelegramMiniApp,
  initTelegramWebApp,
  getTelegramUserData,
  getTelegramInitData,
} from '@/lib/telegram';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  is_bot: boolean;
}

export function useTelegramApp() {
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    // Check if running inside Telegram
    const inMiniApp = isTelegramMiniApp();
    setIsInMiniApp(inMiniApp);

    if (inMiniApp) {
      // Initialize Telegram Web App
      initTelegramWebApp();

      // Get user data and initData
      const user = getTelegramUserData();
      const data = getTelegramInitData();

      if (user) {
        setTelegramUser(user);
      }
      if (data) {
        setInitData(data);
      }

      console.log('📱 Telegram Mini App detected', { user, hasInitData: !!data });
    } else {
      console.log('📱 Not running inside Telegram Mini App');
    }
  }, []);

  const getTelegramUserId = useCallback(() => {
    return telegramUser?.id || null;
  }, [telegramUser]);

  const getTelegramUsername = useCallback(() => {
    return telegramUser?.username || null;
  }, [telegramUser]);

  return {
    isInMiniApp,
    telegramUser,
    initData,
    getTelegramUserId,
    getTelegramUsername,
  };
}
