import { useState } from 'react'
import { Loader2, Search, X, Mail, Phone, Building2, ShieldOff, ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { showToast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/utils'
import { useAdminUsers, useAdminUserDetail, useSetUserActiveStatus } from '@/hooks/useAdminUsers'

const roleLabels: Record<string, string> = {
  tenant_admin: 'İşletme Sahibi',
  employee: 'Çalışan',
  customer: 'Müşteri',
  platform_admin: 'Platform Yöneticisi',
}

export function UsersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<string | null>(null)

  const { data, isLoading } = useAdminUsers({ pageNumber: page, pageSize: 20, search: search || undefined, role: role || undefined })
  const { data: detail } = useAdminUserDetail(detailId)
  const statusMutation = useSetUserActiveStatus()

  const users = data?.items ?? []

  async function toggleActive(id: string, next: boolean) {
    try {
      await statusMutation.mutateAsync({ id, isActive: next })
      showToast('success', next ? 'Hesap aktifleştirildi' : 'Hesap devre dışı bırakıldı')
    } catch {
      showToast('error', 'Hata', 'İşlem gerçekleştirilemedi.')
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Kullanıcılar" description="Platformdaki tüm işletme sahibi, çalışan ve müşteri hesapları" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İsim, e-posta, telefon veya işletme ara..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tüm Roller</option>
          {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kullanıcı</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">Rol</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 md:table-cell">İşletme</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Kayıt</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">Kullanıcı bulunamadı</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <button onClick={() => setDetailId(u.id)} className="text-left hover:underline">
                      <div className="font-medium text-gray-900">{u.fullName}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </button>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Badge variant="info">{roleLabels[u.role] ?? u.role}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 md:table-cell">{u.tenantName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'destructive'}>{u.isActive ? 'Aktif' : 'Devre Dışı'}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-gray-500 lg:table-cell">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleActive(u.id, !u.isActive)}
                      disabled={statusMutation.isPending}
                      className={`rounded-md p-1.5 hover:bg-gray-100 ${u.isActive ? 'text-red-500' : 'text-emerald-500'}`}
                      title={u.isActive ? 'Devre dışı bırak' : 'Aktifleştir'}
                    >
                      {u.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </button>
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

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setDetailId(null)}>
          <div className="w-full max-w-sm bg-white shadow-2xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900">Kullanıcı Detayı</h2>
              <button onClick={() => setDetailId(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary overflow-hidden">
                  {detail.avatarUrl
                    ? <img src={detail.avatarUrl} alt="" className="h-full w-full object-cover" />
                    : detail.fullName.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div className="text-base font-bold text-gray-900">{detail.fullName}</div>
                  <Badge variant={detail.isActive ? 'success' : 'destructive'}>{detail.isActive ? 'Aktif' : 'Devre Dışı'}</Badge>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 shrink-0 text-gray-400" />{detail.email}</div>
                {detail.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 shrink-0 text-gray-400" />{detail.phone}</div>}
                {detail.tenantName && <div className="flex items-center gap-2 text-gray-600"><Building2 className="h-4 w-4 shrink-0 text-gray-400" />{detail.tenantName} {detail.tenantPlan && `(${detail.tenantPlan})`}</div>}
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-500 space-y-1">
                <div>Rol: <span className="font-medium text-gray-700">{roleLabels[detail.role] ?? detail.role}</span></div>
                <div>Kayıt tarihi: <span className="font-medium text-gray-700">{formatDate(detail.createdAt)}</span></div>
                {detail.lastLoginAt && <div>Son giriş: <span className="font-medium text-gray-700">{formatDate(detail.lastLoginAt)}</span></div>}
                <div>E-posta doğrulama: <span className="font-medium text-gray-700">{detail.emailVerified ? 'Doğrulandı' : 'Doğrulanmadı'}</span></div>
              </div>
              <button
                onClick={() => toggleActive(detail.id, !detail.isActive)}
                disabled={statusMutation.isPending}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-50 ${detail.isActive ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
              >
                {detail.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {detail.isActive ? 'Hesabı Devre Dışı Bırak' : 'Hesabı Aktifleştir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
