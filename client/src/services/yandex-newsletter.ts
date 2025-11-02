
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

export interface NewsletterSubscription {
  id: string;
  email: string;
  createdAt: Date;
}

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

export async function getAllNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
  const response = await fetch(`${API_BASE_URL}/newsletter-subscriptions`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Не удалось загрузить подписки');
  }

  const data = await response.json();
  
  return data.map((sub: any) => ({
    id: sub.id,
    email: sub.email,
    createdAt: new Date(sub.createdAt),
  }));
}

export async function getActiveNewsletterEmails(): Promise<string[]> {
  const subscriptions = await getAllNewsletterSubscriptions();
  return subscriptions.map(sub => sub.email);
}

export async function unsubscribeFromNewsletter(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/newsletter-subscriptions/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Не удалось отписаться' }));
    throw new Error(errorData.error || 'Не удалось отписаться от рассылки');
  }
}

export async function unsubscribeByEmail(email: string): Promise<void> {
  const subscriptions = await getAllNewsletterSubscriptions();
  const subscription = subscriptions.find(sub => sub.email === email);
  
  if (!subscription) {
    throw new Error('Подписка не найдена');
  }
  
  await unsubscribeFromNewsletter(subscription.id);
}
