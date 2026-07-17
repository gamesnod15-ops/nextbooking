import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import type { PaginatedList } from '@/types'

export type FeedbackCategory = 'EasyToUse' | 'Confusing' | 'Suggestion' | 'BugReport'

export interface PlatformFeedback {
  id: string
  category: FeedbackCategory
  message: string
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
