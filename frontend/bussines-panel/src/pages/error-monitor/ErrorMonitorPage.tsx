import { useSelector } from 'react-redux'
import { RootState, useAppDispatch } from '@/store'
import { clearAllErrors, resolveAllErrors } from '@/store/slices/errorSlice'
import { ErrorMonitorPanel } from '@/components/error/ErrorMonitorPanel'
import { PageHeader } from '@/components/ui/PageHeader'
import { AlertTriangle, CheckCheck, Trash2, RefreshCw, Activity } from 'lucide-react'
import { logError } from '@/lib/errorLogger'

export function ErrorMonitorPage() {
  const dispatch = useAppDispatch()
  const { errors, unresolvedCount, totalCount, sessionId } = useSelector((s: RootState) => s.errors)

  const criticalCount = errors.filter((e) => e.severity === 'critical' && !e.resolved).length
  const errorLevelCount = errors.filter((e) => e.severity === 'error' && !e.resolved).length
  const warningCount = errors.filter((e) => e.severity === 'warning' && !e.resolved).length

  // Test error button (dev only)
  const handleTestError = () => {
    logError({
      code: 'TEST_ERROR',
      message: 'Bu bir test hatasıdır',
      description: 'Hata izleme sisteminin test edilmesi için oluşturulmuştur.',
      severity: 'warning',
      category: 'unknown',
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hata İzleme"
        description="Sistem genelindeki hataları izleyin, analiz edin ve yönetin."
      />

      {/* Status banner */}
      {unresolvedCount > 0 ? (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {unresolvedCount} çözülmemiş hata bulunuyor
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Lütfen aşağıdaki hataları inceleyip ilgili kişilerle paylaşın.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => dispatch(resolveAllErrors())}
              className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tümünü Çöz
            </button>
          </div>
        </div>
      ) : totalCount > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCheck className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            Tüm hatalar çözüldü. Sistem sağlıklı çalışıyor.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <Activity className="h-5 w-5 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            Sistem sağlıklı — kayıtlı hata bulunmuyor.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
          <p className="text-xs text-gray-500 mt-0.5">Toplam Hata</p>
        </div>
        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-2xl font-bold text-rose-700">{criticalCount}</p>
          <p className="text-xs text-rose-500 mt-0.5">Kritik</p>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4">
          <p className="text-2xl font-bold text-red-700">{errorLevelCount}</p>
          <p className="text-xs text-red-500 mt-0.5">Hata</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-2xl font-bold text-amber-700">{warningCount}</p>
          <p className="text-xs text-amber-500 mt-0.5">Uyarı</p>
        </div>
      </div>

      {/* Session info */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-gray-50 px-4 py-3 text-xs text-gray-500">
        <span>Oturum: <code className="font-mono text-gray-700">{sessionId}</code></span>
        <span>Tarayıcı: <span className="text-gray-700">{navigator.userAgent.slice(0, 60)}...</span></span>
        {import.meta.env.DEV && (
          <button
            onClick={handleTestError}
            className="ml-auto flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:bg-white hover:border-gray-400 transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Test Hatası Oluştur
          </button>
        )}
        {totalCount > 0 && (
          <button
            onClick={() => dispatch(clearAllErrors())}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-red-200 px-3 py-1.5 text-[11px] font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Tüm Kaydı Temizle
          </button>
        )}
      </div>

      {/* Main panel */}
      <div className="rounded-xl border bg-white p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">Hata Kayıtları</h2>
        <ErrorMonitorPanel maxItems={100} />
      </div>
    </div>
  )
}
