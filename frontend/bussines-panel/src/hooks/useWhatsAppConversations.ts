import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type ConversationStatus = 'bot' | 'escalated' | 'closed'
export type LeadTier = 'cold' | 'warm' | 'hot'
export type MessageRole = 'customer' | 'bot' | 'owner'

export interface Conversation {
  id: string
  customerPhone: string
  customerName: string | null
  customerId: string | null
  status: ConversationStatus
  leadScore: number
  leadTier: LeadTier
  escalationReason: string | null
  lastMessagePreview: string | null
  lastMessageAt: string
}

export interface ConversationMessage {
  id: string
  role: MessageRole
  text: string
  createdAt: string
}

export interface ConversationsFilter {
  pageNumber?: number
  pageSize?: number
  status?: ConversationStatus
  leadTier?: LeadTier
}

const CONVERSATIONS_KEY = 'whatsapp-conversations'

export function useConversations(filter: ConversationsFilter = {}) {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY, filter],
    queryFn: () =>
      api.get<{ items: Conversation[]; totalCount: number; totalPages: number }>(
        '/whatsapp-conversations',
        { params: filter }
      ).then((r) => r.data),
  })
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY, conversationId, 'messages'],
    queryFn: () =>
      api.get<ConversationMessage[]>(`/whatsapp-conversations/${conversationId}/messages`).then((r) => r.data),
    enabled: !!conversationId,
  })
}

export interface SendMessagePayload {
  conversationId?: string | null
  customerPhone: string
  customerName?: string | null
  text: string
  role: 'customer' | 'owner'
  businessName: string
  welcomeMessage?: string | null
  services: string[]
  workingHours: string[]
}

export interface SendMessageResult {
  conversationId: string
  status: ConversationStatus
  leadScore: number
  leadTier: LeadTier
  escalationReason: string | null
  newMessages: ConversationMessage[]
}

export function useSendMessage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: SendMessagePayload) =>
      api.post<SendMessageResult>('/whatsapp-conversations/messages', payload).then((r) => r.data),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] })
      qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY, result.conversationId, 'messages'] })
    },
  })
}

export function useEscalateConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/whatsapp-conversations/${id}/escalate`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] }),
  })
}

export function useResolveConversation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/whatsapp-conversations/${id}/resolve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CONVERSATIONS_KEY] }),
  })
}

// ─── Booking drafts (Claude's propose_booking tool, pending owner approval) ─

export type BookingDraftStatus = 'pendingApproval' | 'approved' | 'rejected'

export interface BookingDraft {
  id: string
  conversationId: string
  serviceName: string
  date: string // YYYY-MM-DD
  time: string // HH:mm:ss
  customerName: string
  customerPhone: string
  customerEmail: string | null
  status: BookingDraftStatus
  rejectionReason: string | null
  createdAppointmentId: string | null
  createdAt: string
}

export interface BookingDraftsFilter {
  pageNumber?: number
  pageSize?: number
  status?: BookingDraftStatus
}

const BOOKING_DRAFTS_KEY = 'whatsapp-booking-drafts'

export function useBookingDrafts(filter: BookingDraftsFilter = {}) {
  return useQuery({
    queryKey: [BOOKING_DRAFTS_KEY, filter],
    queryFn: () =>
      api.get<{ items: BookingDraft[]; totalCount: number; totalPages: number }>(
        '/whatsapp-booking-drafts',
        { params: filter }
      ).then((r) => r.data),
  })
}

export function useApproveBookingDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post<{ appointmentId: string }>(`/whatsapp-booking-drafts/${id}/approve`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BOOKING_DRAFTS_KEY] })
      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })
    },
  })
}

export function useRejectBookingDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.post(`/whatsapp-booking-drafts/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [BOOKING_DRAFTS_KEY] }),
  })
}
