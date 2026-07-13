import { Component, type ErrorInfo, type ReactNode } from 'react'
import { store } from '@/store'
import { addError } from '@/store/slices/errorSlice'
import { AlertTriangle, RefreshCw, Home, Phone } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return `Chrome (${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? ''})`
  if (ua.includes('Firefox')) return `Firefox (${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? ''})`
  if (ua.includes('Edg')) return `Edge (${ua.match(/Edg\/([\d.]+)/)?.[1] ?? ''})`
  return ua.slice(0, 80)
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, errorId: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `err_boundary_${Date.now()}`
    this.setState({ errorInfo, errorId })

    const auth = store.getState().auth
    store.dispatch(
      addError({
        code: error.name ?? 'RenderError',
        message: error.message,
        description: 'React render hatası - component tree çöktü',
        page: window.location.pathname,
        url: window.location.href,
        route: window.location.pathname,
        timestamp: new Date().toISOString(),
        userId: auth.userId,
        userFullName: auth.fullName,
        browser: getBrowserInfo(),
        platform: navigator.platform,
        stackTrace: `${error.stack ?? ''}\n\nComponent Stack:\n${errorInfo.componentStack ?? ''}`,
        severity: 'critical',
        category: 'runtime',
      })
    )
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, errorId: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      const isDev = import.meta.env.DEV

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
          <div className="w-full max-w-lg">
            {/* Error card */}
            <div className="rounded-2xl border border-red-200 bg-white shadow-xl overflow-hidden">
              {/* Red header bar */}
              <div className="bg-gradient-to-r from-red-600 to-red-500 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-white">Beklenmeyen Hata</h1>
                    <p className="text-sm text-red-100">Sistem hatası oluştu</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Error info */}
                <div className="rounded-xl bg-red-50 border border-red-100 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-red-700">Hata Kodu:</span>
                    <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-mono text-red-800">
                      {this.state.error?.name ?? 'UNKNOWN_ERROR'}
                    </code>
                  </div>
                  <div className="text-sm text-red-700">
                    <span className="font-semibold">Açıklama: </span>
                    {this.state.error?.message ?? 'Bilinmeyen hata'}
                  </div>
                  {this.state.errorId && (
                    <div className="text-xs text-red-500">
                      Hata ID: <code className="font-mono">{this.state.errorId}</code>
                    </div>
                  )}
                </div>

                {/* Dev stack trace */}
                {isDev && this.state.error?.stack && (
                  <details className="group">
                    <summary className="cursor-pointer select-none text-xs font-medium text-gray-500 hover:text-gray-700">
                      Stack Trace (Geliştirici Modu)
                    </summary>
                    <pre className="mt-2 overflow-auto rounded-lg bg-gray-900 p-3 text-[10px] text-gray-300 leading-relaxed max-h-48">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}

                {/* Contact message */}
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Lütfen servis sağlayıcınız ile iletişime geçin.
                      </p>
                      <p className="mt-1 text-xs text-amber-700">
                        Bu hata otomatik olarak kayıt altına alındı. Teknik ekibimiz en kısa sürede
                        durumu inceleyecektir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={this.handleRetry}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Tekrar Dene
                  </button>
                  <a
                    href="/dashboard"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Home className="h-4 w-4" />
                    Ana Sayfa
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
