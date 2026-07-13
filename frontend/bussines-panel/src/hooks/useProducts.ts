import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Product {
  id: string
  name: string
  description: string | null
  category: string | null
  barcode: string | null
  imageUrl: string | null
  salePrice: number
  costPrice: number | null
  stockQuantity: number
  minStockLevel: number
  unit: string
  isActive: boolean
  isLowStock: boolean
  createdAt: string
}

export interface ProductsFilter {
  pageNumber?: number
  pageSize?: number
  search?: string
  category?: string
  lowStockOnly?: boolean
}

export function useProducts(filter: ProductsFilter = {}) {
  return useQuery({
    queryKey: ['products', filter],
    queryFn: () =>
      api.get<{ items: Product[]; totalCount: number; totalPages: number }>(
        '/products', { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Product, 'id' | 'isLowStock' | 'createdAt' | 'isActive'>) =>
      api.post('/products', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Omit<Product, 'isLowStock' | 'createdAt'>) =>
      api.put(`/products/${id}`, { id, ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  })
}
