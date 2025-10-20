import { useQuery } from "@tanstack/react-query";
import { loadProducts, type Product, type Category } from "@/lib/products";

export function useProducts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: loadProducts,
    staleTime: 1000 * 60 * 5,
  });

  return {
    products: data?.products ?? [],
    categories: data?.categories ?? [],
    isLoading,
    error
  };
}

export function useProduct(id: string | undefined) {
  const { products, isLoading } = useProducts();
  
  const product = products.find(p => p.id === id);
  
  return {
    product,
    isLoading
  };
}

export function useProductsByCategory(categorySlug: string | undefined) {
  const { products, isLoading } = useProducts();
  
  const filteredProducts = categorySlug === 'sale'
    ? products.filter(p => p.salePrice !== undefined)
    : products.filter(p => p.category === categorySlug);
  
  return {
    products: filteredProducts,
    isLoading
  };
}
