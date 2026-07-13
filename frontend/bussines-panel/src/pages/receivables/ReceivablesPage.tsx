import { useState } from 'react'
import { Plus, Search, CreditCard, CheckCircle, Clock, ChevronDown, ChevronUp, Loader2, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  useReceivables, useCreateReceivable, usePayInstallment, useDeleteReceivable,
  type ReceivableStatus,
} from '@/hooks/useReceivables'
import { PhoneInput } from '@/components/ui/PhoneInput'

const statusLabel: Record<ReceivableStatus, string> = {
  open: 'Açık', partiallyPaid: 'Kısmi Ödendi', paid: 'Ödendi', overdue: 'Gecikmiş',
}
const statusColor: Record<ReceivableStatus, string> = {
  open: 'bg-blue-100 text-blue-700', partiallyPaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
}

export function ReceivablesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'open' | 'closed'>('open')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteReceivableId, setDeleteReceivableId] = useState<string | null>(null)
  const [form, setForm] = useState({
    customerName: '', totalAmount: '', dueDate: '', installmentCount: '1',
    customerPhone: '', description: '',
  })
  const [formErrors, setFormErrors] = useState<{ customerName?: string; totalAmount?: string; dueDate?: string; customerPhone?: string }>({})

  const { data, isLoading } = useReceivables({ pageNumber: page, pageSize: 100, search: search || undefined })
  const createMutation = useCreateReceivable()
  const payMutation = usePayInstallment()
  const deleteMutation = useDeleteReceivable()

  const allReceivables = data?.items ?? []
  const receivables = activeTab === 'open'
    ? allReceivables.filter(r => r.status !== 'paid')
    : allReceivables.filter(r => r.status === 'paid')

  async function save() {
    const e: { customerName?: string; totalAmount?: string; dueDate?: string; customerPhone?: string } = {}
    if (!form.customerName.trim()) e.customerName = 'Bu bölüm boş bırakılamaz.'
    if (!form.totalAmount) e.totalAmount = 'Bu bölüm boş bırakılamaz.'
    else if (Number(form.totalAmount) <= 0) e.totalAmount = 'Tutar sıfırdan büyük olmalı.'
    if (!form.dueDate) e.dueDate = 'Bu bölüm boş bırakılamaz.'
    if (form.customerPhone && !/^\+905\d{9}$/.test(form.customerPhone)) e.customerPhone = 'Telefon formatı: +90 5XX XXX XX XX'
    setFormErrors(e)
    if (Object.keys(e).length > 0) return
    await createMutation.mutateAsync({
      customerName: form.customerName,
      totalAmount: Number(form.totalAmount),
      dueDate: form.dueDate,
      installmentCount: Number(form.installmentCount),
      customerPhone: form.customerPhone || undefined,
      description: form.description || undefined,
    })
    setShowModal(false)
    setForm({ customerName: '', totalAmount: '', dueDate: '', installmentCount: '1', customerPhone: '', description: '' })
    setFormErrors({})
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cari Alacak & Taksit Takibi</h1>
          <p className="text-sm text-gray-500">Müşteri alacaklarını ve taksit ödemelerini takip edin</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Yeni Alacak
        </button>
      </div>

      <div className="relative max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Müşteri ara..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full" />
      </div>

      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('open')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'open' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Aktif Alacaklar
        </button>
        <button
          onClick={() => setActiveTab('closed')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'closed' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Kapanan Alacaklar
        </button>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
        ) : receivables.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CreditCard size={40} className="mx-auto mb-2 opacity-40" />
            <p>Henüz alacak kaydı yok</p>
          </div>
        ) : (
          <div className="divide-y">
            {receivables.map((r) => (
              <div key={r.id}>
                <div className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="font-medium">{r.customerName}</div>
                    {r.customerPhone && <div className="text-xs text-gray-400">{r.customerPhone}</div>}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(r.totalAmount)}</div>
                    <div className="text-xs text-gray-400">Kalan: {formatCurrency(r.remainingAmount)}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[r.status]}`}>
                    {statusLabel[r.status]}
                  </span>
                  <div className="text-xs text-gray-400">{r.dueDate}</div>
                  <button onClick={() => setDeleteReceivableId(r.id)} className="p-1 hover:bg-red-50 text-red-600 rounded" title="Sil">
                    <Trash2 size={14} />
                  </button>
                  {r.installmentCount > 1 && (
                    <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500">
                      {expandedId === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  )}
                </div>
                {expandedId === r.id && r.installments.length > 0 && (
                  <div className="bg-gray-50 px-8 py-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Taksitler</p>
                    {r.installments.map((inst) => (
                      <div key={inst.id} className="flex items-center gap-3 text-sm">
                        <span className="w-6 text-gray-400 text-xs">{inst.number}.</span>
                        <span className="flex-1">{formatCurrency(inst.amount)}</span>
                        <span className="text-gray-400">{inst.dueDate}</span>
                        {inst.isPaid ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={12} /> Ödendi</span>
                        ) : (
                          <button onClick={() => payMutation.mutate(inst.id)}
                            disabled={payMutation.isPending}
                            className="flex items-center gap-1 text-blue-600 text-xs hover:underline">
                            <Clock size={12} /> Öde
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b"><h2 className="font-semibold text-lg">Yeni Alacak Kaydı</h2></div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Müşteri Adı *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
                {formErrors.customerName && <div className="text-xs text-red-500 mt-1">{formErrors.customerName}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Toplam Tutar *</label>
                <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.totalAmount}
                  onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
                {formErrors.totalAmount && <div className="text-xs text-red-500 mt-1">{formErrors.totalAmount}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vade Tarihi *</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
                {formErrors.dueDate && <div className="text-xs text-red-500 mt-1">{formErrors.dueDate}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Taksit Sayısı</label>
                <input type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.installmentCount}
                  onChange={(e) => setForm({ ...form, installmentCount: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <PhoneInput value={form.customerPhone} onChange={(v) => setForm({ ...form, customerPhone: v })} />
                {formErrors.customerPhone && <div className="text-xs text-red-500 mt-1">{formErrors.customerPhone}</div>}
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button onClick={save} disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteReceivableId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Alacak kaydı silinsin mi?</h3>
            <p className="text-sm text-gray-600 mb-4">Bu alacak ve varsa tüm taksit kayıtları silinecek. Devam edilsin mi?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteReceivableId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button
                onClick={async () => {
                  await deleteMutation.mutateAsync(deleteReceivableId)
                  setDeleteReceivableId(null)
                  if (expandedId === deleteReceivableId) setExpandedId(null)
                }}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
