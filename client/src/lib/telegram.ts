/**
 * Telegram Mini App Integration Utilities
 * Handles authentication and communication with Telegram Mini App
 */

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          query_id?: string;
          user?: {
            id: number;
            is_bot: boolean;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
          };
          auth_date: number;
          hash: string;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          show: () => void;
          hide: () => void;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        BackButton: {
          isVisible: boolean;
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
        onEvent: (eventType: string, callback: (data: any) => void) => void;
      };
    };
  }
}

const API_GATEWAY_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

/**
 * Check if running inside Telegram Mini App
 */
export function isTelegramMiniApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

/**
 * Initialize Telegram Web App
 */
export function initTelegramWebApp() {
  if (!isTelegramMiniApp()) {
    console.warn('Not running inside Telegram Mini App');
    return;
  }

  const webApp = window.Telegram!.WebApp;
  
  // Expand the mini app to full height
  webApp.expand();
  
  // Indicate that the web app is ready
  webApp.ready();
  
  console.log('✅ Telegram Web App initialized');
}

/**
 * Get Telegram initData for authentication
 */
export function getTelegramInitData(): string | null {
  if (!isTelegramMiniApp()) {
    return null;
  }

  return window.Telegram!.WebApp.initData;
}

/**
 * Get Telegram user data from initDataUnsafe
 */
export function getTelegramUserData() {
  if (!isTelegramMiniApp()) {
    return null;
  }

  const initDataUnsafe = window.Telegram!.WebApp.initDataUnsafe;
  return initDataUnsafe.user || null;
}

/**
 * Authenticate with Telegram Mini App
 * Links Telegram ID to user account
 */
export async function authenticateWithTelegram(email: string): Promise<{
  success: boolean;
  message: string;
  user?: {
    email: string;
    userId: string;
    telegramId: string;
    telegramUsername?: string;
  };
  error?: string;
}> {
  const initData = getTelegramInitData();
  
  if (!initData) {
    return {
      success: false,
      message: 'Telegram Mini App is not available',
      error: 'NOT_IN_TELEGRAM',
    };
  }

  try {
    const response = await fetch(`${API_GATEWAY_URL}/api/telegram/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        initData,
        email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: 'Failed to authenticate with Telegram',
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Telegram ID linked successfully',
      user: data.user,
    };
  } catch (error: any) {
    console.error('❌ Telegram authentication error:', error);
    return {
      success: false,
      message: 'Error during Telegram authentication',
      error: error.message,
    };
  }
}

/**
 * Send order notification to user's Telegram chat
 */
export async function sendOrderNotificationToTelegram(orderData: {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  subtotal?: number;
  discount?: number;
  promoCode?: string;
  shippingAddress: string;
  createdAt?: string;
  deliveryService?: string;
  deliveryType?: string;
  cdekDeliveryCost?: number;
  deliveryCost?: number;
  deliveryPointName?: string;
}): Promise<{
  success: boolean;
  message: string;
  notificationSent?: boolean;
  telegramId?: string;
  orderId?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${API_GATEWAY_URL}/api/send-order-to-user-telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: 'Failed to send Telegram notification',
        error: errorData.error || `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: data.message || 'Order notification sent',
      notificationSent: data.notificationSent,
      telegramId: data.telegramId,
      orderId: data.orderId,
    };
  } catch (error: any) {
    console.error('❌ Failed to send order notification to Telegram:', error);
    // Don't throw - this should not block the checkout process
    return {
      success: false,
      message: 'Error sending Telegram notification',
      notificationSent: false,
      error: error.message,
    };
  }
}

/**
 * Show Telegram Main Button
 */
export function showMainButton(text: string = 'OK', callback?: () => void) {
  if (!isTelegramMiniApp()) return;

  const mainButton = window.Telegram!.WebApp.MainButton;
  mainButton.setText(text);
  mainButton.show();

  if (callback) {
    // Clear previous callbacks
    mainButton.offClick(callback);
    mainButton.onClick(callback);
  }
}

/**
 * Hide Telegram Main Button
 */
export function hideMainButton() {
  if (!isTelegramMiniApp()) return;
  window.Telegram!.WebApp.MainButton.hide();
}

/**
 * Show Telegram Back Button
 */
export function showBackButton(callback?: () => void) {
  if (!isTelegramMiniApp()) return;

  const backButton = window.Telegram!.WebApp.BackButton;
  backButton.show();

  if (callback) {
    backButton.offClick(callback);
    backButton.onClick(callback);
  }
}

/**
 * Hide Telegram Back Button
 */
export function hideBackButton() {
  if (!isTelegramMiniApp()) return;
  window.Telegram!.WebApp.BackButton.hide();
}

/**
 * Close Telegram Mini App
 */
export function closeMiniApp() {
  if (!isTelegramMiniApp()) return;
  window.Telegram!.WebApp.close();
}
