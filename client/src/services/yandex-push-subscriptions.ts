import { docClient, generateId } from "@/lib/yandex-db";
import { PutCommand, ScanCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { PushSubscription } from "@/types/firebase-types";

const PUSH_SUBSCRIPTIONS_TABLE = "pushSubscriptions";

export async function savePushSubscription(
  subscriptionId: string,
  subscriptionToken?: string
): Promise<void> {
  const result = await docClient.send(new ScanCommand({
    TableName: PUSH_SUBSCRIPTIONS_TABLE,
  }));
  
  const existing = (result.Items || []).find(
    (item: any) => item.subscriptionId === subscriptionId
  );
  
  if (existing) {
    await docClient.send(new UpdateCommand({
      TableName: PUSH_SUBSCRIPTIONS_TABLE,
      Key: { id: existing.id },
      UpdateExpression: 'SET #status = :status, lastUpdated = :lastUpdated' + 
        (subscriptionToken ? ', subscriptionToken = :token' : ''),
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': 'subscribed',
        ':lastUpdated': new Date().toISOString(),
        ...(subscriptionToken && { ':token': subscriptionToken }),
      },
    }));
  } else {
    const id = generateId();
    await docClient.send(new PutCommand({
      TableName: PUSH_SUBSCRIPTIONS_TABLE,
      Item: {
        id,
        subscriptionId,
        subscriptionToken: subscriptionToken || '',
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        status: 'subscribed',
      },
    }));
  }
}

export async function updatePushSubscriptionStatus(
  subscriptionId: string,
  status: 'subscribed' | 'unsubscribed'
): Promise<void> {
  const result = await docClient.send(new ScanCommand({
    TableName: PUSH_SUBSCRIPTIONS_TABLE,
  }));
  
  const existing = (result.Items || []).find(
    (item: any) => item.subscriptionId === subscriptionId
  );
  
  if (existing) {
    await docClient.send(new UpdateCommand({
      TableName: PUSH_SUBSCRIPTIONS_TABLE,
      Key: { id: existing.id },
      UpdateExpression: 'SET #status = :status, lastUpdated = :lastUpdated',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':lastUpdated': new Date().toISOString(),
      },
    }));
  }
}

export async function getAllPushSubscriptions(): Promise<PushSubscription[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: PUSH_SUBSCRIPTIONS_TABLE,
  }));
  
  return (result.Items || []).map((item: any) => ({
    ...item,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
  })) as PushSubscription[];
}

export async function getActivePushSubscriptions(): Promise<PushSubscription[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: PUSH_SUBSCRIPTIONS_TABLE,
  }));
  
  const subscriptions = (result.Items || [])
    .filter((item: any) => item.status === 'subscribed')
    .map((item: any) => ({
      ...item,
      createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
      lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date(),
    }));
  
  return subscriptions as PushSubscription[];
}

export async function deletePushSubscription(id: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: PUSH_SUBSCRIPTIONS_TABLE,
    Key: { id },
  }));
}
