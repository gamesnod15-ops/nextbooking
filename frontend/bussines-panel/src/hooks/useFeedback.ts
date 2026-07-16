import api from '@/lib/api'
import { useMutation } from '@tanstack/react-query'

export type FeedbackCategory = 'EasyToUse' | 'Confusing' | 'Suggestion' | 'BugReport'

export interface CreateFeedbackPayload {
  category: FeedbackCategory
  message: string
}

export function useCreateFeedback() {
  return useMutation({
    mutationFn: (payload: CreateFeedbackPayload) =>
      api.post<{ id: string }>('/feedback', payload).then((r) => r.data),
  })
}
