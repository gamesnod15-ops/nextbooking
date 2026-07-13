import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// ─── Types ─────────────────────────────────────────────────────────────────

export type BotStep =
  | 'welcome'
  | 'select_option'
  | 'show_hours'
  | 'select_slot'
  | 'ask_name'
  | 'ask_phone'
  | 'ask_city'
  | 'ask_email'
  | 'confirmed'

export interface WorkingSlot {
  day: string
  hours: string
}

export interface WhatsAppAppointment {
  id: string
  customerName: string
  customerPhone: string
  customerCity: string
  customerEmail: string
  selectedSlot: string
  createdAt: string
  status: 'pending' | 'confirmed' | 'cancelled'
  source: 'whatsapp'
}

export interface ChatMessage {
  id: string
  role: 'bot' | 'user'
  text: string
  timestamp: string
  quickReplies?: string[]
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
  appointments: WhatsAppAppointment[]
  // simulator state
  simMessages: ChatMessage[]
  simStep: BotStep
  simDraft: Partial<WhatsAppAppointment>
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

const WELCOME_MSG = (name: string, welcomeMsg: string): ChatMessage => ({
  id: 'welcome',
  role: 'bot',
  text: `${welcomeMsg}\n\n*${name}*'e hoş geldiniz! Aşağıdaki seçeneklerden birini seçiniz:`,
  timestamp: new Date().toISOString(),
  quickReplies: [
    '📅 Randevu almak istiyorum',
    '🕐 Çalışma saatlerini öğrenmek istiyorum',
    '✂️ Hizmetler neler?',
  ],
})

const initialSimMessages = (settings: BotSettings): ChatMessage[] => [
  WELCOME_MSG(settings.businessName, settings.welcomeMessage),
]

const storedSettings = load<BotSettings>('wa_bot_settings', DEFAULT_SETTINGS)
const storedAppointments = load<WhatsAppAppointment[]>('wa_bot_appointments', [])

const initialState: WhatsAppBotState = {
  settings: storedSettings,
  appointments: storedAppointments,
  simMessages: initialSimMessages(storedSettings),
  simStep: 'welcome',
  simDraft: {},
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

    resetSimulator(state) {
      state.simMessages = initialSimMessages(state.settings)
      state.simStep = 'welcome'
      state.simDraft = {}
    },

    addSimMessage(state, action: PayloadAction<ChatMessage>) {
      state.simMessages.push(action.payload)
    },

    setSimStep(state, action: PayloadAction<BotStep>) {
      state.simStep = action.payload
    },

    updateSimDraft(state, action: PayloadAction<Partial<WhatsAppAppointment>>) {
      state.simDraft = { ...state.simDraft, ...action.payload }
    },

    confirmSimAppointment(state) {
      const draft = state.simDraft
      if (!draft.customerName || !draft.customerPhone) return
      const apt: WhatsAppAppointment = {
        id: `wa_${Date.now()}`,
        customerName: draft.customerName ?? '',
        customerPhone: draft.customerPhone ?? '',
        customerCity: draft.customerCity ?? '',
        customerEmail: draft.customerEmail ?? '',
        selectedSlot: draft.selectedSlot ?? '',
        createdAt: new Date().toISOString(),
        status: 'pending',
        source: 'whatsapp',
      }
      state.appointments.unshift(apt)
      save('wa_bot_appointments', state.appointments)
    },

    updateAppointmentStatus(
      state,
      action: PayloadAction<{ id: string; status: WhatsAppAppointment['status'] }>
    ) {
      const apt = state.appointments.find(a => a.id === action.payload.id)
      if (apt) {
        apt.status = action.payload.status
        save('wa_bot_appointments', state.appointments)
      }
    },

    deleteAppointment(state, action: PayloadAction<string>) {
      state.appointments = state.appointments.filter(a => a.id !== action.payload)
      save('wa_bot_appointments', state.appointments)
    },
  },
})

export const {
  updateSettings,
  resetSimulator,
  addSimMessage,
  setSimStep,
  updateSimDraft,
  confirmSimAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} = whatsappBotSlice.actions

export default whatsappBotSlice.reducer
