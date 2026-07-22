import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Package, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react'
import {
  usePackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  type Package as Pkg,
  type PackageItem,
} from '@/hooks/useMarketingData'

type PkgForm = {
  id?: string
  name: string
  description: string
  price: number
  originalPrice: number | null
  validityDays: number | null
  isActive: boolean
  imageUrl: string
  items: Array<{ serviceName: string; quantity: number }>
}

const emptyForm: PkgForm = {
  name: '', description: '', price: 0, originalPrice: null, validityDays: null, isActive: true, imageUrl: '', items: [],
}

export function PackagesPage() {
  const [modal, setModal] = useState<{ open: boolean; form: PkgForm } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [itemInput, setItemInput] = useState('')
  const [errors, setErrors] = useState<{ name?: string; price?: string; validityDays?: string; items?: string }>({})

  const { data, isLoading } = usePackages({ pageNumber: 1, pageSize: 50 })
  const createMutation = useCreatePackage()
  const updateMutation = useUpdatePackage()
  const deleteMutation = useDeletePackage()

  const packages = data?.items ?? []

  function openAdd() { setModal({ open: true, form: { ...emptyForm, items: [] } }); setItemInput('') }
  function openEdit(p: Pkg) {
    setModal({ open: true, form: { id: p.id, name: p.name, description: p.description ?? '', price: p.price, originalPrice: p.originalPrice, validityDays: p.validityDays, isActive: p.isActive, imageUrl: p.imageUrl ?? '', items: p.items.map(i => ({ serviceName: i.serviceName, quantity: i.quantity })) } })
    setItemInput('')
  }

  function addItem() {
    if (!itemInput.trim() || !modal) return
    setModal(m => m && ({ ...m, form: { ...m.form, items: [...m.form.items, { serviceName: itemInput.trim(), quantity: 1 }] } }))
    setItemInput('')
  }
  function removeItem(idx: number) {
    setModal(m => m && ({ ...m, form: { ...m.form, items: m.form.items.filter((_, i) => i !== idx) } }))
  }
  function updateQty(idx: number, qty: number) {
    setModal(m => m && ({ ...m, form: { ...m.form, items: m.form.items.map((it, i) => i === idx ? { ...it, quantity: qty } : it) } }))
  }

  function validate(form: PkgForm) {
    const e: { name?: string; price?: string; validityDays?: string; items?: string } = {}
    if (!form.name || !form.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    if (!form.price || form.price <= 0) e.price = 'Bu bölüm boş bırakılamaz.'
    if (!form.validityDays || form.validityDays <= 0) e.validityDays = 'Bu bölüm boş bırakılamaz.'
    if (form.items.length === 0) e.items = 'En az bir hizmet eklenmelidir.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!modal) return
    const f = modal.form
    if (!validate(f)) return
    const payload = {
      name: f.name, description: f.description || null, price: f.price, originalPrice: f.originalPrice,
      validityDays: f.validityDays, isActive: f.isActive, imageUrl: f.imageUrl || null,
      items: f.items.map(i => ({ serviceId: '00000000-0000-0000-0000-000000000000', serviceName: i.serviceName, quantity: i.quantity } as PackageItem)),
    }
    if (f.id) {
      await updateMutation.mutateAsync({ id: f.id, ...payload, createdAt: '' })
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Paketler</h1>
          <p className="text-sm text-gray-500">Hizmet paketleri ve kampanyalarını yönetin</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          <span className="hidden lg:inline">Yeni Paket</span>
          <span className="lg:hidden">Ekle</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map(pkg => (
            <div key={pkg.id} className={`relative rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-all ${!pkg.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                    {!pkg.isActive && <span className="text-xs text-gray-400">Pasif</span>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(pkg)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteId(pkg.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              {pkg.description && <p className="mt-2 text-xs text-gray-500 line-clamp-2">{pkg.description}</p>}
              {pkg.items.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {pkg.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary/50 shrink-0" />
                      {item.serviceName}{item.quantity > 1 && <span className="text-gray-400">x{item.quantity}</span>}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <div>
                  <span className="text-lg font-bold text-gray-900">{formatCurrency(pkg.price)}</span>
                  {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                    <span className="ml-2 text-xs text-gray-400 line-through">{formatCurrency(pkg.originalPrice)}</span>
                  )}
                </div>
                {pkg.validityDays && <span className="text-xs text-gray-500">{pkg.validityDays} gün geçerli</span>}
              </div>
            </div>
          ))}
          {packages.length === 0 && (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">Henüz paket eklenmedi</div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{modal.form.id ? 'Paketi Düzenle' : 'Yeni Paket'}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Paket Adı *</label>
                <input value={modal.form.name} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, name: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Fiyat (₺) *</label>
                  <input type="number" value={modal.form.price} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, price: Number(e.target.value) } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Orijinal Fiyat (₺)</label>
                  <input type="number" value={modal.form.originalPrice ?? ''} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, originalPrice: e.target.value ? Number(e.target.value) : null } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="İsteğe bağlı" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Geçerlilik (gün) *</label>
                  <input type="number" value={modal.form.validityDays ?? ''} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, validityDays: e.target.value ? Number(e.target.value) : null } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Sınırsız" />
                  {errors.validityDays && <div className="text-xs text-red-500 mt-1">{errors.validityDays}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="pkgActive" checked={modal.form.isActive} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, isActive: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="pkgActive" className="text-sm text-gray-700">Aktif</label>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Açıklama</label>
                <textarea value={modal.form.description} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, description: e.target.value } }))} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Hizmetler *</label>
                <div className="flex gap-2">
                  <input value={itemInput} onChange={e => setItemInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())} placeholder="Hizmet adı ekle ve Enter'a bas" className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <button type="button" onClick={addItem} className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"><Plus className="h-4 w-4" /></button>
                </div>
                {modal.form.items.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {modal.form.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs">
                        <span>{item.serviceName}</span>
                        <input type="number" value={item.quantity} min={1} onChange={e => updateQty(i, Number(e.target.value))} className="ml-1 w-10 rounded border border-gray-200 px-1 text-center text-xs" />
                        <button onClick={() => removeItem(i)} className="ml-1 text-gray-400 hover:text-red-500"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.items && <div className="text-xs text-red-500 mt-1">{errors.items}</div>}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button onClick={save} disabled={createMutation.isPending || updateMutation.isPending} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
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
            <h3 className="mt-3 text-center text-base font-bold text-gray-900">Paketi Sil</h3>
            <p className="mt-1 text-center text-sm text-gray-500">Bu paket kalıcı olarak silinecek.</p>
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
