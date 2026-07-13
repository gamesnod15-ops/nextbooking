import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  notes: string | null
  avatarUrl: string | null
  birthDate: string | null
  gender: string | null
  tags: string[]
  isBlocked: boolean
  lastVisitAt: string | null
  totalVisits: number
  totalSpent: number
  createdAt: string
}

export interface CustomersFilter {
  pageNumber?: number
  pageSize?: number
  search?: string
  isBlocked?: boolean
}

export function useCustomers(filter: CustomersFilter = {}) {
  return useQuery({
    queryKey: ['customers', filter],
    queryFn: () =>
      api.get<{ items: Customer[]; totalCount: number; totalPages: number }>(
        '/customers',
        { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Pick<Customer, 'name' | 'phone' | 'email' | 'notes' | 'birthDate'>) =>
      api.post('/customers', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useUpdateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Pick<Customer, 'id' | 'name' | 'phone' | 'email' | 'notes' | 'birthDate' | 'isBlocked'>) =>
      api.put(`/customers/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/customers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  })
}
