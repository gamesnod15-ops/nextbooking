import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import type { PaginatedList } from '@/types'

// Enums are serialized as camelCase strings (JsonStringEnumConverter(CamelCase) in Program.cs)
export type FeedbackCategory = 'easyToUse' | 'confusing' | 'suggestion' | 'bugReport'

export interface PlatformFeedback {
  id: string
  category: FeedbackCategory
  message: string
  imageUrls: string | null
  tenantId: string
  tenantName: string | null
  userId: string | null
  userName: string | null
  userEmail: string | null
  createdAt: string
}

export interface GetFeedbackParams {
  pageNumber?: number
  pageSize?: number
  category?: FeedbackCategory
}

export function useAdminFeedback(params: GetFeedbackParams) {
  return useQuery({
    queryKey: ['admin', 'feedback', params],
    queryFn: () => api.get<PaginatedList<PlatformFeedback>>('/admin/feedback', { params }).then((r) => r.data),
  })
}
