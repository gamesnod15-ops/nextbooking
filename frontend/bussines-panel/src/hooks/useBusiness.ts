import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface BusinessProfile {
  id: string
  name: string
  category: number
  timezone: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  country: string | null
  taxNumber: string | null
  taxOffice: string | null
  website: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  galleryImages: string[]
  settings: Record<string, string>
}

export function useBusiness() {
  return useQuery({
    queryKey: ['business'],
    queryFn: () => api.get<BusinessProfile>('/business/me').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  })
}

export function useUpdateBusiness() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<BusinessProfile>) =>
      api.put('/business/me', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business'] })
    },
  })
}
