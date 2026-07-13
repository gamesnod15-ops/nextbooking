import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface LoyaltyTier {
  id: string
  name: string
  minPoints: number
  color: string
  iconName: string
  benefits: string[]
  multiplier: number
}

export interface LoyaltyMember {
  id: string
  name: string
  phone: string
  points: number
  totalSpent: number
  tier: string
  joinedAt: string
  lastVisit: string
  visits: number
}

export interface Reward {
  id: string
  name: string
  description: string
  pointCost: number
  isActive: boolean
  category: 'discount' | 'free-service' | 'gift'
  redeemCount: number
}

const DEFAULT_TIERS: LoyaltyTier[] = [
  { id: 'bronze', name: 'Bronz', minPoints: 0, color: 'text-amber-700 bg-amber-50 border-amber-200', iconName: 'Star', benefits: ['Her 1 TL = 1 puan', '%5 doğum günü indirimi'], multiplier: 1 },
  { id: 'silver', name: 'Gümüş', minPoints: 500, color: 'text-gray-500 bg-gray-50 border-gray-200', iconName: 'Zap', benefits: ['Her 1 TL = 1.5 puan', '%10 doğum günü indirimi', 'Öncelikli randevu'], multiplier: 1.5 },
  { id: 'gold', name: 'Altın', minPoints: 1500, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', iconName: 'Crown', benefits: ['Her 1 TL = 2 puan', '%15 doğum günü indirimi', 'Öncelikli randevu', 'Ücretsiz ürün'], multiplier: 2 },
  { id: 'platinum', name: 'Platin', minPoints: 5000, color: 'text-purple-600 bg-purple-50 border-purple-200', iconName: 'Heart', benefits: ['Her 1 TL = 3 puan', '%20 doğum günü indirimi', 'VIP randevu', 'Aylık ücretsiz hizmet'], multiplier: 3 },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ }
}

interface LoyaltyState {
  members: LoyaltyMember[]
  rewards: Reward[]
  tiers: LoyaltyTier[]
}

const initialState: LoyaltyState = {
  members: load('loyalty_members', []),
  rewards: load('loyalty_rewards', []),
  tiers: load('loyalty_tiers', DEFAULT_TIERS),
}

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    addMember(state, action: PayloadAction<Omit<LoyaltyMember, 'id'>>) {
      const member: LoyaltyMember = { ...action.payload, id: Date.now().toString() }
      state.members.push(member)
      save('loyalty_members', state.members)
    },
    updateMember(state, action: PayloadAction<LoyaltyMember>) {
      const idx = state.members.findIndex((m) => m.id === action.payload.id)
      if (idx !== -1) { state.members[idx] = action.payload; save('loyalty_members', state.members) }
    },
    deleteMember(state, action: PayloadAction<string>) {
      state.members = state.members.filter((m) => m.id !== action.payload)
      save('loyalty_members', state.members)
    },
    addReward(state, action: PayloadAction<Omit<Reward, 'id' | 'redeemCount'>>) {
      const reward: Reward = { ...action.payload, id: Date.now().toString(), redeemCount: 0 }
      state.rewards.push(reward)
      save('loyalty_rewards', state.rewards)
    },
    toggleReward(state, action: PayloadAction<string>) {
      const r = state.rewards.find((rw) => rw.id === action.payload)
      if (r) { r.isActive = !r.isActive; save('loyalty_rewards', state.rewards) }
    },
    deleteReward(state, action: PayloadAction<string>) {
      state.rewards = state.rewards.filter((r) => r.id !== action.payload)
      save('loyalty_rewards', state.rewards)
    },
    updateTier(state, action: PayloadAction<LoyaltyTier>) {
      const idx = state.tiers.findIndex((t) => t.id === action.payload.id)
      if (idx !== -1) { state.tiers[idx] = action.payload; save('loyalty_tiers', state.tiers) }
    },
  },
})

export const { addMember, updateMember, deleteMember, addReward, toggleReward, deleteReward, updateTier } = loyaltySlice.actions
export default loyaltySlice.reducer
