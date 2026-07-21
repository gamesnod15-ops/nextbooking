import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Appointment {
  id: string
  serviceId: string
  serviceName: string
  serviceDurationMinutes: number
  employeeId: string
  employeeName: string
  customerId: string
  customerName: string
  customerPhone: string
  startTime: string
  endTime: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'noShow'
  price: number
  notes: string | null
  source: string
  hasPayment: boolean
  createdAt: string
}

export interface AppointmentsFilter {
  pageNumber?: number
  pageSize?: number
  date?: string
  employeeId?: string
  status?: string
  search?: string
}

export function useAppointments(filter: AppointmentsFilter = {}) {
  return useQuery({
    queryKey: ['appointments', filter],
    queryFn: () =>
      api
        .get<{ items: Appointment[]; totalCount: number; totalPages: number }>(
          '/appointments',
          { params: filter }
        )
        .then((r) => r.data),
  })
}

export function useCancelAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/appointments/${id}/cancel`, { reason: reason ?? '' }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useConfirmAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/appointments/${id}/confirm`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useCompleteAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/appointments/${id}/complete`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useCreateAppointment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      serviceId: string
      employeeId: string
      customerId: string
      startTime: string
      notes?: string
      source?: string
    }) => api.post('/appointments', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}
