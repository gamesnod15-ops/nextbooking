import api from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

export interface ScheduleSuggestion {
  employeeId: string
  employeeName: string
  date: string
  suggestedStart: string
  suggestedEnd: string
  reason: string
  expectedDemandScore: number
}

export interface OverbookingSuggestion {
  appointmentId: string
  noShowProbability: number
  riskLevel: string
  suggestion: string
}

export function useScheduleOptimizations(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['smartSchedule', 'optimizations', startDate, endDate],
    queryFn: () =>
      api.get<ScheduleSuggestion[]>('/smart-schedule/optimizations', {
        params: { startDate, endDate },
      }).then(r => r.data),
    enabled: !!startDate && !!endDate,
  })
}

export function useOverbookingSuggestions(date: string) {
  return useQuery({
    queryKey: ['smartSchedule', 'overbooking', date],
    queryFn: () =>
      api.get<OverbookingSuggestion[]>('/smart-schedule/overbooking', {
        params: { date },
      }).then(r => r.data),
    enabled: !!date,
  })
}
