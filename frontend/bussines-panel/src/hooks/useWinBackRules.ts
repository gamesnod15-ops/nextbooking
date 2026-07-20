import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface WinBackRule {
  id: string
  daysSinceLastVisit: number
  messageTemplate: string
  isActive: boolean
  createdAt: string
}

const WIN_BACK_RULES_KEY = 'win-back-rules'

export function useWinBackRules() {
  return useQuery({
    queryKey: [WIN_BACK_RULES_KEY],
    queryFn: () => api.get<WinBackRule[]>('/win-back-rules').then((r) => r.data),
  })
}

export function useCreateWinBackRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { daysSinceLastVisit: number; messageTemplate: string }) =>
      api.post('/win-back-rules', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WIN_BACK_RULES_KEY] }),
  })
}

export function useUpdateWinBackRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; daysSinceLastVisit: number; messageTemplate: string; isActive: boolean }) =>
      api.put(`/win-back-rules/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WIN_BACK_RULES_KEY] }),
  })
}

export function useDeleteWinBackRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/win-back-rules/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [WIN_BACK_RULES_KEY] }),
  })
}
