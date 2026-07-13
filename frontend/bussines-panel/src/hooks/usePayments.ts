import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export interface Payment {
  id: string
  appointmentId: string
  customerName: string
  serviceName: string
  provider: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'partiallyRefunded'
  paidAt: string | null
  createdAt: string
}

export interface PaymentsFilter {
  pageNumber?: number
  pageSize?: number
  status?: string
  startDate?: string
  endDate?: string
  search?: string
}

export function usePayments(filter: PaymentsFilter = {}) {
  return useQuery({
    queryKey: ['payments', filter],
    queryFn: () =>
      api.get<{ items: Payment[]; totalCount: number; totalPages: number }>(
        '/payments',
        { params: filter }
      ).then((r) => r.data),
  })
}
