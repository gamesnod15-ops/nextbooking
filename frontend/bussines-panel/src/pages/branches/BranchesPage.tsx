import { useState } from 'react'
import { Plus, Edit2, Trash2, Building2, MapPin, Phone, Mail, User, Loader2, CheckCircle } from 'lucide-react'
import {
  useBranches, useCreateBranch, useUpdateBranch, useDeleteBranch, type Branch,
} from '@/hooks/useBranches'
import { PhoneInput } from '@/components/ui/PhoneInput'

type BranchForm = Omit<Branch, 'createdAt'>

const emptyForm: BranchForm = {
  id: '', name: '', address: null, city: null, phone: null,
  email: null, managerName: null, isActive: true, isMainBranch: false,
}


export function BranchesPage() {
  const [modal, setModal] = useState<{ open: boolean; form: BranchForm } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({})

  const { data, isLoading } = useBranches()
  const createMutation = useCreateBranch()
  const updateMutation = useUpdateBranch()
  const deleteMutation = useDeleteBranch()

  const branches = data?.items ?? []

  function openEdit(b: Branch) {
    setModal({ open: true, form: { id: b.id, name: b.name, address: b.address, city: b.city, phone: b.phone, email: b.email, managerName: b.managerName, isActive: b.isActive, isMainBranch: b.isMainBranch } })
    setErrors({})
  }

  function validate(form: BranchForm) {
    const e: { name?: string; phone?: string; email?: string } = {}
    if (!form.name || !form.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    if (form.phone && !/^\+905\d{9}$/.test(form.phone.replace(/\D/g, '').replace(/^0/, '+90'))) e.phone = 'Telefon formatı: +90 5XX XXX XX XX'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Geçerli bir e-posta girin.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!modal) return
    const f = modal.form
    if (!validate(f)) return
    if (f.id) {
      await updateMutation.mutateAsync({ ...f, createdAt: '' })
    } else {
      const { id: _id, ...rest } = f
      await createMutation.mutateAsync({ ...rest })
    }
    setModal(null)
  }

  function setF(patch: Partial<BranchForm>) {
    if (!modal) return
    setModal({ ...modal, form: { ...modal.form, ...patch } })
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Çoklu Şube Yönetimi</h1>
          <p className="text-sm text-gray-500">İşletmenizin şubelerini yönetin</p>
        </div>
        <button onClick={() => setModal({ open: true, form: { ...emptyForm } })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Plus size={16} /> Yeni Şube
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
      ) : branches.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 size={40} className="mx-auto mb-2 opacity-40" />
          <p>Henüz şube eklenmemiş</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {branches.map((b) => (
            <div key={b.id} className={`bg-white rounded-xl border p-4 relative ${!b.isActive ? 'opacity-60' : ''}`}>
              {b.isMainBranch && (
                <span className="absolute top-3 right-3 flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <CheckCircle size={12} /> Ana Şube
                </span>
              )}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><Building2 size={18} className="text-blue-600" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{b.name}</h3>
                  {!b.isActive && <span className="text-xs text-gray-400">Pasif</span>}
                </div>
              </div>
              <div className="mt-3 space-y-1.5 text-sm text-gray-500">
                {b.city && <div className="flex items-center gap-1.5"><MapPin size={12} />{b.city}</div>}
                {b.address && <div className="flex items-center gap-1.5 text-xs"><MapPin size={10} className="opacity-50" />{b.address}</div>}
                {b.phone && <div className="flex items-center gap-1.5"><Phone size={12} />{b.phone}</div>}
                {b.email && <div className="flex items-center gap-1.5"><Mail size={12} />{b.email}</div>}
                {b.managerName && <div className="flex items-center gap-1.5"><User size={12} />{b.managerName}</div>}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(b)} className="flex-1 py-1.5 border rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center justify-center gap-1">
                  <Edit2 size={12} /> Düzenle
                </button>
                {!b.isMainBranch && (
                  <button onClick={() => setDeleteId(b.id)} className="py-1.5 px-3 border border-red-200 text-red-600 rounded-lg text-xs hover:bg-red-50">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal?.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b"><h2 className="font-semibold text-lg">{modal.form.id ? 'Şube Düzenle' : 'Yeni Şube'}</h2></div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Şube Adı *</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.name}
                  onChange={(e) => setF({ name: e.target.value })} />
                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Şehir</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.city ?? ''}
                  onChange={(e) => setF({ city: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Telefon</label>
                <PhoneInput value={modal.form.phone ?? ''} onChange={(v) => setF({ phone: v || null })} />
                {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Adres</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.address ?? ''}
                  onChange={(e) => setF({ address: e.target.value || null })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-posta</label>
                <input type="email" className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.email ?? ''}
                  onChange={(e) => setF({ email: e.target.value || null })} />
                {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Şube Müdürü</label>
                <input className="w-full border rounded-lg px-3 py-2 text-sm" value={modal.form.managerName ?? ''}
                  onChange={(e) => setF({ managerName: e.target.value || null })} />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={modal.form.isActive} onChange={(e) => setF({ isActive: e.target.checked })} />
                <label htmlFor="isActive" className="text-sm">Aktif</label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isMain" checked={modal.form.isMainBranch} onChange={(e) => setF({ isMainBranch: e.target.checked })} />
                <label htmlFor="isMain" className="text-sm">Ana Şube</label>
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

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Şubeyi sil</h3>
            <p className="text-sm text-gray-600 mb-4">Bu şubeyi silmek istediğinize emin misiniz?</p>
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
