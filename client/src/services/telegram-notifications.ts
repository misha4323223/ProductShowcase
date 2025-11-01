const TELEGRAM_BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramSubscription {
  chatId: string;
  username?: string;
  firstName?: string;
  subscribed: boolean;
  subscribedAt: Date;
}

export async function sendTelegramNotification(
  chatId: string,
  message: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown';
    disable_web_page_preview?: boolean;
  }
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: options?.parse_mode || 'HTML',
        disable_web_page_preview: options?.disable_web_page_preview ?? true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Telegram API error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

export async function sendBulkTelegramNotifications(
  chatIds: string[],
  message: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const chatId of chatIds) {
    const result = await sendTelegramNotification(chatId, message);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { success, failed };
}

export function getTelegramBotLink(): string {
  const botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME;
  return `https://t.me/${botUsername}?start=subscribe`;
}

export function formatProductNotification(productName: string, productUrl: string): string {
  return `🎉 <b>Товар снова в наличии!</b>\n\n` +
         `📦 ${productName}\n\n` +
         `🔗 <a href="${productUrl}">Перейти к товару</a>`;
}

export function formatPromoNotification(promoCode: string, discount: string, description?: string): string {
  return `🎁 <b>Новый промокод!</b>\n\n` +
         `💰 Код: <code>${promoCode}</code>\n` +
         `📊 Скидка: ${discount}\n` +
         (description ? `📝 ${description}\n` : '') +
         `\n🛒 Используйте при оформлении заказа!`;
}
