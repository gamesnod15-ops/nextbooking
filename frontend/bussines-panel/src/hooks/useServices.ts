import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  bufferMinutes: number
  price: number
  color: string | null
  imageUrl: string | null
  isActive: boolean
  requiresConfirmation: boolean
  maxCapacity: number | null
  sortOrder: number
  createdAt: string
}

export interface ServicesFilter {
  pageNumber?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}

export function useServices(filter: ServicesFilter = {}) {
  return useQuery({
    queryKey: ['services', filter],
    queryFn: () =>
      api.get<{ items: Service[]; totalCount: number; totalPages: number }>(
        '/services',
        { params: filter }
      ).then((r) => r.data),
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Service, 'id' | 'createdAt' | 'sortOrder'>) =>
      api.post<{ id: string }>('/services', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useUpdateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Service) =>
      api.put(`/services/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}
