import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import type { PaginatedList } from '@/types'

export interface PlatformEmployee {
  id: string
  name: string
  title: string | null
  phone: string | null
  email: string | null
  isActive: boolean
  acceptsOnlineBookings: boolean
  createdAt: string
  tenantId: string
  tenantName: string | null
  businessName: string | null
}

export interface GetEmployeesParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  tenantId?: string
  isActive?: boolean
}

export function useAdminEmployees(params: GetEmployeesParams) {
  return useQuery({
    queryKey: ['admin', 'employees', params],
    queryFn: () => api.get<PaginatedList<PlatformEmployee>>('/admin/employees', { params }).then((r) => r.data),
  })
}
