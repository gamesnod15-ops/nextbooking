import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface BusinessSettings {
  // Notification settings
  emailNotifications: boolean
  smsNotifications: boolean
  appointmentReminders: boolean
  reminderHoursBefore: number
  newBookingAlert: boolean
  cancellationAlert: boolean
  // Booking settings
  requireConfirmation: boolean
  allowOnlineBooking: boolean
  bookingLeadTimeHours: number
  maxAdvanceBookingDays: number
  allowCancellation: boolean
  cancellationDeadlineHours: number
  // Calendar settings
  calendarStartHour: number
  calendarEndHour: number
  slotDurationMinutes: number
  showWeekends: boolean
  // Theme settings
  primaryColor: string
  language: string
  timezone: string
  // Payment settings
  requireDeposit: boolean
  depositPercentage: number
  acceptOnlinePayment: boolean
  // Security settings
  twoFactorEnabled: boolean
  sessionTimeoutMinutes: number
  // Site settings
  metaTitle: string
  metaDescription: string
  customDomain: string
}

export const DEFAULT_SETTINGS: BusinessSettings = {
  emailNotifications: true,
  smsNotifications: false,
  appointmentReminders: true,
  reminderHoursBefore: 24,
  newBookingAlert: true,
  cancellationAlert: true,
  requireConfirmation: false,
  allowOnlineBooking: true,
  bookingLeadTimeHours: 1,
  maxAdvanceBookingDays: 60,
  allowCancellation: true,
  cancellationDeadlineHours: 24,
  calendarStartHour: 9,
  calendarEndHour: 20,
  slotDurationMinutes: 30,
  showWeekends: true,
  primaryColor: '#3b82f6',
  language: 'tr',
  timezone: 'Europe/Istanbul',
  requireDeposit: false,
  depositPercentage: 20,
  acceptOnlinePayment: false,
  twoFactorEnabled: false,
  sessionTimeoutMinutes: 60,
  metaTitle: '',
  metaDescription: '',
  customDomain: '',
}

const SETTINGS_KEY = 'app_settings'

async function fetchSettings(): Promise<BusinessSettings> {
  const res = await api.get<{ settings: Record<string, string> }>('/business/me')
  const raw = res.data.settings?.[SETTINGS_KEY]
  if (raw) {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch { /* ignore */ }
  }
  return DEFAULT_SETTINGS
}

async function saveSettings(settings: BusinessSettings): Promise<void> {
  await api.patch('/business/me/settings', { [SETTINGS_KEY]: JSON.stringify(settings) })
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: ['business-settings'],
    queryFn: fetchSettings,
    staleTime: 60 * 1000,
  })
}

export function useSaveBusinessSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business-settings'] })
      qc.invalidateQueries({ queryKey: ['business'] })
    },
  })
}
