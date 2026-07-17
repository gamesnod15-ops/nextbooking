import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export interface AdminDashboard {
  totalTenants: number
  activeTenants: number
  totalBusinessUsers: number
  totalCustomerUsers: number
  newUsersThisMonth: number
  revenueThisMonth: number
  revenueAllTime: number
  unresolvedFeedbackCount: number
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<AdminDashboard>('/admin/dashboard').then((r) => r.data),
  })
}
