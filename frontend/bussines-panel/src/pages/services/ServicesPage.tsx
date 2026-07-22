import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Clock, X, Loader2, ChevronDown } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import {
  useServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  type Service,
} from '@/hooks/useServices'

type ServiceForm = {
  id?: string
  name: string
  description: string
  durationMinutes: number
  bufferMinutes: number
  price: number
  isActive: boolean
}

const emptyForm: ServiceForm = {
  name: '',
  description: '',
  durationMinutes: 60,
  bufferMinutes: 0,
  price: 0,
  isActive: true,
}

export function ServicesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; form: ServiceForm } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; durationMinutes?: string; price?: string }>({})

  const { data, isLoading } = useServices({ pageNumber: page, pageSize: 20, search: search || undefined })
  const createMutation = useCreateService()
  const updateMutation = useUpdateService()
  const deleteMutation = useDeleteService()

  const services = data?.items ?? []

  function openAdd() {
    setModal({ open: true, form: { ...emptyForm } })
    setErrors({})
  }

  function openEdit(s: Service) {
    setModal({
      open: true,
      form: {
        id: s.id,
        name: s.name,
        description: s.description ?? '',
        durationMinutes: s.durationMinutes,
        bufferMinutes: s.bufferMinutes,
        price: s.price,
        isActive: s.isActive,
      },
    })
    setErrors({})
  }

  function validate(form: ServiceForm) {
    const e: { name?: string; durationMinutes?: string; price?: string } = {}
    if (!form.name || !form.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    if (!form.durationMinutes || form.durationMinutes <= 0) e.durationMinutes = 'Geçerli bir süre girin.'
    if (form.price < 0) e.price = 'Fiyat negatif olamaz.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function saveService() {
    if (!modal) return
    const f = modal.form
    if (!validate(f)) return
    if (f.id) {
      await updateMutation.mutateAsync({
        id: f.id,
        name: f.name,
        description: f.description,
        durationMinutes: f.durationMinutes,
        bufferMinutes: f.bufferMinutes,
        price: f.price,
        isActive: f.isActive,
        color: null,
        imageUrl: null,
        requiresConfirmation: false,
        maxCapacity: null,
        sortOrder: 0,
        createdAt: '',
      })
    } else {
      await createMutation.mutateAsync({
        name: f.name,
        description: f.description,
        durationMinutes: f.durationMinutes,
        bufferMinutes: f.bufferMinutes,
        price: f.price,
        isActive: f.isActive,
        color: null,
        imageUrl: null,
        requiresConfirmation: false,
        maxCapacity: null,
      })
    }
    setModal(null)
  }

  async function confirmDelete() {
    if (deleteId) await deleteMutation.mutateAsync(deleteId)
    setDeleteId(null)
  }

  const totalActive = services.filter(s => s.isActive).length
  const avgPrice = services.length ? Math.round(services.reduce((a, s) => a + s.price, 0) / services.length) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hizmetler</h1>
          <p className="text-sm text-gray-500">Sunduğunuz hizmetleri yönetin</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          <span className="hidden lg:inline">Yeni Hizmet</span>
          <span className="lg:hidden">Ekle</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Toplam Hizmet', value: data?.totalCount ?? 0, icon: '📋' },
          { label: 'Aktif Hizmet', value: totalActive, icon: '✅' },
          { label: 'Ort. Fiyat', value: formatCurrency(avgPrice), icon: '💰' },
          { label: 'Bu Sayfada', value: services.length, icon: '🏷️' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl">{stat.icon}</div>
            <div className="mt-1 text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Hizmet ara..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Table (desktop) / Accordion (mobile) */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : services.length === 0 ? (
          <div className="px-4 py-10 text-center text-gray-400">Hizmet bulunamadı</div>
        ) : (
          <>
            <table className="hidden w-full text-sm lg:table">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Hizmet Adı</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Süre</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Fiyat</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {services.map(svc => (
                  <tr key={svc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{svc.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{svc.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-3.5 w-3.5" /> {svc.durationMinutes} dk
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(svc.price)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {svc.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(svc)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteId(svc.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile: name-only rows, tap to expand details */}
            <div className="divide-y divide-gray-50 lg:hidden">
              {services.map(svc => {
                const isOpen = expandedId === svc.id
                return (
                  <div key={svc.id}>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : svc.id)}
                      className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                    >
                      <span className="font-medium text-gray-900">{svc.name}</span>
                      <ChevronDown className={cn('h-4 w-4 shrink-0 text-gray-400 transition-transform', isOpen && 'rotate-180')} />
                    </button>
                    {isOpen && (
                      <div className="space-y-2.5 px-4 pb-4">
                        {svc.description && <p className="text-xs text-gray-500">{svc.description}</p>}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3.5 w-3.5" /> {svc.durationMinutes} dk
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(svc.price)}</div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${svc.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {svc.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={() => openEdit(svc)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600"><Edit2 className="h-3.5 w-3.5" /> Düzenle</button>
                          <button onClick={() => setDeleteId(svc.id)} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-red-500"><Trash2 className="h-3.5 w-3.5" /> Sil</button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
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

      {/* Add/Edit Modal */}
      {modal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{modal.form.id ? 'Hizmet Düzenle' : 'Yeni Hizmet Ekle'}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Hizmet Adı *</label>
                  <input
                    value={modal.form.name}
                    onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, name: e.target.value } }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="Hizmet adı"
                  />
                  {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Süre (dakika) *</label>
                  <input
                    type="number"
                    value={modal.form.durationMinutes}
                    onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, durationMinutes: Number(e.target.value) } }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.durationMinutes && <div className="text-xs text-red-500 mt-1">{errors.durationMinutes}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Fiyat (₺)</label>
                  <input
                    type="number"
                    value={modal.form.price}
                    onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, price: Number(e.target.value) } }))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Açıklama</label>
                  <textarea
                    value={modal.form.description}
                    onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, description: e.target.value } }))}
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                    placeholder="Hizmet açıklaması"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={modal.form.isActive}
                    onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, isActive: e.target.checked } }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Aktif</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button
                onClick={saveService}
                disabled={!modal.form.name || createMutation.isPending || updateMutation.isPending}
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
            <h3 className="mt-3 text-center text-base font-bold text-gray-900">Hizmeti Sil</h3>
            <p className="mt-1 text-center text-sm text-gray-500">Bu hizmet kalıcı olarak silinecek. Emin misiniz?</p>
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
