import type { PromoCode } from "@/types/firebase-types";

const API_GATEWAY_URL = 'https://d5dimdj7itkijbl4s0g4.y5sm01em.apigw.yandexcloud.net';

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

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const response = await fetch(`${API_GATEWAY_URL}/promocodes`);
  
  if (!response.ok) {
    throw new Error('Failed to get promo codes');
  }
  
  const data = await response.json();
  return data.map((promo: any) => ({
    ...promo,
    createdAt: new Date(promo.createdAt),
    startDate: promo.startDate ? new Date(promo.startDate) : undefined,
    endDate: promo.endDate ? new Date(promo.endDate) : undefined,
  }));
}

export async function createPromoCode(promo: Omit<PromoCode, 'id' | 'createdAt'>): Promise<string> {
  const response = await fetch(`${API_GATEWAY_URL}/promocodes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(promo),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create promo code');
  }
  
  const data = await response.json();
  return data.id;
}

export async function updatePromoCode(id: string, promo: Partial<PromoCode>): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/promocodes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(promo),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update promo code');
  }
}

export async function deletePromoCode(id: string): Promise<void> {
  const response = await fetch(`${API_GATEWAY_URL}/promocodes/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete promo code');
  }
}

export async function getPromoCodeUsageCount(id: string): Promise<number> {
  return 0;
}
