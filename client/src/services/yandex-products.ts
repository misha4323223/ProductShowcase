import { docClient } from "@/lib/yandex-db";
import { PutCommand, GetCommand, ScanCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import type { Product, Category } from "@/types/firebase-types";

const PRODUCTS_TABLE = "products";
const CATEGORIES_TABLE = "categories";

export async function getAllProducts(): Promise<Product[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: PRODUCTS_TABLE,
  }));
  
  return (result.Items || []) as Product[];
}

export async function getProductById(id: string): Promise<Product | null> {
  const result = await docClient.send(new GetCommand({
    TableName: PRODUCTS_TABLE,
    Key: { id },
  }));
  
  return result.Item as Product || null;
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const allProducts = await getAllProducts();
  
  if (categorySlug === 'sale') {
    return allProducts.filter(p => p.salePrice != null);
  }
  
  return allProducts.filter(p => p.category === categorySlug);
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const allProducts = await getAllProducts();
  return allProducts.filter(p => p.featured === true);
}

export async function getProductsSorted(sortBy: 'price-asc' | 'price-desc' | 'popularity' | 'newest'): Promise<Product[]> {
  const allProducts = await getAllProducts();
  
  switch (sortBy) {
    case 'price-asc':
      return [...allProducts].sort((a, b) => a.price - b.price);
    case 'price-desc':
      return [...allProducts].sort((a, b) => b.price - a.price);
    case 'popularity':
      return [...allProducts].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    case 'newest':
      return [...allProducts].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
    default:
      return allProducts;
  }
}

export async function createProduct(product: Product): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: PRODUCTS_TABLE,
    Item: product,
  }));
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};
  
  Object.entries(updates).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });
  
  await docClient.send(new UpdateCommand({
    TableName: PRODUCTS_TABLE,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  }));
}

export async function deleteProduct(id: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: PRODUCTS_TABLE,
    Key: { id },
  }));
}

export async function getAllCategories(): Promise<Category[]> {
  const result = await docClient.send(new ScanCommand({
    TableName: CATEGORIES_TABLE,
  }));
  
  return (result.Items || []) as Category[];
}

export async function createCategory(category: Category): Promise<void> {
  await docClient.send(new PutCommand({
    TableName: CATEGORIES_TABLE,
    Item: category,
  }));
}

export async function deleteCategory(id: string): Promise<void> {
  await docClient.send(new DeleteCommand({
    TableName: CATEGORIES_TABLE,
    Key: { id },
  }));
}
