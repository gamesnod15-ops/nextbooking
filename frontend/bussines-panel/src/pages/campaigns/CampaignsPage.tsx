import { useState } from 'react'
import { Plus, Edit2, Trash2, Tag, X, Calendar, Percent, Users, Loader2 } from 'lucide-react'
import { formatDate, toLocalDateStr, futureLocalDateStr } from '@/lib/utils'
import {
  useCampaigns,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
  type Campaign,
  type CampaignStatus,
} from '@/hooks/useMarketingData'

type CampaignForm = {
  id?: string
  name: string
  description: string
  discountType: 'percentage' | 'fixedAmount'
  discountValue: number
  startDate: string
  endDate: string
  status: CampaignStatus
  usageLimit: number | null
  applicableServiceIds: string[]
}

const emptyForm: CampaignForm = {
  name: '', description: '', discountType: 'percentage', discountValue: 10,
  startDate: toLocalDateStr(),
  endDate: futureLocalDateStr(30),
  status: 'active', usageLimit: null, applicableServiceIds: []
}

export function CampaignsPage() {
  const [modal, setModal] = useState<{ open: boolean; form: CampaignForm } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ name?: string }>({})

  const { data, isLoading } = useCampaigns({ pageNumber: 1, pageSize: 50 })
  const createMutation = useCreateCampaign()
  const updateMutation = useUpdateCampaign()
  const deleteMutation = useDeleteCampaign()

  const campaigns = data?.items ?? []
  const isInvalidDateRange = !!modal?.form.startDate && !!modal?.form.endDate && modal.form.endDate < modal.form.startDate

  function openAdd() { setModal({ open: true, form: { ...emptyForm } }); setFormErrors({}) }
  function openEdit(c: Campaign) {
    setModal({ open: true, form: { id: c.id, name: c.name, description: c.description ?? '', discountType: c.discountType, discountValue: c.discountValue, startDate: c.startDate.slice(0, 10), endDate: c.endDate.slice(0, 10), status: c.status, usageLimit: c.usageLimit, applicableServiceIds: c.applicableServiceIds } })
    setFormErrors({})
  }

  async function save() {
    if (!modal) return
    const f = modal.form
    const e: { name?: string } = {}
    if (!f.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    setFormErrors(e)
    if (Object.keys(e).length > 0) return
    if (f.endDate < f.startDate) return
    const payload = { name: f.name, description: f.description || null, discountType: f.discountType, discountValue: f.discountValue, startDate: f.startDate, endDate: f.endDate, status: f.status, usageLimit: f.usageLimit, applicableServiceIds: f.applicableServiceIds }
    if (f.id) {
      await updateMutation.mutateAsync({ id: f.id, ...payload, usageCount: 0, createdAt: '' })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setModal(null)
  }

  async function confirmDelete() {
    if (deleteId) await deleteMutation.mutateAsync(deleteId)
    setDeleteId(null)
  }

  const active = campaigns.filter(c => c.status === 'active').length
  const totalUsage = campaigns.reduce((a, c) => a + c.usageCount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kampanyalar</h1>
          <p className="hidden text-sm text-gray-500 lg:block">Müşteri kampanyalarını ve indirimlerini yönetin</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Yeni Kampanya
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Toplam Kampanya', value: campaigns.length, icon: <Tag className="h-5 w-5" /> },
          { label: 'Aktif', value: active, icon: <Percent className="h-5 w-5" /> },
          { label: 'Toplam Kullanım', value: totalUsage, icon: <Users className="h-5 w-5" /> },
          { label: 'Pasif/Biten', value: campaigns.length - active, icon: <Calendar className="h-5 w-5" /> },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">{stat.icon}</div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign cards */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-3">
          {campaigns.map(c => {
            const progress = c.usageLimit ? (c.usageCount / c.usageLimit) * 100 : 0
            const expired = new Date(c.endDate) < new Date()
            return (
              <div key={c.id} className={`rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${c.status !== 'active' || expired ? 'opacity-70' : ''}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                      <Tag className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{c.name}</span>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {c.discountType === 'percentage' ? 'Yüzde' : 'Sabit Tutar'}
                        </span>
                        {expired && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">Süresi Doldu</span>}
                        {c.status !== 'active' && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">{c.status}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right mr-2">
                      <div className="text-lg font-bold text-gray-900">
                        {c.discountType === 'percentage' ? `%${c.discountValue}` : `₺${c.discountValue}`}
                      </div>
                    </div>
                    <button onClick={() => openEdit(c)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(c.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <div><span className="font-medium text-gray-700">Başlangıç:</span> {formatDate(c.startDate)}</div>
                  <div><span className="font-medium text-gray-700">Bitiş:</span> {formatDate(c.endDate)}</div>
                  {c.usageLimit && (
                    <div>
                      <span className="font-medium text-gray-700">Kullanım: </span>{c.usageCount}/{c.usageLimit}
                      <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {campaigns.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">Henüz kampanya eklenmedi</div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{modal.form.id ? 'Kampanya Düzenle' : 'Yeni Kampanya'}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Kampanya Adı *</label>
                <input value={modal.form.name} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, name: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                {formErrors.name && <div className="text-xs text-red-500 mt-1">{formErrors.name}</div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">İndirim Tipi</label>
                  <select value={modal.form.discountType} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, discountType: e.target.value as 'percentage' | 'fixedAmount' } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixedAmount">Sabit Tutar (₺)</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">İndirim Değeri</label>
                  <input type="number" value={modal.form.discountValue} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, discountValue: Number(e.target.value) } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Başlangıç</label>
                  <input type="date" value={modal.form.startDate} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, startDate: e.target.value } }))} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isInvalidDateRange ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/30'}`} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Bitiş</label>
                  <input type="date" value={modal.form.endDate} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, endDate: e.target.value } }))} className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${isInvalidDateRange ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/30'}`} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Durum</label>
                  <select value={modal.form.status} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, status: e.target.value as CampaignStatus } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option value="draft">Taslak</option>
                    <option value="active">Aktif</option>
                    <option value="paused">Duraklatıldı</option>
                    <option value="ended">Bitti</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Kullanım Limiti</label>
                  <input type="number" value={modal.form.usageLimit ?? ''} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, usageLimit: e.target.value ? Number(e.target.value) : null } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Limitsiz" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Açıklama</label>
                <textarea value={modal.form.description} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, description: e.target.value } }))} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              {isInvalidDateRange && (
                <p className="text-xs font-medium text-red-600">Bitiş tarihi başlangıç tarihinden önce olamaz.</p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button onClick={save} disabled={isInvalidDateRange || createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto"><Trash2 className="h-5 w-5 text-red-500" /></div>
            <h3 className="mt-3 text-center text-base font-bold text-gray-900">Kampanyayı Sil</h3>
            <p className="mt-1 text-center text-sm text-gray-500">Bu kampanya kalıcı olarak silinecek.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">İptal</button>
              <button onClick={confirmDelete} disabled={deleteMutation.isPending} className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

