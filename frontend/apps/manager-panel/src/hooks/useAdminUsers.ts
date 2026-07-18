import api from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PaginatedList } from '@/types'

// "PlatformUser" here always means a platform_admin account — the manager
// panel's own operator accounts, not business owners/staff/customers.
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

export interface CreateAdminPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string | null
}

export function useCreateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAdminPayload) =>
      api.post<{ id: string }>('/admin/users', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}

export interface UpdateAdminPayload {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
}

export function useUpdateAdmin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateAdminPayload) =>
      api.put(`/admin/users/${id}`, payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] })
    },
  })
}
