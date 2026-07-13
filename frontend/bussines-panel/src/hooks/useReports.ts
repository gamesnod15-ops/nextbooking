import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ReportsKpi {
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  pendingAppointments: number
  totalRevenue: number
  averageBasket: number
  cancellationRate: number
  completionRate: number
  newCustomers: number
  uniqueCustomers: number
}

export interface RevenueTimeline {
  label: string
  revenue: number
  appointments: number
}

export interface ServiceBreakdown {
  serviceName: string
  count: number
  revenue: number
  percentage: number
}

export interface EmployeePerformance {
  employeeName: string
  appointments: number
  completed: number
  revenue: number
  completionRate: number
}

export interface DailyBreakdown {
  date: string
  appointments: number
  revenue: number
}

export interface StatusBreakdown {
  status: string
  count: number
  percentage: number
}

export interface ReportsData {
  kpis: ReportsKpi
  revenueTimeline: RevenueTimeline[]
  serviceBreakdown: ServiceBreakdown[]
  employeePerformance: EmployeePerformance[]
  dailyBreakdown: DailyBreakdown[]
  statusBreakdown: StatusBreakdown[]
}

export interface ReportsFilter {
  startDate?: string
  endDate?: string
  employeeId?: string
  serviceId?: string
}

export function useReports(filter: ReportsFilter = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['reports', filter],
    queryFn: () =>
      api.get<ReportsData>('/reports', { params: filter }).then((r) => r.data),
    staleTime: 2 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'confirm' | 'complete' | 'cancel'; reason?: string }) => {
      if (action === 'cancel') {
        return api.post(`/appointments/${id}/cancel`, { reason: '' })
      }
      return api.post(`/appointments/${id}/${action}`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
