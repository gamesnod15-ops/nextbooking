import { useState } from 'react'
import { Plus, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  useDeposits,
  useCreateDeposit,
  useApplyDeposit,
  useRefundDeposit,
  useCancelDeposit,
  useForfeitDeposit,
} from '@/hooks/useDeposits'
import { useAppointments } from '@/hooks/useAppointments'

const statusLabels: Record<string, string> = {
  Pending: 'Bekliyor',
  Paid: 'Ödendi',
  Applied: 'Mahsup Edildi',
  Refunded: 'İade Edildi',
  Cancelled: 'İptal Edildi',
  Forfeited: 'Hak Edildi',
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-700',
  Paid: 'bg-green-100 text-green-700',
  Applied: 'bg-blue-100 text-blue-700',
  Refunded: 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-gray-100 text-gray-500',
  Forfeited: 'bg-red-100 text-red-700',
}

export function DepositsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState({ appointmentId: '', amount: 0, paymentMethod: 'CreditCard', notes: '' })

  const { data, isLoading } = useDeposits({
    pageNumber: page,
    pageSize: 20,
    status: statusFilter || undefined,
  })
  const createMutation = useCreateDeposit()
  const applyMutation = useApplyDeposit()
  const refundMutation = useRefundDeposit()
  const cancelMutation = useCancelDeposit()
  const forfeitMutation = useForfeitDeposit()
  const { data: appointmentsData } = useAppointments({ pageSize: 50 })
  const deposits = data?.items ?? []

  async function handleCreate() {
    await createMutation.mutateAsync(form)
    setShowCreateModal(false)
    setForm({ appointmentId: '', amount: 0, paymentMethod: 'CreditCard', notes: '' })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kapora Yönetimi</h1>
          <p className="text-sm text-gray-500">Kapora/depozito takibi, iade ve mahsup işlemleri</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Yeni Kapora
        </button>
      </div>

      <div className="relative">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Toplam Kapora', value: data?.totalCount ?? 0, icon: '💰' },
          { label: 'Tahsil Edilen', value: deposits.filter(d => d.status === 'Paid').length, icon: '✅' },
          { label: 'İade Edilen', value: deposits.filter(d => d.status === 'Refunded').length, icon: '↩️' },
          { label: 'Hak Edilen', value: deposits.filter(d => d.status === 'Forfeited').length, icon: '🔥' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl">{stat.icon}</div>
            <div className="mt-1 text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Müşteri</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Hizmet</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tutar</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ödeme Yöntemi</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tarih</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {deposits.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Kapora bulunamadı</td></tr>
              ) : deposits.map(d => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.customerName}</td>
                  <td className="px-4 py-3 text-gray-600">{d.serviceName}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(d.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[d.status] || ''}`}>
                      {statusLabels[d.status] || d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.paymentMethod}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(d.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {d.status === 'Paid' && (
                        <>
                          <button onClick={() => applyMutation.mutate(d.id)} className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50">Mahsup Et</button>
                          <button onClick={() => refundMutation.mutate(d.id)} className="rounded-md px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50">İade</button>
                          <button onClick={() => forfeitMutation.mutate(d.id)} className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Hak Et</button>
                        </>
                      )}
                      {d.status === 'Pending' && (
                        <button onClick={() => cancelMutation.mutate(d.id)} className="rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100">İptal</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data?.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">Yeni Kapora</h2>
              <button onClick={() => setShowCreateModal(false)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-3 px-6 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Randevu</label>
                <select
                  value={form.appointmentId}
                  onChange={e => setForm(f => ({ ...f, appointmentId: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Seçiniz</option>
                  {(appointmentsData?.items ?? []).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.customerName} - {a.serviceName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Tutar (₺)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Ödeme Yöntemi</label>
                <select
                  value={form.paymentMethod}
                  onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="CreditCard">Kredi Kartı</option>
                  <option value="Cash">Nakit</option>
                  <option value="EFT">EFT/Havale</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Not</label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="İsteğe bağlı"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setShowCreateModal(false)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button
                onClick={handleCreate}
                disabled={!form.appointmentId || form.amount <= 0 || createMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
