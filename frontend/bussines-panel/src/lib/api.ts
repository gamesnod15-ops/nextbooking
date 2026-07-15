import axios from 'axios'
import { store } from '@/store'
import { logout, setCredentials } from '@/store/slices/authSlice'
import { logApiError } from '@/lib/errorLogger'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1',
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

/** Downscale + re-encode an image in the browser before upload. High-res phone
 *  photos (5-10MB) become a few hundred KB, so uploads are fast and the stored
 *  images stay light for visitors. SVG/GIF and already-small files pass through. */
async function compressImage(file: File, maxDim: number, quality = 0.82): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file
  if (file.size < 300 * 1024) return file

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close()

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/webp', quality)
    )
    // Only use the result when it actually got smaller
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

export async function uploadImage(file: File, folder?: string): Promise<string> {
  // Logos render small — 512px is plenty. Gallery/other photos keep more detail.
  const maxDim = folder === 'logos' ? 512 : 1920
  const optimized = await compressImage(file, maxDim)

  const form = new FormData()
  form.append('file', optimized)
  const params = folder ? `?folder=${encodeURIComponent(folder)}` : ''
  const { data } = await api.post<{ url: string }>(`/uploads/image${params}`, form)
  return data.url
}

export default api
