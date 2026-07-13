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
  tenantId: string | null
  email?: string
  avatarUrl?: string | null
}

interface OAuthLoginRequest {
  provider: string
  token: string
}

interface OAuthLoginResponse {
  isNewUser: boolean
  accessToken?: string
  userId?: string
  role?: string
  fullName?: string
  email?: string
  avatarUrl?: string | null
  tenantId?: string | null
  providerInfo?: {
    provider: string
    providerUserId: string
    email: string
    fullName: string
    avatarUrl: string | null
  }
}

interface CompleteOAuthRequest {
  provider: string
  providerUserId: string
  email: string
  firstName: string
  lastName: string
  phone: string
  username: string
  businessName?: string
  country?: string
  city?: string
  purpose?: string
  agreedToTerms: boolean
  avatarUrl?: string | null
}

interface CompleteOAuthResponse {
  accessToken: string
  userId: string
  role: string
  fullName: string
  tenantId: string | null
}

export function useLogin() {
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: (data: LoginRequest) =>
      api.post<LoginResponse>('/auth/login', data).then((r) => r.data),
    onSuccess: (data) => {
      const allowedRoles = ['business', 'tenant_admin']
      if (!allowedRoles.includes(data.role)) {
        throw new Error('unauthorized_role')
      }

      dispatch(
        setCredentials({
          accessToken: data.accessToken,
          userId: data.userId,
          role: data.role,
          tenantId: data.tenantId,
          fullName: data.fullName,
          email: data.email ?? null,
          phone: null,
          jobTitle: null,
          avatarUrl: data.avatarUrl ?? null,
        })
      )
    },
  })
}

export function useOAuthLogin() {
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: (data: OAuthLoginRequest) =>
      api.post<OAuthLoginResponse>(`/auth/oauth/${data.provider}/callback`, { token: data.token }).then((r) => r.data),
    onSuccess: (data) => {
      if (data.isNewUser || !data.accessToken) return

      dispatch(
        setCredentials({
          accessToken: data.accessToken,
          userId: data.userId,
          role: data.role,
          tenantId: data.tenantId,
          fullName: data.fullName,
          email: data.email ?? null,
          phone: null,
          jobTitle: null,
          avatarUrl: data.avatarUrl ?? null,
        })
      )
    },
  })
}

export function useCompleteOAuthRegistration() {
  const dispatch = useDispatch()
  return useMutation({
    mutationFn: (data: CompleteOAuthRequest) =>
      api.post<CompleteOAuthResponse>('/auth/oauth/complete-registration', data).then((r) => r.data),
    onSuccess: (data) => {
      dispatch(
        setCredentials({
          accessToken: data.accessToken,
          userId: data.userId,
          role: data.role,
          tenantId: data.tenantId,
          fullName: data.fullName,
          email: null,
          phone: null,
          jobTitle: null,
          avatarUrl: null,
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
