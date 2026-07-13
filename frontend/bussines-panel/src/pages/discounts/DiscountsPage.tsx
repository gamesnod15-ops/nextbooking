import { useState } from 'react'
import { Plus, Edit2, Trash2, Percent, X, Search, Tag, Users, Loader2 } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  type Coupon,
} from '@/hooks/useMarketingData'

type CouponForm = {
  id?: string
  code: string
  description: string
  discountType: 'percentage' | 'fixedAmount'
  discountValue: number
  minimumOrderAmount: number | null
  expiresAt: string
  usageLimit: number | null
  isActive: boolean
}

const emptyForm: CouponForm = {
  code: '', description: '', discountType: 'percentage', discountValue: 10,
  minimumOrderAmount: null, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  usageLimit: null, isActive: true,
}

function generateCode() {
  return Math.random().toString(36).toUpperCase().slice(2, 10)
}

export function DiscountsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; form: CouponForm } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useCoupons({
    pageNumber: page,
    pageSize: 20,
    search: search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  })
  const createMutation = useCreateCoupon()
  const updateMutation = useUpdateCoupon()
  const deleteMutation = useDeleteCoupon()

  const coupons = data?.items ?? []

  function openAdd() {
    setModal({ open: true, form: { ...emptyForm, code: generateCode() } })
  }
  function openEdit(c: Coupon) {
    setModal({ open: true, form: { id: c.id, code: c.code, description: c.description ?? '', discountType: c.discountType, discountValue: c.discountValue, minimumOrderAmount: c.minimumOrderAmount, expiresAt: c.expiresAt?.slice(0, 10) ?? '', usageLimit: c.usageLimit, isActive: c.isActive } })
  }

  async function save() {
    if (!modal) return
    const f = modal.form
    const payload = { code: f.code.toUpperCase(), description: f.description || null, discountType: f.discountType, discountValue: f.discountValue, minimumOrderAmount: f.minimumOrderAmount, expiresAt: f.expiresAt || null, usageLimit: f.usageLimit, isActive: f.isActive, applicableServiceIds: [] }
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">İndirimler</h1>
          <p className="text-sm text-gray-500">İndirim kodları ve promosyonları yönetin</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Yeni İndirim
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Toplam Kupon', value: data?.totalCount ?? 0, icon: <Tag className="h-5 w-5" /> },
          { label: 'Aktif', value: coupons.filter(c => c.isActive).length, icon: <Percent className="h-5 w-5" /> },
          { label: 'Toplam Kullanım', value: coupons.reduce((a, c) => a + c.usageCount, 0), icon: <Users className="h-5 w-5" /> },
          { label: 'Pasif', value: coupons.filter(c => !c.isActive).length, icon: <Percent className="h-5 w-5" /> },
        ].map(stat => (
          <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{stat.icon}</div>
            <div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Kupon adı veya kodu ara..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => { setStatusFilter(f); setPage(1) }} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${statusFilter === f ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : 'Pasif'}
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
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">İndirim</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kod</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">Değer</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Kullanım</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Bitiş</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Durum</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {coupons.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Kupon bulunamadı</td></tr>
              ) : coupons.map(coupon => (
                <tr key={coupon.id} className={`hover:bg-gray-50 transition-colors ${!coupon.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{coupon.description || coupon.code}</div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-bold text-gray-700 tracking-wider">{coupon.code}</code>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-sm font-bold text-green-700">
                      {coupon.discountType === 'percentage' ? `%${coupon.discountValue}` : formatCurrency(coupon.discountValue)}
                    </span>
                    {coupon.minimumOrderAmount && <div className="text-xs text-gray-400 mt-0.5">Min. {formatCurrency(coupon.minimumOrderAmount)}</div>}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className="text-sm font-medium text-gray-700">{coupon.usageCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</div>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell text-xs text-gray-500">
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : 'Süresiz'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {coupon.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(coupon)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(coupon.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Modal */}
      {modal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{modal.form.id ? 'Kupon Düzenle' : 'Yeni Kupon'}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Kupon Kodu</label>
                  <input value={modal.form.code} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, code: e.target.value.toUpperCase() } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="KUPON20" />
                </div>
                <div className="flex items-end">
                  <button onClick={() => setModal(m => m && ({ ...m, form: { ...m.form, code: generateCode() } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">Otomatik Oluştur</button>
                </div>
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
                  <label className="mb-1 block text-xs font-medium text-gray-700">Min. Sipariş (₺)</label>
                  <input type="number" value={modal.form.minimumOrderAmount ?? ''} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, minimumOrderAmount: e.target.value ? Number(e.target.value) : null } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Zorunlu değil" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Bitiş Tarihi</label>
                  <input type="date" value={modal.form.expiresAt} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, expiresAt: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Kullanım Limiti</label>
                  <input type="number" value={modal.form.usageLimit ?? ''} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, usageLimit: e.target.value ? Number(e.target.value) : null } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Limitsiz" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="couponActive" checked={modal.form.isActive} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, isActive: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="couponActive" className="text-sm text-gray-700">Aktif</label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Açıklama</label>
                <textarea value={modal.form.description} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, description: e.target.value } }))} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button onClick={save} disabled={!modal.form.code || createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
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
            <h3 className="mt-3 text-center text-base font-bold text-gray-900">Kuponu Sil</h3>
            <p className="mt-1 text-center text-sm text-gray-500">Bu kupon kalıcı olarak silinecek.</p>
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
