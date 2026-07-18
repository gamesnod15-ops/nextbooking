import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export interface MonthlyPoint {
  label: string
  value: number
}

export interface PaymentTypeBreakdown {
  type: 'subscription' | 'advertiser' | 'sponsorship'
  amount: number
  count: number
}

export interface AdminDashboard {
  totalTenants: number
  activeTenants: number
  totalBusinessUsers: number
  totalCustomerUsers: number
  totalCustomers: number
  totalEmployees: number
  totalPayments: number
  newUsersThisMonth: number
  revenueThisMonth: number
  revenueAllTime: number
  unresolvedFeedbackCount: number
  monthlyRevenue: MonthlyPoint[]
  tenantGrowth: MonthlyPoint[]
  paymentsByType: PaymentTypeBreakdown[]
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get<AdminDashboard>('/admin/dashboard').then((r) => r.data),
  })
}
