import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface SocialPlatform {
  id: string
  name: string
  iconName: string
  profileUrl: string
  isConnected: boolean
  followers?: number
  bookingEnabled: boolean
  lastPost?: string
}

export interface PostTemplate {
  id: string
  title: string
  content: string
  platform: string[]
  category: 'appointment' | 'promotion' | 'review' | 'general'
}

const DEFAULT_PLATFORMS: SocialPlatform[] = [
  { id: 'instagram', name: 'Instagram', iconName: 'instagram', profileUrl: '', isConnected: false, bookingEnabled: false },
  { id: 'facebook', name: 'Facebook', iconName: 'facebook', profileUrl: '', isConnected: false, bookingEnabled: false },
  { id: 'google', name: 'Google İşletmem', iconName: 'google', profileUrl: '', isConnected: false, bookingEnabled: false },
  { id: 'whatsapp', name: 'WhatsApp İşletme', iconName: 'whatsapp', profileUrl: '', isConnected: false, bookingEnabled: false },
]

const DEFAULT_TEMPLATES: PostTemplate[] = [
  { id: '1', title: 'Randevu Hatırlatma', content: '⏰ Yarın randevunuzu unutmayın! Randevu almak için linke tıklayın 👇\n{booking_link}', platform: ['instagram', 'facebook'], category: 'appointment' },
  { id: '2', title: 'Özel Kampanya', content: '🎉 Bu hafta sonu özel fiyatlar! {discount_amount} indirim kazanmak için hemen randevu alın:\n{booking_link}', platform: ['instagram', 'facebook'], category: 'promotion' },
  { id: '3', title: 'Müşteri Yorumu Paylaş', content: '⭐⭐⭐⭐⭐ "{review_text}" - {customer_name}\nSiz de deneyimleyin! {booking_link}', platform: ['instagram', 'facebook'], category: 'review' },
  { id: '4', title: 'Yeni Hizmet Duyurusu', content: '✨ Yeni hizmetimiz: {service_name}\nDetaylı bilgi ve randevu için:\n{booking_link}', platform: ['instagram', 'facebook', 'whatsapp'], category: 'general' },
]

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ }
}

interface SocialMediaState {
  platforms: SocialPlatform[]
  templates: PostTemplate[]
}

const initialState: SocialMediaState = {
  platforms: load('social_platforms', DEFAULT_PLATFORMS),
  templates: load('social_templates', DEFAULT_TEMPLATES),
}

const socialMediaSlice = createSlice({
  name: 'socialMedia',
  initialState,
  reducers: {
    updatePlatform(state, action: PayloadAction<SocialPlatform>) {
      const idx = state.platforms.findIndex((p) => p.id === action.payload.id)
      if (idx !== -1) { state.platforms[idx] = action.payload; save('social_platforms', state.platforms) }
    },
    addTemplate(state, action: PayloadAction<Omit<PostTemplate, 'id'>>) {
      const template: PostTemplate = { ...action.payload, id: Date.now().toString() }
      state.templates.push(template)
      save('social_templates', state.templates)
    },
    deleteTemplate(state, action: PayloadAction<string>) {
      state.templates = state.templates.filter((t) => t.id !== action.payload)
      save('social_templates', state.templates)
    },
  },
})

export const { updatePlatform, addTemplate, deleteTemplate } = socialMediaSlice.actions
export default socialMediaSlice.reducer
