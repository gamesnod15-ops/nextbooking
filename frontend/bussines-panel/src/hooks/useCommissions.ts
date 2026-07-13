import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type CommissionType = 'service' | 'sales' | 'mixed'
export type CommissionStatus = 'pending' | 'approved' | 'paid'

export interface Commission {
  id: string
  employeeId: string
  employeeName: string
  period: string
  type: CommissionType
  baseAmount: number
  commissionRate: number
  commissionAmount: number
  bonusAmount: number
  totalAmount: number
  status: CommissionStatus
  notes: string | null
  createdAt: string
}

export interface CommissionsFilter {
  pageNumber?: number
  pageSize?: number
  period?: string
  status?: CommissionStatus
}

export function useCommissions(filter: CommissionsFilter = {}) {
  return useQuery({
    queryKey: ['commissions', filter],
    queryFn: () =>
      api.get<{ items: Commission[]; totalCount: number; totalPages: number }>(
        '/commissions', { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreateCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      employeeId: string
      employeeName: string
      period: string
      type: CommissionType
      baseAmount: number
      commissionRate: number
      bonusAmount: number
      notes?: string
    }) => api.post('/commissions', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] }),
  })
}

export function useApproveCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/commissions/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] }),
  })
}

export function usePayCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/commissions/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] }),
  })
}

export function useDeleteCommission() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/commissions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] }),
  })
}
