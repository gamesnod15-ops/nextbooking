import api from '@/lib/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { setCredentials } from '@/store/slices/authSlice'

export interface MyProfile {
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  jobTitle: string | null
  avatarUrl: string | null
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['me', 'profile'],
    queryFn: () => api.get<MyProfile>('/users/me').then((r) => r.data),
  })
}

export interface UpdateMyProfilePayload {
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  jobTitle?: string | null
  avatarUrl?: string | null
}

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: (payload: UpdateMyProfilePayload) => api.put('/users/me', payload).then((r) => r.data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['me', 'profile'] })
      dispatch(setCredentials({ fullName: `${variables.firstName} ${variables.lastName}`.trim(), email: variables.email ?? undefined }))
    },
  })
}
