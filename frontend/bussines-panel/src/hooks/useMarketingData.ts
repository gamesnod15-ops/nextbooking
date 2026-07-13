import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type DiscountType = 'percentage' | 'fixedAmount'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'ended'

export interface Campaign {
  id: string
  name: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  startDate: string
  endDate: string
  status: CampaignStatus
  usageLimit: number | null
  usageCount: number
  applicableServiceIds: string[]
  createdAt: string
}

export interface CampaignsFilter {
  pageNumber?: number
  pageSize?: number
  status?: CampaignStatus
  search?: string
}

export function useCampaigns(filter: CampaignsFilter = {}) {
  return useQuery({
    queryKey: ['campaigns', filter],
    queryFn: () =>
      api.get<{ items: Campaign[]; totalCount: number; totalPages: number }>(
        '/campaigns',
        { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Campaign, 'id' | 'usageCount' | 'createdAt'>) =>
      api.post('/campaigns', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}

export function useUpdateCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Campaign) =>
      api.put(`/campaigns/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}

export function useDeleteCampaign() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/campaigns/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  })
}

// ----- Coupons -----
export interface Coupon {
  id: string
  code: string
  description: string | null
  discountType: DiscountType
  discountValue: number
  minimumOrderAmount: number | null
  expiresAt: string | null
  usageLimit: number | null
  usageCount: number
  isActive: boolean
  createdAt: string
}

export interface CouponsFilter {
  pageNumber?: number
  pageSize?: number
  isActive?: boolean
  search?: string
}

export function useCoupons(filter: CouponsFilter = {}) {
  return useQuery({
    queryKey: ['coupons', filter],
    queryFn: () =>
      api.get<{ items: Coupon[]; totalCount: number; totalPages: number }>(
        '/coupons',
        { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Coupon, 'id' | 'usageCount' | 'createdAt'>) =>
      api.post('/coupons', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}

export function useUpdateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Coupon) =>
      api.put(`/coupons/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}

export function useDeleteCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coupons'] }),
  })
}

// ----- Packages -----
export interface PackageItem {
  serviceId: string
  serviceName: string
  quantity: number
}

export interface Package {
  id: string
  name: string
  description: string | null
  price: number
  originalPrice: number | null
  validityDays: number | null
  isActive: boolean
  imageUrl: string | null
  items: PackageItem[]
  createdAt: string
}

export interface PackagesFilter {
  pageNumber?: number
  pageSize?: number
  isActive?: boolean
  search?: string
}

export function usePackages(filter: PackagesFilter = {}) {
  return useQuery({
    queryKey: ['packages', filter],
    queryFn: () =>
      api.get<{ items: Package[]; totalCount: number; totalPages: number }>(
        '/packages',
        { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreatePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Package, 'id' | 'createdAt'>) =>
      api.post('/packages', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  })
}

export function useUpdatePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Package) =>
      api.put(`/packages/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  })
}

export function useDeletePackage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/packages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  })
}
