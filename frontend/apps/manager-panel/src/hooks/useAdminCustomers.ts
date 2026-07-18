import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import type { PaginatedList } from '@/types'

export interface PlatformCustomer {
  id: string
  name: string
  phone: string
  email: string | null
  isBlocked: boolean
  totalVisits: number
  totalSpent: number
  lastVisitAt: string | null
  createdAt: string
  tenantId: string
  tenantName: string | null
  businessName: string | null
}

export interface GetCustomersParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  tenantId?: string
}

export function useAdminCustomers(params: GetCustomersParams) {
  return useQuery({
    queryKey: ['admin', 'customers', params],
    queryFn: () => api.get<PaginatedList<PlatformCustomer>>('/admin/customers', { params }).then((r) => r.data),
  })
}
