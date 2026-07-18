import { useState } from 'react'
import { Loader2, Plus, X, Wallet, Clock, RefreshCw, FileText, Building2, Hash } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { showToast } from '@/components/ui/Toast'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  useAdminPayments,
  useAdminPaymentsSummary,
  useCreateAdminPayment,
  useUpdateAdminPaymentStatus,
  useSyncSubscriptionPayments,
  type PlatformPayment,
  type PlatformPaymentType,
  type PlatformPaymentStatus,
} from '@/hooks/useAdminPayments'

const typeLabels: Record<PlatformPaymentType, string> = {
  Subscription: 'Abonelik',
  Advertiser: 'Reklamveren',
  Sponsorship: 'Sponsorluk',
}

const statusLabels: Record<PlatformPaymentStatus, string> = {
  Pending: 'Beklemede',
  Paid: 'Ödendi',
  Failed: 'Başarısız',
  Refunded: 'İade Edildi',
}

const statusVariant: Record<PlatformPaymentStatus, 'default' | 'success' | 'destructive' | 'warning'> = {
  Pending: 'warning',
  Paid: 'success',
  Failed: 'destructive',
  Refunded: 'default',
}

const emptyForm = {
  type: 'Subscription' as PlatformPaymentType,
  payerName: '',
  amount: '',
  currency: 'TRY',
  description: '',
  status: 'Paid' as PlatformPaymentStatus,
}

function hasBillingInfo(p: PlatformPayment) {
  return !!(p.billingAddress || p.billingCity || p.billingCountry || p.taxNumber || p.taxOffice)
}

export function PaymentsPage() {
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState<PlatformPaymentType | ''>('')
  const [statusFilter, setStatusFilter] = useState<PlatformPaymentStatus | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [detail, setDetail] = useState<PlatformPayment | null>(null)

  const { data, isLoading } = useAdminPayments({
    pageNumber: page,
    pageSize: 20,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
  })
  const { data: summary } = useAdminPaymentsSummary()
  const createMutation = useCreateAdminPayment()
  const updateStatusMutation = useUpdateAdminPaymentStatus()
  const syncMutation = useSyncSubscriptionPayments()

  const payments = data?.items ?? []

  async function save() {
    const amount = parseFloat(form.amount)
    if (!form.payerName.trim() || !amount || amount <= 0) {
      showToast('error', 'Eksik bilgi', 'Ödeyen adı ve tutar zorunludur.')
      return
    }
    try {
      await createMutation.mutateAsync({
        type: form.type,
        payerName: form.payerName,
        amount,
        currency: form.currency,
        description: form.description || null,
        status: form.status,
      })
      showToast('success', 'Kayıt eklendi', 'Ödeme kaydı oluşturuldu.')
      setModalOpen(false)
      setForm(emptyForm)
    } catch {
      showToast('error', 'Hata', 'Ödeme kaydı oluşturulamadı.')
    }
  }

  async function changeStatus(id: string, status: PlatformPaymentStatus) {
    try {
      await updateStatusMutation.mutateAsync({ id, status })
      showToast('success', 'Güncellendi', 'Ödeme durumu güncellendi.')
    } catch {
      showToast('error', 'Hata', 'Durum güncellenemedi.')
    }
  }

  async function syncSubscriptions() {
    try {
      const result = await syncMutation.mutateAsync()
      showToast('success', 'Senkronize edildi', `${result.created} yeni abonelik ödemesi oluşturuldu, ${result.skipped} atlandı.`)
    } catch {
      showToast('error', 'Hata', 'Abonelik ödemeleri senkronize edilemedi.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Ödemeler" description="Abonelik, reklamveren ve sponsorluk gelirleri">
        <button
          onClick={syncSubscriptions}
          disabled={syncMutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          title="Ücretli plan seçen işletmelerin bu ayki abonelik ödemesini oluşturur"
        >
          {syncMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Abonelik Ödemelerini Senkronize Et
        </button>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Ödeme Ekle
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Toplam Gelir" value={formatCurrency(summary?.totalPaidAmount ?? 0)} icon={<Wallet />} color="green" />
        <StatCard title="Bekleyen Tutar" value={formatCurrency(summary?.totalPendingAmount ?? 0)} icon={<Clock />} color="orange" />
        {summary?.byType.map((t) => (
          <StatCard
            key={t.type}
            title={typeLabels[t.type]}
            value={formatCurrency(t.totalAmount)}
            subtitle={`${t.count} ödeme`}
            icon={<Wallet />}
            color="blue"
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as PlatformPaymentType | ''); setPage(1) }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tüm Türler</option>
          {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value as PlatformPaymentStatus | ''); setPage(1) }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tür</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ödeyen</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 md:table-cell">İşletme</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tutar</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Tarih</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Fatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Ödeme kaydı bulunamadı</td></tr>
              ) : payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><Badge variant="info">{typeLabels[p.type]}</Badge></td>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.payerName}</td>
                  <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{p.tenantName ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => changeStatus(p.id, e.target.value as PlatformPaymentStatus)}
                      className="rounded-md border-0 bg-transparent text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <Badge variant={statusVariant[p.status]} className="ml-1 hidden sm:inline-flex">{statusLabels[p.status]}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{formatDate(p.paidAt ?? p.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDetail(p)}
                      className={`rounded-md p-1.5 hover:bg-gray-100 ${hasBillingInfo(p) ? 'text-primary' : 'text-gray-300'}`}
                      title={hasBillingInfo(p) ? 'Fatura detayını görüntüle' : 'Fatura bilgisi yok'}
                    >
                      <FileText className="h-4 w-4" />
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

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setDetail(null)}>
          <div className="w-full max-w-sm bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900">Ödeme Detayı</h2>
              <button onClick={() => setDetail(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(detail.amount, detail.currency)}</div>
                  <div className="text-xs text-gray-500">{detail.description ?? typeLabels[detail.type]}</div>
                </div>
                <Badge variant={statusVariant[detail.status]}>{statusLabels[detail.status]}</Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Building2 className="h-4 w-4 shrink-0 text-gray-400" />{detail.payerName}{detail.tenantName ? ` (${detail.tenantName})` : ''}</div>
                <div className="text-gray-500">Tarih: {formatDate(detail.paidAt ?? detail.createdAt)}</div>
              </div>

              <div className="rounded-xl bg-gray-50 p-3 text-sm space-y-2">
                <div className="text-xs font-semibold text-gray-500">Fatura Bilgileri</div>
                {hasBillingInfo(detail) ? (
                  <>
                    {(detail.billingAddress || detail.billingCity || detail.billingCountry) && (
                      <div className="text-gray-700">
                        {[detail.billingAddress, detail.billingCity, detail.billingCountry].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {(detail.taxNumber || detail.taxOffice) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Hash className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        {[detail.taxNumber, detail.taxOffice].filter(Boolean).join(' — ')}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-gray-400">Bu kayıt için fatura adresi girilmemiş.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">Yeni Ödeme Kaydı</h2>
              <button onClick={() => setModalOpen(false)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Tür *</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PlatformPaymentType }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Durum *</label>
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as PlatformPaymentStatus }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Ödeyen / Firma Adı *</label>
                  <input value={form.payerName} onChange={(e) => setForm((f) => ({ ...f, payerName: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Örn. Acme Reklam A.Ş." />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Tutar *</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0.00" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Para Birimi</label>
                  <input value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="TRY" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Açıklama</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Kampanya, paket adı vb." />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button
                onClick={save}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
