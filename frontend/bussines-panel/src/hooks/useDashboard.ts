import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export interface AppointmentSummary {
  id: string
  customerName: string
  serviceName: string
  employeeName: string
  startTime: string
  endTime: string
  status: string
  price: number
}

export interface WeeklyStat {
  day: string
  appointments: number
  revenue: number
}

export interface MonthlyStat {
  month: string
  appointments: number
  revenue: number
}

export interface DashboardStats {
  todayAppointments: number
  todayCompleted: number
  todayCancelled: number
  todayPending: number
  todayRevenue: number
  monthAppointments: number
  monthRevenue: number
  occupancyRate: number
  totalCustomers: number
  todayAppointmentList: AppointmentSummary[]
  weeklyStats: WeeklyStat[]
  monthlyStats: MonthlyStat[]
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () =>
      api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
    refetchInterval: 60 * 1000, // refresh every minute
    staleTime: 30 * 1000,
  })
}
