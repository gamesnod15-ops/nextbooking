import { useState, useRef } from 'react'
import { Plus, Edit2, Trash2, Search, Package, AlertTriangle, Loader2, ImageIcon, X as XIcon } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import {
  useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, type Product,
} from '@/hooks/useProducts'

type ProductForm = {
  id?: string
  name: string
  salePrice: string
  stockQuantity: string
  minStockLevel: string
  category: string
  barcode: string
  costPrice: string
  unit: string
  description: string
  imageUrl: string
  isActive: boolean
}

const emptyForm: ProductForm = {
  name: '', salePrice: '', stockQuantity: '0', minStockLevel: '5',
  category: '', barcode: '', costPrice: '', unit: 'adet', description: '', imageUrl: '', isActive: true,
}

export function ProductsPage() {
  const [search, setSearch] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; form: ProductForm } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<{ name?: string; salePrice?: string }>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useProducts({ pageNumber: page, pageSize: 20, search: search || undefined, lowStockOnly: lowStockOnly || undefined })
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

  const products = data?.items ?? []

  function openAdd() { setModal({ open: true, form: { ...emptyForm } }); setFormErrors({}) }
  function openEdit(p: Product) {
    setModal({
      open: true, form: {
        id: p.id, name: p.name, salePrice: String(p.salePrice),
        stockQuantity: String(p.stockQuantity), minStockLevel: String(p.minStockLevel),
        category: p.category ?? '', barcode: p.barcode ?? '', costPrice: p.costPrice != null ? String(p.costPrice) : '',
        unit: p.unit, description: p.description ?? '', imageUrl: p.imageUrl ?? '', isActive: p.isActive,
      },
    })
    setFormErrors({})
  }

  function handleImageFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setModal(m => m ? { ...m, form: { ...m.form, imageUrl: url } } : m)
    }
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!modal) return
    const f = modal.form
    const e: { name?: string; salePrice?: string } = {}
    if (!f.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    if (!f.salePrice) e.salePrice = 'Bu bölüm boş bırakılamaz.'
    else if (Number(f.salePrice) < 0) e.salePrice = 'Fiyat sıfırdan küçük olamaz.'
    setFormErrors(e)
    if (Object.keys(e).length > 0) return
    const payload = {
      name: f.name, salePrice: Number(f.salePrice), stockQuantity: Number(f.stockQuantity),
      minStockLevel: Number(f.minStockLevel), category: f.category || null,
      barcode: f.barcode || null, costPrice: f.costPrice ? Number(f.costPrice) : null,
      unit: f.unit, description: f.description || null, imageUrl: f.imageUrl || null,
    }
    if (f.id) {
      await updateMutation.mutateAsync({ id: f.id, ...payload, isActive: f.isActive })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setModal(null)
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ürün & Stok Yönetimi</h1>
          <p className="text-sm text-gray-500">Ürünlerinizi ve stok durumlarını yönetin</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Yeni Ürün
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Ürün ara..." className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={lowStockOnly} onChange={(e) => setLowStockOnly(e.target.checked)} />
          <AlertTriangle size={14} className="text-amber-500" /> Düşük stok
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package size={40} className="mx-auto mb-2 opacity-40" />
            <p>Henüz ürün eklenmemiş</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Ürün</th>
                <th className="px-4 py-3 text-left">Kategori</th>
                <th className="px-4 py-3 text-right">Fiyat</th>
                <th className="px-4 py-3 text-right">Stok</th>
                <th className="px-4 py-3 text-center">Durum</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.name}</div>
                    {p.barcode && <div className="text-xs text-gray-400">#{p.barcode}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(p.salePrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={p.isLowStock ? 'text-red-600 font-medium' : ''}>
                      {p.stockQuantity} {p.unit}
                      {p.isLowStock && <AlertTriangle size={12} className="inline ml-1 text-amber-500" />}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-gray-100 rounded"><Edit2 size={14} /></button>
                      <button onClick={() => setDeleteId(p.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Önceki</button>
          <span className="px-3 py-1 text-sm">{page} / {data.totalPages}</span>
          <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded text-sm disabled:opacity-50">Sonraki</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b">
              <h2 className="font-semibold text-lg">{modal.form.id ? 'Ürün Düzenle' : 'Yeni Ürün'}</h2>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Ürün Adı *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.name}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, name: e.target.value } })} />
                {formErrors.name && <div className="text-xs text-red-500 mt-1">{formErrors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Satış Fiyatı *</label>
                <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.salePrice}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, salePrice: e.target.value } })} />
                {formErrors.salePrice && <div className="text-xs text-red-500 mt-1">{formErrors.salePrice}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stok Miktarı</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.stockQuantity}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, stockQuantity: e.target.value } })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.category}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, category: e.target.value } })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Birim</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.unit}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, unit: e.target.value } })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Maliyet Fiyatı</label>
                <input type="number" step="0.01" className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.costPrice}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, costPrice: e.target.value } })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min. Stok Seviyesi</label>
                <input type="number" className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.minStockLevel}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, minStockLevel: e.target.value } })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Barkod</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.barcode}
                  onChange={(e) => setModal({ ...modal, form: { ...modal.form, barcode: e.target.value } })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Fotoğraf</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }}
                />
                {modal.form.imageUrl ? (
                  <div className="relative w-full h-36 rounded-lg border border-gray-200 overflow-hidden group">
                    <img src={modal.form.imageUrl} alt="Ürün" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-medium">Değiştir</button>
                      <button type="button" onClick={() => setModal(m => m ? { ...m, form: { ...m.form, imageUrl: '' } } : m)} className="p-1.5 bg-white text-red-500 rounded-lg"><XIcon size={14} /></button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f && f.type.startsWith('image/')) handleImageFile(f) }}
                    className="w-full h-36 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-blue-500"
                  >
                    <ImageIcon size={28} />
                    <span className="text-sm font-medium">Dosyadan Seç</span>
                    <span className="text-xs">veya sürükleyip bırakın</span>
                  </button>
                )}
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button onClick={save}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 size={14} className="animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Ürünü sil</h3>
            <p className="text-sm text-gray-600 mb-4">Bu ürünü silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button onClick={async () => { await deleteMutation.mutateAsync(deleteId); setDeleteId(null) }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
