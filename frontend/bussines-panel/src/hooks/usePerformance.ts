import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export interface EmployeePerformance {
  employeeId: string
  employeeName: string
  title: string | null
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  totalRevenue: number
  completionRate: number
  avgDailyAppointments: number
}

export interface PerformanceFilter {
  pageNumber?: number
  pageSize?: number
  periodStart?: string
  periodEnd?: string
}

export function usePerformance(filter: PerformanceFilter = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['performance', filter],
    queryFn: () =>
      api.get<{ items: EmployeePerformance[]; totalCount: number; totalPages: number }>(
        '/performance', { params: filter }
      ).then((r) => r.data),
    enabled: options?.enabled ?? true,
  })
}
