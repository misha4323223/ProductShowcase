const API_GATEWAY = "https://d4efkrvud5o73t4cskgk.functions.yandexcloud.net";

export interface TelegramSubscriber {
  chatId: number;
  username?: string | null;
  firstName?: string | null;
  subscribedAt: string;
  isActive: boolean;
}

export async function getTelegramSubscribers(): Promise<TelegramSubscriber[]> {
  try {
    const response = await fetch(API_GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "get_subscribers" })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusCode}`);
    }

    const data = await response.json();
    return data.subscribers || [];
  } catch (error) {
    console.error("Error fetching Telegram subscribers:", error);
    return [];
  }
}

export async function sendTelegramBroadcast(title: string, message: string) {
  try {
    const response = await fetch(API_GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        action: "send",
        title,
        message
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusCode}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending Telegram broadcast:", error);
    throw error;
  }
}
