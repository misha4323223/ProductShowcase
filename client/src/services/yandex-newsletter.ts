const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

export async function subscribeToNewsletter(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/subscribe-newsletter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Не удалось подписаться' }));
    throw new Error(errorData.error || 'Не удалось подписаться на рассылку');
  }

  return response.json();
}

// Эти функции пока оставлены для совместимости с админкой
// TODO: Перенести на API Gateway когда будут созданы соответствующие endpoints

export async function getAllNewsletterSubscriptions(): Promise<any[]> {
  console.warn('getAllNewsletterSubscriptions: Функция требует API endpoint');
  return [];
}

export async function getActiveNewsletterEmails(): Promise<string[]> {
  console.warn('getActiveNewsletterEmails: Функция требует API endpoint');
  return [];
}

export async function unsubscribeFromNewsletter(id: string): Promise<void> {
  console.warn('unsubscribeFromNewsletter: Функция требует API endpoint');
}

export async function unsubscribeByEmail(email: string): Promise<void> {
  console.warn('unsubscribeByEmail: Функция требует API endpoint');
}
