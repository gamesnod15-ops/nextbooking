import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export interface ApiPricingPlan {
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

/** Public pricing-page data, sourced from the manager panel's pricing plan
 * slots. No auth required — falls back gracefully if unreachable. */
export function usePricingPlans() {
  return useQuery({
    queryKey: ['public', 'pricing-plans'],
    queryFn: () => api.get<ApiPricingPlan[]>('/pricing-plans').then((r) => r.data),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  })
}
