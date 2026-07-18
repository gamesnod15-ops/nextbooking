import api from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginatedList } from '@/types'

export type PlatformPaymentType = 'Subscription' | 'Advertiser' | 'Sponsorship'
export type PlatformPaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded'

export interface PlatformPayment {
  id: string
  type: PlatformPaymentType
  tenantId: string | null
  tenantName: string | null
  payerName: string
  description: string | null
  amount: number
  currency: string
  status: PlatformPaymentStatus
  paidAt: string | null
  createdAt: string
  billingAddress: string | null
  billingCity: string | null
  billingCountry: string | null
  taxNumber: string | null
  taxOffice: string | null
}

export interface PlatformPaymentsSummary {
  totalPaidAmount: number
  totalPendingAmount: number
  totalPaidCount: number
  byType: { type: PlatformPaymentType; totalAmount: number; count: number }[]
}

export interface GetPaymentsParams {
  pageNumber?: number
  pageSize?: number
  type?: PlatformPaymentType
  status?: PlatformPaymentStatus
  search?: string
}

export function useAdminPayments(params: GetPaymentsParams) {
  return useQuery({
    queryKey: ['admin', 'payments', params],
    queryFn: () => api.get<PaginatedList<PlatformPayment>>('/admin/payments', { params }).then((r) => r.data),
  })
}

export function useAdminPaymentsSummary() {
  return useQuery({
    queryKey: ['admin', 'payments', 'summary'],
    queryFn: () => api.get<PlatformPaymentsSummary>('/admin/payments/summary').then((r) => r.data),
  })
}

export interface CreatePaymentPayload {
  type: PlatformPaymentType
  payerName: string
  amount: number
  currency: string
  tenantId?: string | null
  description?: string | null
  status: PlatformPaymentStatus
}

export function useCreateAdminPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePaymentPayload) =>
      api.post<{ id: string }>('/admin/payments', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'payments'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function useUpdateAdminPaymentStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlatformPaymentStatus }) =>
      api.patch(`/admin/payments/${id}/status`, { status }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'payments'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export interface SyncSubscriptionPaymentsResult {
  created: number
  skipped: number
}

export function useSyncSubscriptionPayments() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<SyncSubscriptionPaymentsResult>('/admin/payments/sync-subscriptions').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'payments'] })
      qc.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}
