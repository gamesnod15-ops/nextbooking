import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface WhatsAppIntegrationStatus {
  isConnected: boolean
  phoneNumberId: string | null
  connectedAt: string | null
}

const STATUS_KEY = 'whatsapp-integration-status'

export function useWhatsAppIntegrationStatus() {
  return useQuery({
    queryKey: [STATUS_KEY],
    queryFn: () => api.get<WhatsAppIntegrationStatus>('/whatsapp-integration').then((r) => r.data),
  })
}

export function useConnectWhatsAppIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { phoneNumberId: string; accessToken: string }) =>
      api.post('/whatsapp-integration/connect', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STATUS_KEY] }),
  })
}

export function useDisconnectWhatsAppIntegration() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post('/whatsapp-integration/disconnect'),
    onSuccess: () => qc.invalidateQueries({ queryKey: [STATUS_KEY] }),
  })
}
