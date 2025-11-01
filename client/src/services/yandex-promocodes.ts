import { docClient, generateId } from "@/lib/yandex-db";
import { PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { PromoCode } from "@/types/firebase-types";

const PROMOCODES_TABLE = "promocodes";
const ORDERS_TABLE = "orders";

export async function getPromoCodeUsageCount(promoCodeOrId: string): Promise<number> {
  const result = await docClient.send(new ScanCommand({
    TableName: ORDERS_TABLE,
  }));
  
  const orders = result.Items || [];
  return orders.filter((order: any) => 
    order.promoCode && order.promoCode.code === promoCodeOrId.toUpperCase()
  ).length;
}

export async function getAllPromoCodes(): Promise<PromoCode[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: PROMOCODES_TABLE,
  }));
  
  return (result.Items || []).map((item: any) => ({
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    startDate: item.startDate ? new Date(item.startDate) : undefined,
    endDate: item.endDate ? new Date(item.endDate) : undefined,
  })) as PromoCode[];
}

export async function getPromoCodeByCode(code: string): Promise<PromoCode | null> {
  const allPromoCodes = await getAllPromoCodes();
  const promoCode = allPromoCodes.find(p => p.code === code.toUpperCase());
  
  return promoCode || null;
}

export interface PromoCodeValidationResult {
  valid: boolean;
  message?: string;
  promoCode?: PromoCode;
  discountAmount?: number;
}

export async function validatePromoCode(
  code: string, 
  orderTotal: number
): Promise<PromoCodeValidationResult> {
  const promoCode = await getPromoCodeByCode(code);
  
  if (!promoCode) {
    return { valid: false, message: "Промокод не найден" };
  }
  
  if (!promoCode.active) {
    return { valid: false, message: "Промокод неактивен" };
  }
  
  const now = new Date();
  
  if (promoCode.startDate && now < promoCode.startDate) {
    return { valid: false, message: "Промокод еще не действует" };
  }
  
  if (promoCode.endDate && now > promoCode.endDate) {
    return { valid: false, message: "Промокод истек" };
  }
  
  if (promoCode.maxUses) {
    const currentUses = await getPromoCodeUsageCount(promoCode.code);
    if (currentUses >= promoCode.maxUses) {
      return { valid: false, message: "Промокод исчерпан" };
    }
  }
  
  if (promoCode.minOrderAmount && orderTotal < promoCode.minOrderAmount) {
    return { 
      valid: false, 
      message: `Минимальная сумма заказа для этого промокода: ${promoCode.minOrderAmount}₽` 
    };
  }
  
  let discountAmount = 0;
  if (promoCode.discountType === 'percentage') {
    if (promoCode.discountValue >= 100) {
      return { valid: false, message: "Некорректная скидка" };
    }
    discountAmount = Math.round(orderTotal * (promoCode.discountValue / 100));
  } else {
    if (promoCode.discountValue >= orderTotal) {
      return { valid: false, message: "Скидка не может превышать сумму заказа" };
    }
    discountAmount = promoCode.discountValue;
  }
  
  discountAmount = Math.min(discountAmount, Math.floor(orderTotal * 0.99));
  
  return { 
    valid: true, 
    promoCode,
    discountAmount
  };
}

export async function createPromoCode(promoCode: Omit<PromoCode, 'id' | 'createdAt'>): Promise<string> {
  const id = generateId();
  const data = {
    ...promoCode,
    id,
    code: promoCode.code.toUpperCase(),
    createdAt: new Date().toISOString(),
    startDate: promoCode.startDate ? new Date(promoCode.startDate).toISOString() : undefined,
    endDate: promoCode.endDate ? new Date(promoCode.endDate).toISOString() : undefined,
  };
  
  await docClient.send(new PutCommand({
    TableName: PROMOCODES_TABLE,
    Item: data,
  }));
  
  return id;
}

export async function updatePromoCode(id: string, updates: Partial<Omit<PromoCode, 'id' | 'createdAt'>>): Promise<void> {
  const data = { ...updates };
  if (data.code) {
    data.code = data.code.toUpperCase();
  }
  
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};
  
  Object.entries(data).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });
  
  if (updateExpressions.length > 0) {
    await docClient.send(new UpdateCommand({
      TableName: PROMOCODES_TABLE,
      Key: { id },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    }));
  }
}

export async function deletePromoCode(id: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: PROMOCODES_TABLE,
    Key: { id },
  }));
}
