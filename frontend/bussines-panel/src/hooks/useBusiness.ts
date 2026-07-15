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
    mutationFn: (data: Partial<BusinessProfile>) => {
      // Backend validators reject empty strings (e.g. Email must be a valid
      // address when non-null), so normalize '' → null before sending.
      const cleaned: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(data)) {
        cleaned[key] = typeof value === 'string' && value.trim() === '' ? null : value
      }
      // Settings binds to Dictionary<string,string> — coerce values to strings.
      if (data.settings) {
        cleaned.settings = Object.fromEntries(
          Object.entries(data.settings).map(([k, v]) => [k, String(v)])
        )
      }
      return api.put('/business/me', cleaned)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business'] })
    },
  })
}
