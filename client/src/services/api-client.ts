import type { Product, Category } from "@/types/firebase-types";

const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || '';

async function fetchJSON<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  return fetchJSON<Product[]>('/products');
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    return await fetchJSON<Product>(`/products/${id}`);
  } catch (error) {
    console.error(`Product ${id} not found:`, error);
    return null;
  }
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

export async function getAllCategories(): Promise<Category[]> {
  return fetchJSON<Category[]>('/categories');
}
