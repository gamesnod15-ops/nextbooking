import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Branch {
  id: string
  name: string
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  managerName: string | null
  isActive: boolean
  isMainBranch: boolean
  createdAt: string
}

export function useBranches() {
  return useQuery({
    queryKey: ['branches'],
    queryFn: () =>
      api.get<{ items: Branch[]; totalCount: number; totalPages: number }>(
        '/branches'
      ).then((r) => r.data),
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Branch, 'id' | 'createdAt'>) =>
      api.post('/branches', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })
}

export function useUpdateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Branch) =>
      api.put(`/branches/${id}`, { id, ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })
}

export function useDeleteBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/branches/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })
}
