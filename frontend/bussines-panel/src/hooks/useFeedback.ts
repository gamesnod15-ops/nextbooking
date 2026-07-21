import api, { uploadImage } from '@/lib/api'
import { useMutation } from '@tanstack/react-query'

export type FeedbackCategory = 'EasyToUse' | 'Confusing' | 'Suggestion' | 'BugReport'

export interface CreateFeedbackPayload {
  category: FeedbackCategory
  message: string
  images?: File[]
}

export function useCreateFeedback() {
  return useMutation({
    mutationFn: async (payload: CreateFeedbackPayload) => {
      let imageUrls: string[] | undefined

      if (payload.images && payload.images.length > 0) {
        imageUrls = await Promise.all(
          payload.images.map((file) => uploadImage(file, 'feedbacks'))
        )
      }

      return api
        .post<{ id: string }>('/feedback', {
          category: payload.category,
          message: payload.message,
          imageUrls: imageUrls?.length ? imageUrls.join(',') : null,
        })
        .then((r) => r.data)
    },
  })
}
