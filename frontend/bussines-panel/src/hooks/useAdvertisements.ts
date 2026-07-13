import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type AdStatus = 'active' | 'pending' | 'expired' | 'rejected' | 'paused'
export type AdPackageType = 'basic_boost' | 'professional_boost' | 'premium_spotlight'
export type AdTargetCategory =
  | 'all'
  | 'hair'
  | 'beauty'
  | 'wellness'
  | 'fitness'
  | 'healthcare'
  | 'nail'
  | 'massage'
  | 'other'

export interface Advertisement {
  id: string
  title: string
  description: string | null
  packageType: AdPackageType
  targetCategory: AdTargetCategory
  targetLocation: string | null
  budget: number
  startDate: string
  endDate: string
  status: AdStatus
  impressions: number
  clicks: number
  conversions: number
  createdAt: string
}

export interface DailyAdData {
  date: string
  impressions: number
  clicks: number
  conversions: number
}

export interface WeeklyAdData {
  week: string
  impressions: number
  clicks: number
}

export interface AdAnalytics {
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  ctr: number
  conversionRate: number
  dailyData: DailyAdData[]
  weeklyData: WeeklyAdData[]
}

export interface AdsFilter {
  pageNumber?: number
  pageSize?: number
  status?: AdStatus
}

export interface CreateAdPayload {
  title: string
  description: string | null
  packageType: AdPackageType
  targetCategory: AdTargetCategory
  targetLocation: string | null
  budget: number
  startDate: string
  endDate: string
}

export function useAdvertisements(filter: AdsFilter = {}) {
  return useQuery({
    queryKey: ['advertisements', filter],
    queryFn: () =>
      api
        .get<{ items: Advertisement[]; totalCount: number }>('/advertisements', { params: filter })
        .then((r) => r.data),
  })
}

export function useAdAnalytics() {
  return useQuery({
    queryKey: ['advertisements', 'analytics'],
    queryFn: () =>
      api.get<AdAnalytics>('/advertisements/analytics').then((r) => r.data),
    retry: false,
  })
}

export function useCreateAdvertisement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAdPayload) =>
      api.post<Advertisement>('/advertisements', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['advertisements'] }),
  })
}

export function useUpdateAdStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AdStatus }) =>
      api.patch(`/advertisements/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['advertisements'] }),
  })
}

export function useDeleteAdvertisement() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/advertisements/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['advertisements'] }),
  })
}
