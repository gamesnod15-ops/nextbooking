import axios from 'axios'
import { store } from '@/store'
import { logout, setCredentials } from '@/store/slices/authSlice'
import { logApiError } from '@/lib/errorLogger'

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else if (token) p.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`
              resolve(api(originalRequest))
            },
            reject,
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await api.post('/auth/refresh')
        store.dispatch(
          setCredentials({
            accessToken: data.accessToken,
            userId: store.getState().auth.userId,
            role: store.getState().auth.role,
            tenantId: store.getState().auth.tenantId,
            fullName: store.getState().auth.fullName,
            email: store.getState().auth.email,
            phone: store.getState().auth.phone,
            jobTitle: store.getState().auth.jobTitle,
          })
        )
        processQueue(null, data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        store.dispatch(logout())
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Global error logger interceptor ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    // Don't log 401 (handled above) or aborted requests
    if (status && status !== 401 && !axios.isCancel(error)) {
      const url = error.config?.url ?? 'unknown'
      const method = (error.config?.method ?? 'GET').toUpperCase()
      const message =
        error.response?.data?.message ??
        error.response?.data?.title ??
        error.message ??
        'API Hatası'
      const requestId = error.response?.headers?.['x-request-id'] ?? undefined
      logApiError(`${method} ${url}`, status, message, requestId)
    }
    return Promise.reject(error)
  }
)

export default api
