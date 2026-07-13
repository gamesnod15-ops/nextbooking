import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type DebtCategory = 'supplier' | 'rent' | 'equipment' | 'loan' | 'tax' | 'other'
export type DebtStatus = 'open' | 'partiallyPaid' | 'paid' | 'overdue'

export interface DebtRecord {
  id: string
  title: string
  creditorName: string | null
  description: string | null
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  dueDate: string
  category: DebtCategory
  status: DebtStatus
  createdAt: string
}

export interface DebtsFilter {
  pageNumber?: number
  pageSize?: number
  search?: string
  status?: DebtStatus
}

export function useDebts(filter: DebtsFilter = {}) {
  return useQuery({
    queryKey: ['debts', filter],
    queryFn: () =>
      api.get<{ items: DebtRecord[]; totalCount: number; totalPages: number }>(
        '/debts', { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<DebtRecord, 'id' | 'paidAmount' | 'remainingAmount' | 'status' | 'createdAt'>) =>
      api.post('/debts', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })
}

export function useUpdateDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Pick<DebtRecord, 'id' | 'title' | 'totalAmount' | 'dueDate' | 'category' | 'creditorName' | 'description'>) =>
      api.put(`/debts/${id}`, { id, ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })
}

export function usePayDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.post(`/debts/${id}/pay`, { amount }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })
}

export function useDeleteDebt() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/debts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['debts'] }),
  })
}
