export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  category: string;
  image: string;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface ProductData {
  categories: Category[];
  products: Product[];
}

export async function loadProducts(): Promise<ProductData> {
  try {
    const baseUrl = import.meta.env.BASE_URL || '/';
    const response = await fetch(`${baseUrl}data/products.json`);
    if (!response.ok) {
      throw new Error('Failed to load products');
    }
    const data: ProductData = await response.json();
    return data;
  } catch (error) {
    console.error('Error loading products:', error);
    return {
      categories: [],
      products: []
    };
  }
}
