import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, CreditCard, CheckCircle, Clock, XCircle, Search, Loader2 } from 'lucide-react'
import { usePayments, type Payment } from '@/hooks/usePayments'

const statusCfg: Record<string, { label: string; icon: React.ElementType; cls: string; bg: string }> = {
  completed:         { label: 'Tamamlandı',   icon: CheckCircle, cls: 'text-green-700',  bg: 'bg-green-50' },
  pending:           { label: 'Bekliyor',     icon: Clock,       cls: 'text-yellow-700', bg: 'bg-yellow-50' },
  failed:            { label: 'Başarısız',    icon: XCircle,     cls: 'text-red-600',    bg: 'bg-red-50' },
  refunded:          { label: 'İade',         icon: TrendingUp,  cls: 'text-gray-600',   bg: 'bg-gray-50' },
  partiallyRefunded: { label: 'Kısmi İade',   icon: TrendingUp,  cls: 'text-gray-600',   bg: 'bg-gray-50' },
}

export function PaymentsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)

  const { data, isLoading } = usePayments({
    pageNumber: page,
    pageSize: 20,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  })

  const payments = data?.items ?? []
  const completedTotal = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Ödemeler</h1>
          <p className="text-sm text-gray-500">Ödeme geçmişi ve durum takibi</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Bu Sayfada Toplam', value: formatCurrency(completedTotal), icon: CreditCard },
          { label: 'Tamamlanan',   value: String(payments.filter(p => p.status === 'completed').length),   icon: CheckCircle },
          { label: 'Bekleyen',     value: String(payments.filter(p => p.status === 'pending').length),     icon: Clock },
          { label: 'Başarısız',    value: String(payments.filter(p => p.status === 'failed').length),      icon: XCircle },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">{m.label}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{m.value}</p>
              </div>
              <m.icon className="h-8 w-8 text-gray-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Müşteri veya hizmet ara..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'completed', 'pending', 'failed'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === 'all' ? 'Tümü' : (statusCfg[s]?.label ?? s)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Müşteri', 'Hizmet', 'Tutar', 'Sağlayıcı', 'Durum', 'Tarih'].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Ödeme bulunamadı</td></tr>
              ) : payments.map((p: Payment) => {
                const s = statusCfg[p.status] ?? { label: p.status, icon: Clock, cls: 'text-gray-600', bg: 'bg-gray-50' }
                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{p.customerName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.serviceName}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{p.provider}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls} ${s.bg}`}>
                        <s.icon className="h-3.5 w-3.5" /> {s.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {p.paidAt ? new Date(p.paidAt).toLocaleDateString('tr-TR') : new Date(p.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data?.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
        </div>
      )}
    </div>
  )
}

