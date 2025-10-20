import { useQuery } from "@tanstack/react-query";
import { getAllProducts, getProductById, getProductsByCategory, getAllCategories } from "@/services/firebase-products";
import type { Product } from "@/types/firebase-types";

export function useProducts() {
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts,
    staleTime: 1000 * 60 * 5,
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories'],
    queryFn: getAllCategories,
    staleTime: 1000 * 60 * 5,
  });

  return {
    products: productsQuery.data ?? [],
    categories: categoriesQuery.data ?? [],
    isLoading: productsQuery.isLoading || categoriesQuery.isLoading,
    error: productsQuery.error || categoriesQuery.error
  };
}

export function useProduct(id: string | undefined) {
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => id ? getProductById(id) : Promise.resolve(null),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
  
  return {
    product,
    isLoading
  };
}

export function useProductsByCategory(categorySlug: string | undefined) {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'category', categorySlug],
    queryFn: () => categorySlug ? getProductsByCategory(categorySlug) : Promise.resolve([]),
    enabled: !!categorySlug,
    staleTime: 1000 * 60 * 5,
  });
  
  return {
    products: products ?? [],
    isLoading
  };
}
