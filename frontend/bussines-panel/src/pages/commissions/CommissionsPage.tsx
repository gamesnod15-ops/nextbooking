import { useState } from 'react'
import { Plus, CheckCircle, Clock, DollarSign, Loader2, Award, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  useCommissions, useCreateCommission, useApproveCommission, usePayCommission, useDeleteCommission,
  type CommissionType, type CommissionStatus,
} from '@/hooks/useCommissions'
import { useEmployees } from '@/hooks/useEmployees'

const statusLabel: Record<CommissionStatus, string> = { pending: 'Bekliyor', approved: 'Onaylandı', paid: 'Ödendi' }
const statusColor: Record<CommissionStatus, string> = {
  pending: 'bg-amber-100 text-amber-700', approved: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700',
}
const typeLabel: Record<CommissionType, string> = { service: 'Hizmet', sales: 'Satış', mixed: 'Karma' }

function getCurrentPeriod() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function CommissionsPage() {
  const [period, setPeriod] = useState(getCurrentPeriod())
  const [showModal, setShowModal] = useState(false)
  const [deleteCommissionId, setDeleteCommissionId] = useState<string | null>(null)
  const [form, setForm] = useState({
    employeeId: '', employeeName: '', period: getCurrentPeriod(),
    type: 'service' as CommissionType, baseAmount: '', commissionRate: '10',
    bonusAmount: '0', notes: '',
  })
  const [formErrors, setFormErrors] = useState<{ employeeId?: string; baseAmount?: string }>({})

  const { data, isLoading } = useCommissions({ period: period || undefined })
  const { data: empData } = useEmployees()
  const createMutation = useCreateCommission()
  const approveMutation = useApproveCommission()
  const payMutation = usePayCommission()
  const deleteMutation = useDeleteCommission()

  const commissions = data?.items ?? []
  const employees = empData?.items ?? []
  const totalPrim = commissions.reduce((s, c) => s + c.totalAmount, 0)

  async function save() {
    const e: { employeeId?: string; baseAmount?: string } = {}
    if (!form.employeeId) e.employeeId = 'Bu bölüm boş bırakılamaz.'
    if (!form.baseAmount) e.baseAmount = 'Bu bölüm boş bırakılamaz.'
    setFormErrors(e)
    if (Object.keys(e).length > 0) return
    const emp = employees.find((e) => e.id === form.employeeId)
    await createMutation.mutateAsync({
      employeeId: form.employeeId, employeeName: emp?.name ?? form.employeeName,
      period: form.period, type: form.type, baseAmount: Number(form.baseAmount),
      commissionRate: Number(form.commissionRate), bonusAmount: Number(form.bonusAmount),
      notes: form.notes || undefined,
    })
    setShowModal(false)
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Prim & Hak Ediş Takibi</h1>
          <p className="hidden text-sm text-gray-500 lg:block">Personel prim ve komisyon ödemelerini yönetin</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Yeni Prim
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Dönem</label>
          <input type="month" className="border rounded-lg px-3 py-2 text-sm" value={period}
            onChange={(e) => setPeriod(e.target.value)} />
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <Award size={16} className="text-purple-600" />
          <span className="text-sm font-medium text-purple-700">Dönem toplamı: {formatCurrency(totalPrim)}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <DollarSign size={40} className="mx-auto mb-2 opacity-40" />
            <p>Bu dönem için kayıt yok</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Personel</th>
                <th className="px-4 py-3 text-left">Tür</th>
                <th className="px-4 py-3 text-right">Baz Tutar</th>
                <th className="px-4 py-3 text-right">Oran</th>
                <th className="px-4 py-3 text-right">Komisyon</th>
                <th className="px-4 py-3 text-right">Prim</th>
                <th className="px-4 py-3 text-right">Toplam</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.employeeName}</td>
                  <td className="px-4 py-3 text-gray-500">{typeLabel[c.type]}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.baseAmount)}</td>
                  <td className="px-4 py-3 text-right">%{c.commissionRate}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.commissionAmount)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(c.bonusAmount)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(c.totalAmount)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[c.status]}`}>
                      {statusLabel[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {c.status === 'pending' && (
                        <button onClick={() => approveMutation.mutate(c.id)}
                          className="p-1.5 hover:bg-blue-50 text-blue-600 rounded text-xs" title="Onayla">
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {c.status === 'approved' && (
                        <button onClick={() => payMutation.mutate(c.id)}
                          className="p-1.5 hover:bg-green-50 text-green-600 rounded text-xs" title="Ödendi işaretle">
                          <Clock size={14} />
                        </button>
                      )}
                      <button onClick={() => setDeleteCommissionId(c.id)} className="p-1.5 hover:bg-red-50 text-red-600 rounded text-xs" title="Sil">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b"><h2 className="font-semibold text-lg">Yeni Prim Kaydı</h2></div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Personel *</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.employeeId}
                  onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                  <option value="">Seçin...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
                {formErrors.employeeId && <div className="text-xs text-red-500 mt-1">{formErrors.employeeId}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dönem</label>
                <input type="month" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tür</label>
                <select className="w-full border rounded-lg px-3 py-2 text-sm" value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as CommissionType })}>
                  <option value="service">Hizmet</option>
                  <option value="sales">Satış</option>
                  <option value="mixed">Karma</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Baz Tutar</label>
                <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.baseAmount}
                  onChange={(e) => setForm({ ...form, baseAmount: e.target.value })} />
                {formErrors.baseAmount && <div className="text-xs text-red-500 mt-1">{formErrors.baseAmount}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Komisyon Oranı (%)</label>
                <input type="number" step="0.1" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.commissionRate}
                  onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ekstra Prim</label>
                <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={form.bonusAmount}
                  onChange={(e) => setForm({ ...form, bonusAmount: e.target.value })} />
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

      {deleteCommissionId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Prim kaydı silinsin mi?</h3>
            <p className="text-sm text-gray-600 mb-4">Bu prim kaydını kalıcı olarak silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteCommissionId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button
                onClick={async () => {
                  await deleteMutation.mutateAsync(deleteCommissionId)
                  setDeleteCommissionId(null)
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
