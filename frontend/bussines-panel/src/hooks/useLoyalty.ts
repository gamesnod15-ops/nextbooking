import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface LoyaltyTier {
  id: string
  name: string
  minPoints: number
  multiplier: number
  color: string
  iconName: string
  benefits: string[]
  sortOrder: number
}

export interface LoyaltyMember {
  id: string
  customerId: string
  name: string
  phone: string
  points: number
  totalSpent: number
  visits: number
  tierId: string
  joinedAt: string
  lastVisit: string | null
}

export interface LoyaltyMemberList {
  items: LoyaltyMember[]
  totalCount: number
  totalPages: number
}

export type LoyaltyRewardCategory = 'discount' | 'freeService' | 'gift'

export interface LoyaltyReward {
  id: string
  name: string
  description: string | null
  pointCost: number
  category: LoyaltyRewardCategory
  isActive: boolean
  redeemCount: number
}

export interface TierDistribution {
  tierId: string
  tierName: string
  color: string
  iconName: string
  count: number
}

export interface TopMember {
  memberId: string
  name: string
  points: number
  visits: number
  tierId: string
  tierName: string
}

export interface LoyaltyOverview {
  totalMembers: number
  totalPointsDistributed: number
  averagePoints: number
  totalRedemptions: number
  tierDistribution: TierDistribution[]
  topMembers: TopMember[]
}

const KEYS = {
  overview: ['loyalty-overview'],
  members: (filter: { pageNumber?: number; pageSize?: number } = {}) => ['loyalty-members', filter],
  rewards: ['loyalty-rewards'],
  tiers: ['loyalty-tiers'],
}

export function useLoyaltyOverview() {
  return useQuery({
    queryKey: KEYS.overview,
    queryFn: () => api.get<LoyaltyOverview>('/loyalty/overview').then((r) => r.data),
  })
}

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: KEYS.tiers,
    queryFn: () => api.get<LoyaltyTier[]>('/loyalty/tiers').then((r) => r.data),
  })
}

export function useLoyaltyMembers(filter: { pageNumber?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: KEYS.members(filter),
    queryFn: () => api.get<LoyaltyMemberList>('/loyalty/members', { params: filter }).then((r) => r.data),
  })
}

export function useCreateLoyaltyMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; phone: string; startingPoints: number }) =>
      api.post('/loyalty/members', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-members'] })
      qc.invalidateQueries({ queryKey: KEYS.overview })
    },
  })
}

export function useLoyaltyRewards() {
  return useQuery({
    queryKey: KEYS.rewards,
    queryFn: () => api.get<LoyaltyReward[]>('/loyalty/rewards').then((r) => r.data),
  })
}

export function useCreateLoyaltyReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; description: string; pointCost: number; category: LoyaltyRewardCategory }) =>
      api.post('/loyalty/rewards', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.rewards }),
  })
}

export function useToggleLoyaltyReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.put(`/loyalty/rewards/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.rewards }),
  })
}

export function useDeleteLoyaltyReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/loyalty/rewards/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.rewards }),
  })
}

export function useRedeemReward() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ rewardId, memberId }: { rewardId: string; memberId: string }) =>
      api.post(`/loyalty/rewards/${rewardId}/redeem`, { memberId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loyalty-members'] })
      qc.invalidateQueries({ queryKey: KEYS.rewards })
      qc.invalidateQueries({ queryKey: KEYS.overview })
    },
  })
}
