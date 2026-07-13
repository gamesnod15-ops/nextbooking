import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface GiftCoupon {
  id: string
  code: string
  amount: number
  recipientName: string
  recipientEmail: string | null
  purchasedBy: string
  purchaseDate: string
  expiryDate: string | null
  usedAmount: number
  status: 'active' | 'used' | 'expired'
  message: string | null
  createdAt: string
}

export interface GiftCouponsFilter {
  pageNumber?: number
  pageSize?: number
  status?: string
  search?: string
}

export interface CreateGiftCouponPayload {
  code: string
  amount: number
  recipientName: string
  recipientEmail?: string | null
  purchasedBy: string
  expiryDate?: string | null
  message?: string | null
}

export interface UpdateGiftCouponPayload {
  recipientName: string
  recipientEmail?: string | null
  purchasedBy: string
  expiryDate?: string | null
  message?: string | null
}

const QUERY_KEY = 'gift-coupons'

export function useGiftCoupons(filter: GiftCouponsFilter = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, filter],
    queryFn: () =>
      api
        .get<{ items: GiftCoupon[]; totalCount: number; totalPages: number }>(
          '/giftcoupons',
          { params: filter }
        )
        .then((r) => r.data),
  })
}

export function useCreateGiftCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateGiftCouponPayload) =>
      api.post<{ id: string }>('/giftcoupons', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateGiftCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateGiftCouponPayload) =>
      api.put(`/giftcoupons/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteGiftCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/giftcoupons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}
