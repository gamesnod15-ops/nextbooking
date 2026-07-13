import { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState, useAppDispatch } from '@/store'
import {
  resolveError,
  resolveAllErrors,
  deleteError,
  clearAllErrors,
  type AppError,
  type ErrorSeverity,
} from '@/store/slices/errorSlice'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  AlertCircle,
  Zap,
  X,
  CheckCheck,
  Trash2,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe,
  User,
  Monitor,
  Server,
  Code2,
  Search,
  Filter,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const severityConfig: Record<ErrorSeverity, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  warning: { label: 'Uyarı', color: 'text-amber-600', icon: AlertTriangle, bg: 'bg-amber-50 border-amber-200' },
  error: { label: 'Hata', color: 'text-red-600', icon: AlertCircle, bg: 'bg-red-50 border-red-200' },
  critical: { label: 'Kritik', color: 'text-rose-700', icon: Zap, bg: 'bg-rose-50 border-rose-200' },
}

function SeverityBadge({ severity }: { severity: ErrorSeverity }) {
  const cfg = severityConfig[severity]
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', cfg.color, cfg.bg)}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  )
}

function ErrorCard({ error, expanded, onToggle }: { error: AppError; expanded: boolean; onToggle: () => void }) {
  const dispatch = useAppDispatch()
  const isDev = import.meta.env.DEV

  return (
    <div className={cn(
      'rounded-xl border transition-all',
      error.resolved ? 'border-gray-200 bg-gray-50 opacity-60' : severityConfig[error.severity].bg
    )}>
      {/* Header row */}
      <div className="flex items-start gap-3 p-4">
        <button onClick={onToggle} className="mt-0.5 shrink-0 text-gray-400 hover:text-gray-600 transition-colors">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <SeverityBadge severity={error.severity} />
            <code className="rounded bg-white/80 border px-1.5 py-0.5 text-[10px] font-mono text-gray-700">
              {error.code}
            </code>
            {error.statusCode && (
              <code className="rounded bg-white/80 border px-1.5 py-0.5 text-[10px] font-mono text-gray-700">
                HTTP {error.statusCode}
              </code>
            )}
            {error.resolved && (
              <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 uppercase">
                Çözüldü
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900 leading-snug truncate">{error.message}</p>
          {error.description && (
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{error.description}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true, locale: tr })}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {error.page}
            </span>
            {error.userFullName && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {error.userFullName}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {!error.resolved && (
            <button
              onClick={() => dispatch(resolveError(error.id))}
              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-100 transition-colors"
              title="Çözüldü olarak işaretle"
            >
              <CheckCheck className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => dispatch(deleteError(error.id))}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600 transition-colors"
            title="Sil"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t bg-white/60 px-4 pb-4 pt-3 space-y-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-xs">
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                <div>
                  <p className="text-gray-400 font-medium">URL</p>
                  <p className="text-gray-700 break-all font-mono">{error.url}</p>
                </div>
              </div>
              {error.apiEndpoint && (
                <div className="flex items-start gap-2">
                  <Server className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                  <div>
                    <p className="text-gray-400 font-medium">API Endpoint</p>
                    <p className="text-gray-700 font-mono">{error.apiEndpoint}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <Monitor className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                <div>
                  <p className="text-gray-400 font-medium">Tarayıcı</p>
                  <p className="text-gray-700">{error.browser}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                <div>
                  <p className="text-gray-400 font-medium">Zaman</p>
                  <p className="text-gray-700">{new Date(error.timestamp).toLocaleString('tr-TR')}</p>
                </div>
              </div>
            </div>
          </div>

          {isDev && error.stackTrace && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
                <Code2 className="h-3 w-3" /> Stack Trace
              </p>
              <pre className="overflow-auto rounded-lg bg-gray-900 p-3 text-[10px] text-gray-300 leading-relaxed max-h-40 font-mono">
                {error.stackTrace}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

type FilterSeverity = 'all' | ErrorSeverity
type FilterStatus = 'all' | 'unresolved' | 'resolved'

interface ErrorMonitorPanelProps {
  maxItems?: number
  compact?: boolean
}

export function ErrorMonitorPanel({ maxItems = 50, compact = false }: ErrorMonitorPanelProps) {
  const dispatch = useAppDispatch()
  const { errors, unresolvedCount } = useSelector((s: RootState) => s.errors)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('all')
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('unresolved')

  const filtered = errors
    .filter((e) => {
      if (filterSeverity !== 'all' && e.severity !== filterSeverity) return false
      if (filterStatus === 'unresolved' && e.resolved) return false
      if (filterStatus === 'resolved' && !e.resolved) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        return (
          e.message.toLowerCase().includes(q) ||
          e.code.toLowerCase().includes(q) ||
          e.page.toLowerCase().includes(q) ||
          (e.apiEndpoint ?? '').toLowerCase().includes(q)
        )
      }
      return true
    })
    .slice(0, maxItems)

  if (errors.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <CheckCheck className="h-6 w-6 text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-gray-900">Hata Yok</p>
        <p className="mt-1 text-xs text-gray-500">Sistem sorunsuz çalışıyor.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Hata ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-lg border bg-white pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary w-48"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg border bg-white p-0.5">
              {(['all', 'unresolved', 'resolved'] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors',
                    filterStatus === s ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {s === 'all' ? 'Tümü' : s === 'unresolved' ? 'Çözülmemiş' : 'Çözülmüş'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-lg border bg-white p-0.5">
              {(['all', 'warning', 'error', 'critical'] as FilterSeverity[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-[10px] font-medium transition-colors',
                    filterSeverity === s ? 'bg-primary text-primary-foreground' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {s === 'all' ? 'Seviye' : s === 'warning' ? 'Uyarı' : s === 'error' ? 'Hata' : 'Kritik'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unresolvedCount > 0 && (
              <button
                onClick={() => dispatch(resolveAllErrors())}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Tümünü Çöz
              </button>
            )}
            <button
              onClick={() => dispatch(clearAllErrors())}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Temizle
            </button>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        {(['critical', 'error', 'warning'] as ErrorSeverity[]).map((sev) => {
          const count = errors.filter((e) => e.severity === sev && !e.resolved).length
          const cfg = severityConfig[sev]
          const Icon = cfg.icon
          return (
            <div key={sev} className={cn('rounded-xl border p-3 text-center', cfg.bg)}>
              <Icon className={cn('mx-auto mb-1 h-4 w-4', cfg.color)} />
              <p className="text-lg font-bold text-gray-900">{count}</p>
              <p className="text-[10px] font-medium text-gray-500">{cfg.label}</p>
            </div>
          )
        })}
      </div>

      {/* Error list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center">
            <Filter className="mx-auto mb-2 h-5 w-5 text-gray-300" />
            <p className="text-xs text-gray-500">Bu filtreyle eşleşen hata bulunamadı.</p>
          </div>
        ) : (
          filtered.map((error) => (
            <ErrorCard
              key={error.id}
              error={error}
              expanded={expandedId === error.id}
              onToggle={() => setExpandedId(expandedId === error.id ? null : error.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
