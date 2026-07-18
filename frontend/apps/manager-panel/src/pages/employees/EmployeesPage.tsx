import { useState } from 'react'
import { Loader2, Search, Phone, Mail, Building2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { useAdminEmployees } from '@/hooks/useAdminEmployees'
import { useAdminTenants } from '@/hooks/useAdminTenants'

export function EmployeesPage() {
  const [search, setSearch] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [isActive, setIsActive] = useState('')
  const [page, setPage] = useState(1)

  const { data: tenantsData } = useAdminTenants({ pageNumber: 1, pageSize: 100, sort: 'Name' })
  const { data, isLoading } = useAdminEmployees({
    pageNumber: page,
    pageSize: 20,
    search: search || undefined,
    tenantId: tenantId || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
  })
  const employees = data?.items ?? []

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => { setter(v); setPage(1) }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Personel" description={`İşletmelerin çalışan/personel kayıtları${data ? ` (${data.totalCount})` : ''}`} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="İsim, telefon, e-posta veya işletme ara..."
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={tenantId}
          onChange={(e) => resetPage(setTenantId)(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tüm İşletmeler</option>
          {tenantsData?.items.map((t) => (
            <option key={t.tenantId} value={t.tenantId}>{t.businessName ?? t.tenantName}</option>
          ))}
        </select>
        <select
          value={isActive}
          onChange={(e) => resetPage(setIsActive)(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Tüm Durumlar</option>
          <option value="true">Aktif</option>
          <option value="false">Pasif</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Personel</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 sm:table-cell">İletişim</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 md:table-cell">İşletme</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Durum</th>
                <th className="hidden px-4 py-3 text-left font-semibold text-gray-600 lg:table-cell">Online Randevu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Personel bulunamadı</td></tr>
              ) : employees.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{e.name}</div>
                    {e.title && <div className="text-xs text-gray-400">{e.title}</div>}
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    {e.phone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3 w-3" /> {e.phone}</div>}
                    {e.email && <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-400"><Mail className="h-3 w-3" /> {e.email}</div>}
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center gap-1.5 text-gray-600"><Building2 className="h-3.5 w-3.5 text-gray-400" />{e.businessName ?? e.tenantName ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={e.isActive ? 'success' : 'destructive'}>{e.isActive ? 'Aktif' : 'Pasif'}</Badge>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <Badge variant={e.acceptsOnlineBookings ? 'info' : 'default'}>{e.acceptsOnlineBookings ? 'Açık' : 'Kapalı'}</Badge>
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
    </div>
  )
}
