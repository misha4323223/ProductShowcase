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
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Ошибка получения категорий:', {
        status: response.status,
        statusText: response.statusText,
        body: text.substring(0, 200)
      });
      throw new Error(`Failed to get categories: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Получен не JSON:', text.substring(0, 200));
      throw new Error('Server returned non-JSON response');
    }

    const data = await response.json();
    console.log('✅ Категории успешно получены:', data.length, 'шт');
    return data;
  } catch (error: any) {
    console.error('❌ Ошибка в getAllCategories:', error);
    throw error;
  }
}

// ========== ADMIN API: PRODUCTS ==========

export async function createProduct(product: any): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.status}`);
  }
}

export async function updateProduct(id: string, updates: any): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update product: ${response.status}`);
  }
}

export async function deleteProduct(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/products/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete product: ${response.status}`);
  }
}

// ========== ADMIN API: CATEGORIES ==========

export async function createCategory(category: any): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(category),
  });

  if (!response.ok) {
    throw new Error(`Failed to create category: ${response.status}`);
  }
}

export async function updateCategory(id: string, updates: any): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update category: ${response.status}`);
  }
}

export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete category: ${response.status}`);
  }
}

// ========== REVIEWS API ==========

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export async function getReviews(productId?: string): Promise<Review[]> {
  const endpoint = productId ? `/reviews?productId=${productId}` : '/reviews';
  return fetchJSON<Review[]>(endpoint);
}

export async function createReview(review: {
  productId: string;
  userName: string;
  rating: number;
  comment: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    throw new Error(`Failed to create review: ${response.status}`);
  }
}

export async function deleteReview(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete review: ${response.status}`);
  }
}

// ========== PROMO CODES API ==========

export interface PromoCodeValidation {
  valid: boolean;
  message?: string;
  promoCode?: any;
  discountAmount?: number;
}

export async function validatePromoCode(code: string, orderTotal: number): Promise<PromoCodeValidation> {
  const response = await fetch(`${API_BASE_URL}/promocodes/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, orderTotal }),
  });

  if (!response.ok) {
    throw new Error(`Failed to validate promo code: ${response.status}`);
  }

  return response.json();
}