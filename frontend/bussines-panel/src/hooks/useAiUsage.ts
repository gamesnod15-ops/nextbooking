import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export interface AiUsageSummary {
  messageCount: number
  freeLimit: number
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
}

export function useAiUsage() {
  return useQuery({
    queryKey: ['ai-usage'],
    queryFn: () => api.get<AiUsageSummary>('/whatsapp-conversations/ai-usage').then((r) => r.data),
  })
}
