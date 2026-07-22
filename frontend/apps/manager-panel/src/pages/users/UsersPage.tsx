import { useState } from 'react'
import { Loader2, Search, X, Mail, Phone, Plus, Edit2, ShieldOff, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { showToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import {
  useAdminUsers,
  useSetUserActiveStatus,
  useCreateAdmin,
  useUpdateAdmin,
  type PlatformUser,
} from '@/hooks/useAdminUsers'

type AdminForm = {
  id?: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
}

const emptyForm: AdminForm = { email: '', password: '', firstName: '', lastName: '', phone: '' }

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<AdminForm | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const { data, isLoading } = useAdminUsers({ pageNumber: page, pageSize: 20, search: search || undefined })
  const statusMutation = useSetUserActiveStatus()
  const createMutation = useCreateAdmin()
  const updateMutation = useUpdateAdmin()

  const admins = data?.items ?? []

  function openAdd() { setModal({ ...emptyForm }); setErrors({}) }
  function openEdit(u: PlatformUser) {
    const [firstName, ...rest] = u.fullName.split(' ')
    setModal({ id: u.id, email: u.email, password: '', firstName, lastName: rest.join(' '), phone: u.phone ?? '' })
    setErrors({})
  }

  function validate(f: AdminForm) {
    const e: Record<string, string> = {}
    if (!f.firstName.trim()) e.firstName = 'Zorunlu alan'
    if (!f.lastName.trim()) e.lastName = 'Zorunlu alan'
    if (!f.email.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Geçerli bir e-posta girin'
    if (!f.id && f.password.length < 8) e.password = 'En az 8 karakter'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!modal || !validate(modal)) return
    try {
      if (modal.id) {
        await updateMutation.mutateAsync({
          id: modal.id, firstName: modal.firstName, lastName: modal.lastName, email: modal.email, phone: modal.phone || null,
        })
        showToast('success', 'Güncellendi', 'Yönetici bilgileri güncellendi.')
      } else {
        await createMutation.mutateAsync({
          email: modal.email, password: modal.password, firstName: modal.firstName, lastName: modal.lastName, phone: modal.phone || null,
        })
        showToast('success', 'Oluşturuldu', 'Yeni yönetici hesabı oluşturuldu.')
      }
      setModal(null)
    } catch {
      showToast('error', 'Hata', 'İşlem gerçekleştirilemedi. E-posta zaten kayıtlı olabilir.')
    }
  }

  async function toggleActive(id: string, next: boolean) {
    try {
      await statusMutation.mutateAsync({ id, isActive: next })
      showToast('success', next ? 'Hesap aktifleştirildi' : 'Hesap devre dışı bırakıldı')
    } catch (err) {
      showToast('error', 'Hata', err instanceof Error ? err.message : 'İşlem gerçekleştirilemedi.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Yöneticiler" description="Manager panele erişimi olan platform yöneticisi hesapları">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Yönetici Ekle
        </button>
      </PageHeader>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="İsim, e-posta veya telefon ara..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Yönetici</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">İletişim</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Kayıt</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Yönetici bulunamadı</td></tr>
              ) : admins.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{u.fullName}</div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail className="h-3 w-3" /> {u.email}</div>
                    {u.phone && <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400"><Phone className="h-3 w-3" /> {u.phone}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'destructive'}>{u.isActive ? 'Aktif' : 'Devre Dışı'}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Düzenle">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleActive(u.id, !u.isActive)}
                        disabled={statusMutation.isPending}
                        className={`rounded-md p-1.5 hover:bg-gray-100 ${u.isActive ? 'text-red-500' : 'text-emerald-500'}`}
                        title={u.isActive ? 'Devre dışı bırak' : 'Aktifleştir'}
                      >
                        {u.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data?.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.totalPages ?? 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{modal.id ? 'Yönetici Düzenle' : 'Yeni Yönetici Ekle'}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Ad *</label>
                  <input value={modal.firstName} onChange={(e) => setModal((m) => m && ({ ...m, firstName: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {errors.firstName && <div className="text-xs text-red-500 mt-1">{errors.firstName}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Soyad *</label>
                  <input value={modal.lastName} onChange={(e) => setModal((m) => m && ({ ...m, lastName: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  {errors.lastName && <div className="text-xs text-red-500 mt-1">{errors.lastName}</div>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">E-posta *</label>
                  <input type="email" value={modal.email} onChange={(e) => setModal((m) => m && ({ ...m, email: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="yonetici@jetrandevu.com" />
                  {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
                </div>
                {!modal.id && (
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">Şifre *</label>
                    <input type="password" value={modal.password} onChange={(e) => setModal((m) => m && ({ ...m, password: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="En az 8 karakter" />
                    {errors.password && <div className="text-xs text-red-500 mt-1">{errors.password}</div>}
                  </div>
                )}
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Telefon</label>
                  <input value={modal.phone} onChange={(e) => setModal((m) => m && ({ ...m, phone: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="+90 5XX XXX XX XX" />
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
    </div>
  )
}
