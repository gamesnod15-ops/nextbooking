import api from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export interface PricingPlan {
  id: string
  name: string
  badgeLabel: string
  description: string
  price: number | null
  isCustomPricing: boolean
  buttonText: string
  features: string[]
  isHighlighted: boolean
  highlightLabel: string | null
  planKey: string | null
  isActive: boolean
  createdAt: string
}

export interface PricingPlanSlot {
  id: string
  slotNumber: number
  plan: PricingPlan | null
}

export function useAdminPricingPlans() {
  return useQuery({
    queryKey: ['admin', 'pricing-plans'],
    queryFn: () => api.get<PricingPlan[]>('/admin/pricing-plans').then((r) => r.data),
  })
}

export function useAdminPricingPlanSlots() {
  return useQuery({
    queryKey: ['admin', 'pricing-plan-slots'],
    queryFn: () => api.get<PricingPlanSlot[]>('/admin/pricing-plan-slots').then((r) => r.data),
  })
}

export interface PricingPlanPayload {
  name: string
  badgeLabel: string
  description: string
  price: number | null
  isCustomPricing: boolean
  buttonText: string
  features: string[]
  isHighlighted: boolean
  highlightLabel: string | null
  planKey: string | null
}

export function useCreatePricingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: PricingPlanPayload) =>
      api.post<{ id: string }>('/admin/pricing-plans', payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pricing-plans'] }),
  })
}

export function useUpdatePricingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: PricingPlanPayload & { id: string }) =>
      api.put(`/admin/pricing-plans/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-plans'] })
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-plan-slots'] })
    },
  })
}

export function useSetPricingPlanActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/pricing-plans/${id}/status`, { isActive }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-plans'] })
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-plan-slots'] })
    },
  })
}

export function useDeletePricingPlan() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/pricing-plans/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-plans'] })
      qc.invalidateQueries({ queryKey: ['admin', 'pricing-plan-slots'] })
    },
  })
}

export function useSetPricingPlanSlot() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ slotNumber, pricingPlanId }: { slotNumber: number; pricingPlanId: string | null }) =>
      api.put(`/admin/pricing-plan-slots/${slotNumber}`, { pricingPlanId }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'pricing-plan-slots'] }),
  })
}
