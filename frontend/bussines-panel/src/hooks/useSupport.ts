import api from '@/lib/api'
import { useQuery, useMutation } from '@tanstack/react-query'

export interface SupportContact {
  email: string
  phone: string
}

export function useSupportContact() {
  return useQuery({
    queryKey: ['support-contact'],
    queryFn: () => api.get<SupportContact>('/support/contact').then((r) => r.data),
  })
}

export interface SubmitSupportRequestPayload {
  subject: string
  message: string
}

export function useSubmitSupportRequest() {
  return useMutation({
    mutationFn: (payload: SubmitSupportRequestPayload) => api.post('/support/contact', payload),
  })
}
