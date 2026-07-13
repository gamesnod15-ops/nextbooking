import { store } from '@/store'
import { addError, type ErrorSeverity, type ErrorCategory } from '@/store/slices/errorSlice'

export interface ErrorLogPayload {
  code?: string
  message: string
  description?: string
  apiEndpoint?: string
  statusCode?: number
  stackTrace?: string
  severity?: ErrorSeverity
  category?: ErrorCategory
  requestId?: string
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return `Chrome (${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ''})`
  if (ua.includes('Firefox')) return `Firefox (${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ''})`
  if (ua.includes('Safari') && !ua.includes('Chrome')) return `Safari (${ua.match(/Version\/([\d.]+)/)?.[1] ?? ''})`
  if (ua.includes('Edg')) return `Edge (${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ''})`
  return ua.slice(0, 80)
}

function getCurrentPage(): string {
  const path = window.location.pathname
  const routes: Record<string, string> = {
    '/dashboard': 'Gösterge Paneli',
    '/appointments': 'Randevular',
    '/calendar': 'Takvim',
    '/services': 'Hizmetler',
    '/employees': 'Çalışanlar',
    '/customers': 'Müşteriler',
    '/payments': 'Ödemeler',
    '/reports': 'Raporlar',
    '/settings': 'Ayarlar',
    '/notifications': 'Bildirimler',
    '/plugins': 'Eklentiler',
    '/campaigns': 'Kampanyalar',
    '/forms': 'Formlar',
    '/chatbot': 'Chatbot',
  }
  for (const [key, label] of Object.entries(routes)) {
    if (path.startsWith(key)) return label
  }
  return path
}

export function logError(payload: ErrorLogPayload): void {
  const state = store.getState()
  const auth = state.auth

  store.dispatch(
    addError({
      code: payload.code ?? `ERR_${payload.statusCode ?? 'UNKNOWN'}`,
      message: payload.message,
      description: payload.description,
      page: getCurrentPage(),
      url: window.location.href,
      route: window.location.pathname,
      timestamp: new Date().toISOString(),
      userId: auth.userId,
      userFullName: auth.fullName,
      browser: getBrowserInfo(),
      platform: navigator.platform,
      apiEndpoint: payload.apiEndpoint,
      statusCode: payload.statusCode,
      stackTrace: payload.stackTrace,
      severity: payload.severity ?? 'error',
      category: payload.category ?? 'unknown',
      requestId: payload.requestId,
    })
  )
}

export function logApiError(
  endpoint: string,
  statusCode: number,
  message: string,
  requestId?: string
): void {
  let severity: ErrorSeverity = 'error'
  if (statusCode >= 500) severity = 'critical'
  else if (statusCode === 401 || statusCode === 403) severity = 'warning'

  logError({
    code: `HTTP_${statusCode}`,
    message,
    apiEndpoint: endpoint,
    statusCode,
    severity,
    category: 'api',
    requestId,
  })
}

export function logRuntimeError(error: Error, context?: string): void {
  logError({
    code: error.name ?? 'RuntimeError',
    message: error.message,
    description: context,
    stackTrace: error.stack,
    severity: 'critical',
    category: 'runtime',
  })
}
