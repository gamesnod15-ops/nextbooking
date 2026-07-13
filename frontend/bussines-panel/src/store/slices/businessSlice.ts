import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Business } from '@/types'

export interface BusinessState {
  business: Business | null
  isLoading: boolean
}

const BUSINESS_STORAGE_KEY = 'business_profile'

const mockBusiness: Business = {
  id: 'mock-001',
  name: 'Demo İşletme',
  slug: 'demo-isletme',
  category: 'Güzellik & Bakım',
  phone: '0532 000 0000',
  email: 'info@demo-isletme.com',
  address: 'Bağdat Cad. No:1, Kadıköy, İstanbul',
  timezone: 'Europe/Istanbul',
  currency: 'TRY',
  plan: 'starter',
  isActive: true,
}

function loadStoredBusiness(): Business {
  try {
    const stored = localStorage.getItem(BUSINESS_STORAGE_KEY)
    return stored ? { ...mockBusiness, ...JSON.parse(stored) as Business } : mockBusiness
  } catch {
    return mockBusiness
  }
}

function persistBusiness(business: Business | null) {
  if (!business) {
    localStorage.removeItem(BUSINESS_STORAGE_KEY)
    return
  }

  localStorage.setItem(BUSINESS_STORAGE_KEY, JSON.stringify(business))
}

const initialState: BusinessState = {
  business: loadStoredBusiness(),
  isLoading: false,
}

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setBusiness(state, action: PayloadAction<Business>) {
      state.business = action.payload
      persistBusiness(state.business)
    },
    updateBusiness(state, action: PayloadAction<Partial<Business>>) {
      if (state.business) {
        state.business = { ...state.business, ...action.payload }
        persistBusiness(state.business)
      }
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload
    },
  },
})

export const { setBusiness, updateBusiness, setLoading } = businessSlice.actions
export default businessSlice.reducer
