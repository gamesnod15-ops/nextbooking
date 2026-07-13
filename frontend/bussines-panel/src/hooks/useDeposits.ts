import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface DepositItem {
  id: string
  appointmentId: string
  customerName: string
  serviceName: string
  amount: number
  currency: string
  status: string
  paymentMethod: string
  paidAt: string | null
  refundedAt: string | null
  notes: string | null
  createdAt: string
}

export interface DepositList {
  items: DepositItem[]
  totalCount: number
  totalPages: number
}

export function useDeposits(filter: {
  pageNumber?: number
  pageSize?: number
  status?: string
  appointmentId?: string
} = {}) {
  return useQuery({
    queryKey: ['deposits', filter],
    queryFn: () =>
      api.get<DepositList>('/deposits', { params: filter }).then(r => r.data),
  })
}

export function useCreateDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { appointmentId: string; amount: number; paymentMethod?: string; notes?: string }) =>
      api.post('/deposits', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deposits'] }),
  })
}

export function useApplyDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/deposits/${id}/apply`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deposits'] }),
  })
}

export function useRefundDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/deposits/${id}/refund`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deposits'] }),
  })
}

export function useCancelDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/deposits/${id}/cancel`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deposits'] }),
  })
}

export function useForfeitDeposit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/deposits/${id}/forfeit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deposits'] }),
  })
}
