import { docClient, generateId } from "@/lib/yandex-db";
import { PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import type { WishlistItem } from "@/types/firebase-types";

const WISHLISTS_TABLE = "wishlists";

export async function addToWishlist(userId: string, productId: string): Promise<void> {
  const id = `${userId}_${productId}`;
  
  await docClient.send(new PutCommand({
    TableName: WISHLISTS_TABLE,
    Item: {
      id,
      userId,
      productId,
      addedAt: new Date().toISOString(),
    },
  }));
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
  const id = `${userId}_${productId}`;
  
  await docClient.send(new DeleteCommand({
    TableName: WISHLISTS_TABLE,
    Key: { id },
  }));
}

export async function getWishlist(userId: string): Promise<WishlistItem[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: WISHLISTS_TABLE,
  }));
  
  const items = (result.Items || [])
    .filter((item: any) => item.userId === userId)
    .map((item: any) => ({
      productId: item.productId,
      addedAt: new Date(item.addedAt),
    }));
  
  return items as WishlistItem[];
}

export async function isInWishlist(userId: string, productId: string): Promise<boolean> {
  const wishlistItems = await getWishlist(userId);
  return wishlistItems.some(item => item.productId === productId);
}
