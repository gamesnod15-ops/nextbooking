import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface NoShowPrediction {
  probability: number
  riskLevel: string
  requiresDeposit: boolean
  recommendedDepositAmount: number | null
  factors: string | null
}

export interface NoShowPredictionItem {
  id: string
  customerName: string
  customerPhone: string
  serviceName: string
  appointmentStart: string
  probability: number
  riskLevel: string
  requiresDeposit: boolean
  actualNoShow: boolean | null
  predictedAt: string
}

export interface NoShowPredictionList {
  items: NoShowPredictionItem[]
  totalCount: number
  totalPages: number
}

export function usePredictNoShow() {
  return useMutation({
    mutationFn: (data: { appointmentId: string; customerId: string }) =>
      api.post<NoShowPrediction>('/noShowPredictions/predict', data).then(r => r.data),
  })
}

export function useNoShowPredictions(filter: {
  pageNumber?: number
  pageSize?: number
  riskLevel?: string
  requiresDeposit?: boolean
} = {}) {
  return useQuery({
    queryKey: ['noShowPredictions', filter],
    queryFn: () =>
      api.get<NoShowPredictionList>('/noShowPredictions', { params: filter }).then(r => r.data),
  })
}

export function useUpdateNoShowOutcome() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, noShow }: { id: string; noShow: boolean }) =>
      api.put(`/noShowPredictions/${id}/outcome`, { noShow }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['noShowPredictions'] }),
  })
}
