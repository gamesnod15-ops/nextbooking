import api from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginatedList } from '@/types'

export type PlatformTenantSort = 'Recent' | 'Name' | 'MostEmployees' | 'MostCustomers'

export interface PlatformTenant {
  tenantId: string
  tenantName: string
  subdomain: string
  plan: string
  isActive: boolean
  trialEndsAt: string | null
  subscriptionEndsAt: string | null
  createdAt: string
  businessId: string | null
  businessName: string | null
  category: number | null
  city: string | null
  phone: string | null
  logoUrl: string | null
  ownerEmail: string | null
  ownerFullName: string | null
  employeeCount: number
  customerCount: number
}

export interface GetTenantsParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  plan?: string
  isActive?: boolean
  category?: number
  city?: string
  sort?: PlatformTenantSort
}

export function useAdminTenants(params: GetTenantsParams) {
  return useQuery({
    queryKey: ['admin', 'tenants', params],
    queryFn: () => api.get<PaginatedList<PlatformTenant>>('/admin/tenants', { params }).then((r) => r.data),
  })
}

export function useSetTenantActiveStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/tenants/${id}/status`, { isActive }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'tenants'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}
