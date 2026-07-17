import api from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginatedList } from '@/types'

export interface PlatformUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: string
  tenantId: string | null
  tenantName: string | null
  tenantPlan: string | null
  isActive: boolean
  emailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface PlatformUserDetail extends PlatformUser {
  firstName: string
  lastName: string
  jobTitle: string | null
  avatarUrl: string | null
  phoneVerified: boolean
}

export interface GetUsersParams {
  pageNumber?: number
  pageSize?: number
  search?: string
  role?: string
  isActive?: boolean
}

export function useAdminUsers(params: GetUsersParams) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => api.get<PaginatedList<PlatformUser>>('/admin/users', { params }).then((r) => r.data),
  })
}

export function useAdminUserDetail(id: string | null) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => api.get<PlatformUserDetail>(`/admin/users/${id}`).then((r) => r.data),
    enabled: !!id,
  })
}

export function useSetUserActiveStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/users/${id}/status`, { isActive }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
