import { useState } from 'react'
import { Plus, Edit2, DollarSign, Loader2, AlertCircle, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  useDebts, useCreateDebt, useUpdateDebt, usePayDebt, useDeleteDebt,
  type DebtRecord, type DebtCategory, type DebtStatus,
} from '@/hooks/useDebts'

const statusLabel: Record<DebtStatus, string> = {
  open: 'Açık', partiallyPaid: 'Kısmi Ödendi', paid: 'Ödendi', overdue: 'Gecikmiş',
}
const statusColor: Record<DebtStatus, string> = {
  open: 'bg-blue-100 text-blue-700', partiallyPaid: 'bg-amber-100 text-amber-700',
  paid: 'bg-green-100 text-green-700', overdue: 'bg-red-100 text-red-700',
}
const categoryLabel: Record<DebtCategory, string> = {
  supplier: 'Tedarikçi', rent: 'Kira', equipment: 'Ekipman', loan: 'Kredi', tax: 'Vergi', other: 'Diğer',
}

type DebtForm = {
  id?: string
  title: string
  creditorName: string
  totalAmount: string
  dueDate: string
  category: DebtCategory
  description: string
}

const emptyForm: DebtForm = { title: '', creditorName: '', totalAmount: '', dueDate: '', category: 'supplier', description: '' }

export function DebtPage() {
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<{ open: boolean; form: DebtForm } | null>(null)
  const [payModal, setPayModal] = useState<{ id: string; max: number } | null>(null)
  const [deleteDebtId, setDeleteDebtId] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [errors, setErrors] = useState<{ title?: string; totalAmount?: string; dueDate?: string }>({})

  const { data, isLoading } = useDebts({ pageSize: 50, search: search || undefined })
  const createMutation = useCreateDebt()
  const updateMutation = useUpdateDebt()
  const payMutation = usePayDebt()
  const deleteMutation = useDeleteDebt()

  const debts = data?.items ?? []
  const totalOpen = debts.filter(d => d.status !== 'paid').reduce((s, d) => s + d.remainingAmount, 0)

  function openEdit(d: DebtRecord) {
    setModal({ open: true, form: {
      id: d.id, title: d.title, creditorName: d.creditorName ?? '',
      totalAmount: String(d.totalAmount), dueDate: d.dueDate,
      category: d.category, description: d.description ?? '',
    }})
    setErrors({})
  }

  function validate(f: DebtForm) {
    const e: { title?: string; totalAmount?: string; dueDate?: string } = {}
    if (!f.title.trim()) e.title = 'Bu bölüm boş bırakılamaz.'
    if (!f.totalAmount) e.totalAmount = 'Bu bölüm boş bırakılamaz.'
    else if (Number(f.totalAmount) <= 0) e.totalAmount = 'Tutar sıfırdan büyük olmalı.'
    if (!f.dueDate) e.dueDate = 'Bu bölüm boş bırakılamaz.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!modal) return
    const f = modal.form
    if (!validate(f)) return
    const payload = {
      title: f.title, totalAmount: Number(f.totalAmount), dueDate: f.dueDate,
      category: f.category, creditorName: f.creditorName || null, description: f.description || null,
    }
    if (f.id) {
      await updateMutation.mutateAsync({ id: f.id, ...payload })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setModal(null)
  }

  async function pay() {
    if (!payModal) return
    await payMutation.mutateAsync({ id: payModal.id, amount: Number(payAmount) })
    setPayModal(null)
    setPayAmount('')
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Borç & Ödeme Takibi</h1>
          <p className="hidden text-sm text-gray-500 lg:block">İşletme borçlarını ve ödeme planlarını yönetin</p>
        </div>
        <button onClick={() => { setModal({ open: true, form: { ...emptyForm } }); setErrors({}) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} />
          <span className="hidden lg:inline">Yeni Borç</span>
          <span className="lg:hidden">Ekle</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative max-w-xs flex-1">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Borç ara..." className="pl-3 pr-3 py-2 border rounded-lg text-sm w-full" />
        </div>
        {totalOpen > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-700">Toplam borç: {formatCurrency(totalOpen)}</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
        ) : debts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <DollarSign size={40} className="mx-auto mb-2 opacity-40" />
            <p>Henüz borç kaydı yok</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Başlık</th>
                <th className="px-4 py-3 text-left">Alacaklı</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-right">Toplam</th>
                <th className="px-4 py-3 text-right">Ödenen</th>
                <th className="px-4 py-3 text-right">Kalan</th>
                <th className="px-4 py-3 text-center">Vade</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {debts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.title}</td>
                  <td className="px-4 py-3 text-gray-500">{d.creditorName ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{categoryLabel[d.category]}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(d.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-green-600">{formatCurrency(d.paidAmount)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(d.remainingAmount)}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{d.dueDate}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[d.status]}`}>
                      {statusLabel[d.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(d)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                      {d.status !== 'paid' && (
                        <button onClick={() => { setPayModal({ id: d.id, max: d.remainingAmount }); setPayAmount(String(d.remainingAmount)) }}
                          className="p-1.5 hover:bg-green-50 text-green-600 rounded"><DollarSign size={14} /></button>
                      )}
                      <button onClick={() => setDeleteDebtId(d.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded" title="Sil">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b"><h2 className="font-semibold text-lg">{modal.form.id ? 'Borç Düzenle' : 'Yeni Borç'}</h2></div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Başlık *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.title}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, title: e.target.value } })} />
                {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tutar *</label>
                <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.totalAmount}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, totalAmount: e.target.value } })} />
                {errors.totalAmount && <div className="text-xs text-red-500 mt-1">{errors.totalAmount}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vade *</label>
                <input type="date" className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.dueDate}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, dueDate: e.target.value } })} />
                {errors.dueDate && <div className="text-xs text-red-500 mt-1">{errors.dueDate}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.category}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, category: e.target.value as DebtCategory } })}>
                  {Object.entries(categoryLabel).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alacaklı</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.creditorName}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, creditorName: e.target.value } })} />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button onClick={save} disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />} Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Ödeme Ekle</h3>
            <label className="block text-sm text-gray-600 mb-1">Ödeme Tutarı (Maks: {formatCurrency(payModal.max)})</label>
            <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm mb-4" value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setPayModal(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button onClick={pay} disabled={payMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50">
                Ödendi İşaretle
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDebtId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Borç kaydı silinsin mi?</h3>
            <p className="text-sm text-gray-600 mb-4">Bu borç kaydını kalıcı olarak silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteDebtId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button
                onClick={async () => {
                  await deleteMutation.mutateAsync(deleteDebtId)
                  setDeleteDebtId(null)
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
