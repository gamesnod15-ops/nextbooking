import { useState } from 'react'
import { Loader2, Search, X, Mail, Phone, MapPin, Users, ShieldOff, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { showToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import { useAdminTenants, useSetTenantActiveStatus, type PlatformTenant } from '@/hooks/useAdminTenants'

const planLabels: Record<string, string> = {
  starter: 'Starter',
  business: 'Business',
  professional: 'Professional',
  custom: 'Custom',
}

export function BusinessesPage() {
  const [search, setSearch] = useState('')
  const [plan, setPlan] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState<PlatformTenant | null>(null)

  const { data, isLoading } = useAdminTenants({ pageNumber: page, pageSize: 20, search: search || undefined, plan: plan || undefined })
  const statusMutation = useSetTenantActiveStatus()

  const tenants = data?.items ?? []

  async function toggleActive(id: string, next: boolean) {
    try {
      await statusMutation.mutateAsync({ id, isActive: next })
      showToast('success', next ? 'İşletme aktifleştirildi' : 'İşletme askıya alındı')
      setDetail((d) => (d && d.tenantId === id ? { ...d, isActive: next } : d))
    } catch {
      showToast('error', 'Hata', 'İşlem gerçekleştirilemedi.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="İşletmeler" description={`Platformdaki tüm kayıtlı işletmeler${data ? ` (${data.totalCount})` : ''}`} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İşletme adı, alt alan adı ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={plan}
          onChange={(e) => { setPlan(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tüm Planlar</option>
          {Object.entries(planLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">İşletme</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">Sahibi</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 md:table-cell">Plan</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Personel / Müşteri</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tenants.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">İşletme bulunamadı</td></tr>
              ) : tenants.map((t) => (
                <tr key={t.tenantId} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetail(t)} className="text-left hover:underline">
                      <div className="font-medium text-gray-900">{t.businessName ?? t.tenantName}</div>
                      <div className="text-xs text-gray-400">{t.subdomain}</div>
                    </button>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{t.ownerFullName ?? t.ownerEmail ?? '—'}</td>
                  <td className="hidden px-4 py-3 md:table-cell"><Badge variant="info">{planLabels[t.plan] ?? t.plan}</Badge></td>
                  <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{t.employeeCount} / {t.customerCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t.isActive ? 'success' : 'destructive'}>{t.isActive ? 'Aktif' : 'Askıda'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleActive(t.tenantId, !t.isActive)}
                      disabled={statusMutation.isPending}
                      className={`rounded-md p-1.5 hover:bg-gray-100 ${t.isActive ? 'text-red-500' : 'text-emerald-500'}`}
                      title={t.isActive ? 'Askıya al' : 'Aktifleştir'}
                    >
                      {t.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data?.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.totalPages ?? 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setDetail(null)}>
          <div className="w-full max-w-sm bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900">İşletme Detayı</h2>
              <button onClick={() => setDetail(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary overflow-hidden">
                  {detail.logoUrl
                    ? <img src={detail.logoUrl} alt="" className="h-full w-full object-cover" />
                    : (detail.businessName ?? detail.tenantName).split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-base font-bold text-gray-900">{detail.businessName ?? detail.tenantName}</div>
                  <Badge variant={detail.isActive ? 'success' : 'destructive'}>{detail.isActive ? 'Aktif' : 'Askıda'}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{detail.employeeCount}</div>
                  <div className="text-xs text-gray-500">Personel</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="text-xl font-bold text-gray-900">{detail.customerCount}</div>
                  <div className="text-xs text-gray-500">Müşteri</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {detail.ownerEmail && <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 shrink-0 text-gray-400" />{detail.ownerFullName ? `${detail.ownerFullName} (${detail.ownerEmail})` : detail.ownerEmail}</div>}
                {detail.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 shrink-0 text-gray-400" />{detail.phone}</div>}
                {detail.city && <div className="flex items-center gap-2 text-gray-600"><MapPin className="h-4 w-4 shrink-0 text-gray-400" />{detail.city}</div>}
                <div className="flex items-center gap-2 text-gray-600"><Users className="h-4 w-4 shrink-0 text-gray-400" />{detail.subdomain}.randevumkolay.com</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
                <div>Plan: <span className="font-medium text-gray-700">{planLabels[detail.plan] ?? detail.plan}</span></div>
                <div>Kayıt tarihi: <span className="font-medium text-gray-700">{formatDate(detail.createdAt)}</span></div>
                {detail.subscriptionEndsAt && <div>Abonelik bitişi: <span className="font-medium text-gray-700">{formatDate(detail.subscriptionEndsAt)}</span></div>}
                {detail.trialEndsAt && <div>Deneme süresi bitişi: <span className="font-medium text-gray-700">{formatDate(detail.trialEndsAt)}</span></div>}
              </div>
              <button
                onClick={() => toggleActive(detail.tenantId, !detail.isActive)}
                disabled={statusMutation.isPending}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${detail.isActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
              >
                {detail.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {detail.isActive ? 'İşletmeyi Askıya Al' : 'İşletmeyi Aktifleştir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
