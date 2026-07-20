import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// ─── Types ─────────────────────────────────────────────────────────────────
// Conversations, messages, lead scoring and booking drafts are all real,
// backend-persisted data now (see hooks/useWhatsAppConversations.ts). This
// slice only holds the bot's display/config settings — business name,
// welcome message, services, working hours — which get sent along with each
// message to build Claude's context server-side.

export interface WorkingSlot {
  day: string
  hours: string
}

export interface BotSettings {
  isEnabled: boolean
  businessName: string
  welcomeMessage: string
  phoneNumber: string
  workingSlots: WorkingSlot[]
  services: string[]
}

interface WhatsAppBotState {
  settings: BotSettings
}

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: BotSettings = {
  isEnabled: true,
  businessName: 'İşletmem',
  welcomeMessage: 'Merhaba! 👋 Size nasıl yardımcı olabiliriz?',
  phoneNumber: '',
  workingSlots: [
    { day: 'Pazartesi', hours: '09:00 – 18:00' },
    { day: 'Salı', hours: '09:00 – 18:00' },
    { day: 'Çarşamba', hours: '09:00 – 18:00' },
    { day: 'Perşembe', hours: '09:00 – 18:00' },
    { day: 'Cuma', hours: '09:00 – 18:00' },
    { day: 'Cumartesi', hours: '10:00 – 16:00' },
  ],
  services: ['Saç Kesimi', 'Saç Boyama', 'Manikür', 'Pedikür'],
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch { return fallback }
}

function save(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* noop */ }
}

const initialState: WhatsAppBotState = {
  settings: load<BotSettings>('wa_bot_settings', DEFAULT_SETTINGS),
}

// ─── Slice ─────────────────────────────────────────────────────────────────

const whatsappBotSlice = createSlice({
  name: 'whatsappBot',
  initialState,
  reducers: {
    updateSettings(state, action: PayloadAction<Partial<BotSettings>>) {
      state.settings = { ...state.settings, ...action.payload }
      save('wa_bot_settings', state.settings)
    },
  },
})

export const { updateSettings } = whatsappBotSlice.actions

export default whatsappBotSlice.reducer
