import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Phone, Mail, Calendar, X, Loader2 } from 'lucide-react'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { formatDate, formatCurrency } from '@/lib/utils'
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
  type Customer,
} from '@/hooks/useCustomers'

type CustomerForm = {
  id?: string
  name: string
  phone: string
  email: string
  notes: string
  birthDate: string
  isBlocked: boolean
}

const emptyForm: CustomerForm = {
  name: '', phone: '', email: '', notes: '', birthDate: '', isBlocked: false,
}

export function CustomersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; form: CustomerForm } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({})

  const { data, isLoading } = useCustomers({ pageNumber: page, pageSize: 20, search: search || undefined })
  const createMutation = useCreateCustomer()
  const updateMutation = useUpdateCustomer()
  const deleteMutation = useDeleteCustomer()

  const customers = data?.items ?? []

  function openAdd() { setModal({ open: true, form: { ...emptyForm } }); setErrors({}) }
  function openEdit(c: Customer) {
    setModal({ open: true, form: { id: c.id, name: c.name, phone: c.phone, email: c.email ?? '', notes: c.notes ?? '', birthDate: c.birthDate?.slice(0, 10) ?? '', isBlocked: c.isBlocked } })
    setErrors({})
  }

  function validate(f: CustomerForm) {
    const e: { name?: string; phone?: string; email?: string } = {}
    if (!f.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    if (!f.phone) e.phone = 'Bu bölüm boş bırakılamaz.'
    else if (!/^\+905\d{9}$/.test(f.phone)) e.phone = 'Telefon formatı: +90 5XX XXX XX XX'
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Geçerli bir e-posta girin.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!modal) return
    const f = modal.form
    if (!validate(f)) return
    const payload = { name: f.name, phone: f.phone, email: f.email || null, notes: f.notes || null, birthDate: f.birthDate || null }
    if (f.id) {
      await updateMutation.mutateAsync({ id: f.id, ...payload, isBlocked: f.isBlocked })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setModal(null)
  }

  async function confirmDelete() {
    if (deleteId) await deleteMutation.mutateAsync(deleteId)
    setDeleteId(null)
  }

  const detail = detailId ? customers.find(c => c.id === detailId) : null

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Müşteriler</h1>
          <p className="text-sm text-gray-500">Müşteri veritabanınızı yönetin</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Müşteri Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Toplam Müşteri', value: data?.totalCount ?? 0 },
          { label: 'Bu Sayfada', value: customers.length },
          { label: 'Ort. Ziyaret', value: customers.length ? (customers.reduce((a, c) => a + c.totalVisits, 0) / customers.length).toFixed(1) : '0' },
          { label: 'Top. Gelir', value: formatCurrency(customers.reduce((a, c) => a + c.totalSpent, 0)) },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="İsim, telefon veya e-posta ara..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Müşteri</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">İletişim</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Ziyaret</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 md:table-cell">Harcama</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Son Ziyaret</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Müşteri bulunamadı</td></tr>
              ) : customers.map(cust => (
                <tr key={cust.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailId(cust.id)} className="text-left hover:underline">
                      <div className="font-medium text-gray-900">{cust.name}</div>
                      {cust.isBlocked && <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs text-red-700">Engelli</span>}
                    </button>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3 w-3" /> {cust.phone}</div>
                    {cust.email && <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400"><Mail className="h-3 w-3" /> {cust.email}</div>}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{cust.totalVisits}</td>
                  <td className="hidden px-4 py-3 font-semibold text-gray-800 md:table-cell">{formatCurrency(cust.totalSpent)}</td>
                  <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">
                    {cust.lastVisitAt ? <div className="flex items-center gap-1.5 text-xs"><Calendar className="h-3.5 w-3.5" />{formatDate(cust.lastVisitAt)}</div> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(cust)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setDeleteId(cust.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
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

      {/* Detail Drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setDetailId(null)}>
          <div className="w-full max-w-sm bg-white shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900">Müşteri Detayı</h2>
              <button onClick={() => setDetailId(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                  {detail.name.split(' ').map(p => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-base font-bold text-gray-900">{detail.name}</div>
                  {detail.isBlocked && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Engelli</span>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900">{detail.totalVisits}</div>
                  <div className="text-xs text-gray-500">Toplam Ziyaret</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(detail.totalSpent)}</div>
                  <div className="text-xs text-gray-500">Toplam Harcama</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 shrink-0 text-gray-400" />{detail.phone}</div>
                {detail.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 shrink-0 text-gray-400" />{detail.email}</div>}
                {detail.lastVisitAt && <div className="flex items-center gap-2 text-gray-600"><Calendar className="h-4 w-4 shrink-0 text-gray-400" />Son ziyaret: {formatDate(detail.lastVisitAt)}</div>}
              </div>
              {detail.notes && (
                <div className="rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800 border border-yellow-100">
                  <span className="font-medium">Not: </span>{detail.notes}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button onClick={() => { openEdit(detail); setDetailId(null) }} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">Düzenle</button>
                <button onClick={() => { setDeleteId(detail.id); setDetailId(null) }} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{modal.form.id ? 'Müşteri Düzenle' : 'Yeni Müşteri Ekle'}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Ad Soyad *</label>
                  <input value={modal.form.name} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, name: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ad Soyad" />
                  {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Telefon *</label>
                  <PhoneInput value={modal.form.phone} onChange={v => setModal(m => m && ({ ...m, form: { ...m.form, phone: v } }))} />
                  {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">E-posta</label>
                  <input value={modal.form.email} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, email: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="email@ornek.com" />
                  {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Not</label>
                  <textarea value={modal.form.notes} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, notes: e.target.value } }))} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Müşteri hakkında notlar..." />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button
                onClick={save}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto"><Trash2 className="h-5 w-5 text-red-500" /></div>
            <h3 className="mt-3 text-center text-base font-bold text-gray-900">Müşteriyi Sil</h3>
            <p className="mt-1 text-center text-sm text-gray-500">Bu müşteri kalıcı olarak silinecek. Emin misiniz?</p>
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
