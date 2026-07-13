import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type ReceivableStatus = 'open' | 'partiallyPaid' | 'paid' | 'overdue'

export interface Installment {
  id: string
  number: number
  amount: number
  dueDate: string
  isPaid: boolean
  paidAt: string | null
}

export interface Receivable {
  id: string
  customerName: string
  customerPhone: string | null
  description: string | null
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string
  status: ReceivableStatus
  installmentCount: number
  installments: Installment[]
  createdAt: string
}

export interface ReceivablesFilter {
  pageNumber?: number
  pageSize?: number
  search?: string
  status?: ReceivableStatus
}

export function useReceivables(filter: ReceivablesFilter = {}) {
  return useQuery({
    queryKey: ['receivables', filter],
    queryFn: () =>
      api.get<{ items: Receivable[]; totalCount: number; totalPages: number }>(
        '/receivables', { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreateReceivable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      customerName: string
      totalAmount: number
      dueDate: string
      installmentCount: number
      customerPhone?: string
      description?: string
    }) => api.post('/receivables', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }),
  })
}

export function usePayInstallment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (installmentId: string) =>
      api.post(`/receivables/installments/${installmentId}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }),
  })
}

export function useDeleteReceivable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/receivables/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receivables'] }),
  })
}
