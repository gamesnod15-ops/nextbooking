import { useState } from 'react'
import { Plus, Edit2, Trash2, Search, Phone, Mail, X, Loader2 } from 'lucide-react'
import { PhoneInput } from '@/components/ui/PhoneInput'
import {
  useEmployees,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  type Employee,
} from '@/hooks/useEmployees'

const AVATAR_COLORS = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700', 'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700']

type EmployeeForm = {
  id?: string
  name: string
  title: string
  phone: string
  email: string
  bio: string
  isActive: boolean
  acceptsOnlineBookings: boolean
  serviceIds: string[]
}

const emptyForm: EmployeeForm = {
  name: '', title: '', phone: '', email: '', bio: '', isActive: true, acceptsOnlineBookings: true, serviceIds: []
}

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

export function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<{ open: boolean; form: EmployeeForm } | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ name?: string; title?: string; phone?: string; email?: string; bio?: string }>({})

  const { data, isLoading } = useEmployees({ pageNumber: page, pageSize: 12, search: search || undefined })
  const createMutation = useCreateEmployee()
  const updateMutation = useUpdateEmployee()
  const deleteMutation = useDeleteEmployee()

  const employees = data?.items ?? []

  function openAdd() { setModal({ open: true, form: { ...emptyForm } }); setErrors({}) }
  function openEdit(e: Employee) {
    setModal({ open: true, form: { id: e.id, name: e.name, title: e.title ?? '', phone: e.phone ?? '', email: e.email ?? '', bio: e.bio ?? '', isActive: e.isActive, acceptsOnlineBookings: e.acceptsOnlineBookings, serviceIds: e.serviceIds } })
    setErrors({})
  }

  function validate(f: EmployeeForm) {
    const e: { name?: string; title?: string; phone?: string; email?: string; bio?: string } = {}
    if (!f.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    if (!f.title.trim()) e.title = 'Bu bölüm boş bırakılamaz.'
    if (!f.phone) e.phone = 'Bu bölüm boş bırakılamaz.'
    else if (!/^\+905\d{9}$/.test(f.phone)) e.phone = 'Telefon formatı: +90 5XX XXX XX XX'
    if (!f.email.trim()) e.email = 'Bu bölüm boş bırakılamaz.'
    else if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Geçerli bir e-posta girin.'
    if (!f.bio.trim()) e.bio = 'Bu bölüm boş bırakılamaz.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!modal) return
    const f = modal.form
    if (!validate(f)) return
    const payload = { name: f.name, title: f.title || null, phone: f.phone || null, email: f.email || null, bio: f.bio || null, isActive: f.isActive, acceptsOnlineBookings: f.acceptsOnlineBookings, serviceIds: f.serviceIds }
    if (f.id) {
      await updateMutation.mutateAsync({ id: f.id, ...payload, avatarUrl: null, createdAt: '' })
    } else {
      await createMutation.mutateAsync(payload)
    }
    setModal(null)
  }

  async function confirmDelete() {
    if (deleteId) await deleteMutation.mutateAsync(deleteId)
    setDeleteId(null)
  }

  const colorIdx = (id: string) => id.charCodeAt(0) % AVATAR_COLORS.length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Çalışanlar</h1>
          <p className="text-sm text-gray-500">Çalışanlarınızı ve programlarını yönetin</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Çalışan Ekle
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Toplam Çalışan', value: data?.totalCount ?? 0 },
          { label: 'Aktif', value: employees.filter(e => e.isActive).length },
          { label: 'Pasif', value: employees.filter(e => !e.isActive).length },
          { label: 'Bu Sayfada', value: employees.length },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Çalışan ara..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      )}

      {/* Employee Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {employees.map(emp => (
            <div key={emp.id} className={`rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${!emp.isActive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold ${AVATAR_COLORS[colorIdx(emp.id)]}`}>
                    {getInitials(emp.name)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{emp.name}</div>
                    <div className="text-xs text-gray-500">{emp.title ?? '—'}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(emp)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteId(emp.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                {emp.phone && <div className="flex items-center gap-2 text-xs text-gray-500"><Phone className="h-3.5 w-3.5 shrink-0" /> {emp.phone}</div>}
                {emp.email && <div className="flex items-center gap-2 text-xs text-gray-500"><Mail className="h-3.5 w-3.5 shrink-0" /> {emp.email}</div>}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className={`text-xs font-medium ${emp.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                  {emp.isActive ? 'Aktif' : 'Pasif'}
                </span>
                <span className="text-xs text-gray-400">{emp.serviceIds.length} hizmet</span>
              </div>
            </div>
          ))}

          {employees.length === 0 && (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">
              Çalışan bulunamadı
            </div>
          )}
        </div>
      )}

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
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{modal.form.id ? 'Çalışan Düzenle' : 'Yeni Çalışan Ekle'}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Ad Soyad *</label>
                  <input value={modal.form.name} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, name: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ad Soyad" />
                  {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Unvan *</label>
                  <input value={modal.form.title} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, title: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Kuaför, Uzman..." />
                  {errors.title && <div className="text-xs text-red-500 mt-1">{errors.title}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Telefon *</label>
                  <PhoneInput value={modal.form.phone} onChange={v => setModal(m => m && ({ ...m, form: { ...m.form, phone: v } }))} />
                  {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">E-posta *</label>
                  <input value={modal.form.email} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, email: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="email@ornek.com" />
                  {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Hakkında *</label>
                  <textarea value={modal.form.bio} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, bio: e.target.value } }))} rows={2} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" placeholder="Kısa biyografi..." />
                  {errors.bio && <div className="text-xs text-red-500 mt-1">{errors.bio}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="empActive" checked={modal.form.isActive} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, isActive: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="empActive" className="text-sm text-gray-700">Aktif</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="empOnline" checked={modal.form.acceptsOnlineBookings} onChange={e => setModal(m => m && ({ ...m, form: { ...m.form, acceptsOnlineBookings: e.target.checked } }))} className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="empOnline" className="text-sm text-gray-700">Online Rezervasyon</label>
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
            <h3 className="mt-3 text-center text-base font-bold text-gray-900">Çalışanı Sil</h3>
            <p className="mt-1 text-center text-sm text-gray-500">Bu çalışan kalıcı olarak silinecek. Emin misiniz?</p>
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

