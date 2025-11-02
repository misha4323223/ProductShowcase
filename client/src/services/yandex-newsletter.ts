import { docClient, generateId } from "@/lib/yandex-db";
import { PutCommand, ScanCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import type { NewsletterSubscription } from "@/types/firebase-types";

const NEWSLETTER_TABLE = "newsletterSubscriptions";

export async function subscribeToNewsletter(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  
  const result = await docClient.send(new ScanCommand({
    TableName: NEWSLETTER_TABLE,
  }));
  
  const existing = (result.Items || []).find(
    (item: any) => item.email === normalizedEmail && item.active === true
  );
  
  if (existing) {
    throw new Error("Этот email уже подписан на рассылку");
  }
  
  const id = generateId();
  await docClient.send(new PutCommand({
    TableName: NEWSLETTER_TABLE,
    Item: {
      id,
      email: normalizedEmail,
      createdAt: new Date().toISOString(),
      active: true,
    },
  }));
}

export async function getAllNewsletterSubscriptions(): Promise<NewsletterSubscription[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: NEWSLETTER_TABLE,
  }));
  
  return (result.Items || [])
    .filter((item: any) => item.active === true)
    .map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    })) as NewsletterSubscription[];
}

export async function getActiveNewsletterEmails(): Promise<string[]> {
  const subscriptions = await getAllNewsletterSubscriptions();
  return subscriptions.map(sub => sub.email);
}

export async function unsubscribeFromNewsletter(id: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: NEWSLETTER_TABLE,
    Key: { id },
  }));
}

export async function unsubscribeByEmail(email: string): Promise<void> {
  const normalizedEmail = email.toLowerCase().trim();
  const result = await docClient.send(new ScanCommand({
    TableName: NEWSLETTER_TABLE,
  }));
  
  const subscription = (result.Items || []).find(
    (item: any) => item.email === normalizedEmail
  );
  
  if (subscription) {
    await unsubscribeFromNewsletter(subscription.id);
  }
}
