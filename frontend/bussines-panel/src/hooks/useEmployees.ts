import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface Employee {
  id: string
  name: string
  title: string | null
  bio: string | null
  phone: string | null
  email: string | null
  avatarUrl: string | null
  isActive: boolean
  acceptsOnlineBookings: boolean
  serviceIds: string[]
  createdAt: string
}

export interface Schedule {
  id: string
  employeeId: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

export interface EmployeesFilter {
  pageNumber?: number
  pageSize?: number
  search?: string
  isActive?: boolean
}

export function useEmployees(filter: EmployeesFilter = {}) {
  return useQuery({
    queryKey: ['employees', filter],
    queryFn: () =>
      api.get<{ items: Employee[]; totalCount: number; totalPages: number }>(
        '/employees',
        { params: filter }
      ).then((r) => r.data),
  })
}

export function useEmployeeSchedules(employeeId: string) {
  return useQuery({
    queryKey: ['employee-schedules', employeeId],
    queryFn: () =>
      api.get<Schedule[]>(`/employees/${employeeId}/schedules`).then((r) => r.data),
    enabled: !!employeeId,
  })
}

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Employee, 'id' | 'createdAt' | 'avatarUrl'>) =>
      api.post('/employees', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useUpdateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Employee) =>
      api.put(`/employees/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useDeleteEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employees'] }),
  })
}

export function useUpsertSchedules(employeeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (schedules: Array<{ dayOfWeek: number; startTime: string; endTime: string; isActive: boolean }>) =>
      api.put(`/employees/${employeeId}/schedules`, schedules),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-schedules', employeeId] }),
  })
}
