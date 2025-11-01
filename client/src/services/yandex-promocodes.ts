
const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  expiresAt: Date;
  isActive: boolean;
}

export async function validatePromoCode(code: string): Promise<{ valid: boolean; discount?: number }> {
  const response = await fetch(`${API_GATEWAY_URL}/promocodes/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to validate promo code');
  }
  
  return response.json();
}
