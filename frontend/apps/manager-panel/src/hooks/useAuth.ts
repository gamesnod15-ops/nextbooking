import api from '@/lib/api'
import { useMutation } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { logout, setCredentials } from '@/store/slices/authSlice'

interface LoginRequest {
  email: string
  password: string
}

interface LoginResponse {
  accessToken: string
  userId: string
  role: string
  fullName: string
  email?: string
}

export function useLogin() {
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      if (data.role !== 'platform_admin') {
        throw new Error('unauthorized_role')
      }
      dispatch(
        setCredentials({
          accessToken: data.accessToken,
          userId: data.userId,
          role: data.role,
          fullName: data.fullName,
          email: data.email ?? null,
        })
      )
    },
  })
}

export function useLogout() {
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: () => api.post('/auth/logout').then((r) => r.data),
    onSettled: () => {
      dispatch(logout())
    },
  })
}
