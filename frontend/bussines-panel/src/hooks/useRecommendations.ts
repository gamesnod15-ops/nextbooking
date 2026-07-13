import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Recommendation {
  id: string
  title: string
  description: string | null
  type: string
  recommendedServiceId: string | null
  serviceName: string | null
  recommendedProductId: string | null
  productName: string | null
  relevanceScore: number
  reason: string | null
  isViewed: boolean
  createdAt: string
}

export function useServiceRecommendations(customerId: string | undefined, count = 5) {
  return useQuery({
    queryKey: ['recommendations', 'services', customerId],
    queryFn: () =>
      api.get<Recommendation[]>(`/recommendations/services/${customerId}`, { params: { count } })
        .then(r => r.data),
    enabled: !!customerId,
  })
}

export function useProductRecommendations(customerId: string | undefined, count = 5) {
  return useQuery({
    queryKey: ['recommendations', 'products', customerId],
    queryFn: () =>
      api.get<Recommendation[]>(`/recommendations/products/${customerId}`, { params: { count } })
        .then(r => r.data),
    enabled: !!customerId,
  })
}

export function useTimelyRecommendations(customerId: string | undefined, count = 5) {
  return useQuery({
    queryKey: ['recommendations', 'timely', customerId],
    queryFn: () =>
      api.get<Recommendation[]>(`/recommendations/timely/${customerId}`, { params: { count } })
        .then(r => r.data),
    enabled: !!customerId,
  })
}

export function useAllRecommendations(customerId: string | undefined, count = 10) {
  return useQuery({
    queryKey: ['recommendations', 'all', customerId],
    queryFn: () =>
      api.get<Recommendation[]>(`/recommendations/all/${customerId}`, { params: { count } })
        .then(r => r.data),
    enabled: !!customerId,
  })
}

export function useMarkRecommendationViewed() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/recommendations/${id}/viewed`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  })
}

export function useGenerateRecommendations() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (customerId: string) => api.post(`/recommendations/generate/${customerId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['recommendations'] }),
  })
}
