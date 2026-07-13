import { useState } from 'react'
import {
  useAppointments, useCancelAppointment, useConfirmAppointment,
  useCompleteAppointment, useCreateAppointment,
} from '@/hooks/useAppointments'
import { useEmployees } from '@/hooks/useEmployees'
import { useServices } from '@/hooks/useServices'
import { useCustomers } from '@/hooks/useCustomers'
import { formatDate, formatTime, cn } from '@/lib/utils'
import {
  Calendar, RefreshCw, Plus, X, Loader2, CheckCircle2, XCircle,
  Clock, User, Scissors, ChevronLeft, ChevronRight, Search,
  MessageCircle,
} from 'lucide-react'
import type { Appointment } from '@/hooks/useAppointments'

const statusLabels: Record<string, string> = {
  pending: 'Beklemede', confirmed: 'Onaylandı', cancelled: 'İptal',
  completed: 'Tamamlandı', no_show: 'Gelmedi', noShow: 'Gelmedi',
}
const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  no_show: 'bg-gray-100 text-gray-600 border-gray-200',
  noShow: 'bg-gray-100 text-gray-600 border-gray-200',
}

// ─── Appointment Detail Drawer ─────────────────────────────────────────────
function AppointmentDrawer({ apt, onClose, onConfirm, onComplete, onCancel }: {
  apt: Appointment; onClose: () => void
  onConfirm: (id: string) => void
  onComplete: (id: string) => void
  onCancel: (id: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1 bg-black/30" />
      <div className="w-full max-w-md bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h3 className="font-bold text-gray-900">Randevu Detayı</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', statusColors[apt.status])}>
            {statusLabels[apt.status] ?? apt.status}
          </div>
          <div className="space-y-2">
            <DetailRow icon={<User className="h-4 w-4" />} label="Müşteri" value={apt.customerName} />
            <DetailRow icon={<User className="h-4 w-4" />} label="Telefon" value={apt.customerPhone} />
            <DetailRow icon={<Scissors className="h-4 w-4" />} label="Hizmet" value={`${apt.serviceName} (${apt.serviceDurationMinutes} dk)`} />
            <DetailRow icon={<User className="h-4 w-4" />} label="Personel" value={apt.employeeName} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label="Tarih & Saat" value={`${formatDate(apt.startTime)} ${formatTime(apt.startTime)} – ${formatTime(apt.endTime)}`} />
            <DetailRow icon={<Scissors className="h-4 w-4" />} label="Ücret" value={`₺${apt.price.toLocaleString('tr-TR')}`} />
            {apt.notes && <DetailRow icon={<Scissors className="h-4 w-4" />} label="Not" value={apt.notes} />}
            <DetailRow icon={<Scissors className="h-4 w-4" />} label="Kaynak" value={apt.source} />
          </div>
        </div>
        <div className="flex gap-2 border-t px-5 py-4">
          {apt.status === 'pending' && (
            <button onClick={() => { onConfirm(apt.id); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Onayla
            </button>
          )}
          {apt.status === 'confirmed' && (
            <button onClick={() => { onComplete(apt.id); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <CheckCircle2 className="h-4 w-4" /> Tamamla
            </button>
          )}
          {(apt.status === 'pending' || apt.status === 'confirmed') && (
            <button onClick={() => { onCancel(apt.id); onClose() }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
              <XCircle className="h-4 w-4" /> İptal
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <div className="w-5 text-gray-400 shrink-0 mt-0.5">{icon}</div>
      <div>
        <div className="text-xs font-medium text-gray-500">{label}</div>
        <div className="text-gray-800">{value}</div>
      </div>
    </div>
  )
}

// ─── Create Appointment Modal ──────────────────────────────────────────────
function CreateAppointmentModal({ onClose }: { onClose: () => void }) {
  const { data: servicesData } = useServices({ isActive: true, pageSize: 100 })
  const { data: employeesData } = useEmployees({ isActive: true, pageSize: 100 })
  const { data: customersData } = useCustomers({ pageSize: 100 })
  const createMutation = useCreateAppointment()

  const [form, setForm] = useState({
    customerId: '', serviceId: '', employeeId: '',
    date: new Date().toISOString().slice(0, 10), time: '09:00', notes: '',
  })
  const [customerSearch, setCustomerSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const services = servicesData?.items ?? []
  const employees = employeesData?.items ?? []
  const customers = (customersData?.items ?? []).filter(c =>
    !customerSearch || c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
  )

  function validate() {
    const e: Record<string, string> = {}
    if (!form.customerId) e.customerId = 'Müşteri seçin'
    if (!form.serviceId) e.serviceId = 'Hizmet seçin'
    if (!form.employeeId) e.employeeId = 'Personel seçin'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    await createMutation.mutateAsync({
      customerId: form.customerId, serviceId: form.serviceId, employeeId: form.employeeId,
      startTime: new Date(`${form.date}T${form.time}:00`).toISOString(),
      notes: form.notes || undefined, source: 'panel',
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-bold">Yeni Randevu</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri *</label>
            <input type="text" placeholder="İsim veya telefon..." value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setForm(f => ({ ...f, customerId: '' })) }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            {customerSearch && !form.customerId && customers.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {customers.slice(0, 8).map(c => (
                  <button key={c.id} type="button" onClick={() => { setForm(f => ({ ...f, customerId: c.id })); setCustomerSearch(c.name) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left">
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.name[0]}</div>
                    <div><div className="font-medium">{c.name}</div><div className="text-gray-400 text-xs">{c.phone}</div></div>
                  </button>
                ))}
              </div>
            )}
            {errors.customerId && <p className="text-xs text-red-500 mt-1">{errors.customerId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet *</label>
            <select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Hizmet seçin...</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.durationMinutes} dk — ₺{s.price}</option>)}
            </select>
            {errors.serviceId && <p className="text-xs text-red-500 mt-1">{errors.serviceId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personel *</label>
            <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Personel seçin...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
            {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
              <input type="time" value={form.time} step="900" onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
            <textarea value={form.notes} rows={2} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Not ekleyin..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={createMutation.isPending}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── AppointmentsPage ──────────────────────────────────────────────────────
export function AppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)

  const { data, isLoading, refetch } = useAppointments({ status: statusFilter || undefined, search: search || undefined, pageNumber: page, pageSize: 20 })
  const confirmMutation = useConfirmAppointment()
  const completeMutation = useCompleteAppointment()
  const cancelMutation = useCancelAppointment()

  const totalPages = data?.totalPages ?? 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Randevular</h1>
          <p className="text-sm text-gray-500">Tüm randevuları yönetin{data ? ` · ${data.totalCount} kayıt` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent">
            <RefreshCw className="h-4 w-4" /> Yenile
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Yeni Randevu
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Müşteri, hizmet ara..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-gray-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        {/* Status filters */}
        <div className="flex gap-1.5 flex-wrap">
          {['', 'pending', 'confirmed', 'completed', 'cancelled'].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
              className={cn('rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                statusFilter === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {s === '' ? 'Tümü' : statusLabels[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-gray-500">Yükleniyor...</span>
          </div>
        ) : !data?.items.length ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Calendar className="mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-500">Randevu bulunamadı</p>
            <p className="text-sm text-gray-400 mt-1">Filtre kriterlerinizi değiştirin veya yeni randevu oluşturun</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50/80">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Müşteri</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Hizmet</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Personel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tarih & Saat</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Ücret</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Durum</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.items.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setSelectedApt(apt)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900">{apt.customerName}</span>
                      {apt.source === 'whatsapp' && (
                        <span title="WhatsApp üzerinden alındı" className="inline-flex items-center rounded-full bg-green-100 border border-green-200 px-1.5 py-0.5 text-[10px] font-medium text-green-700 gap-1">
                          <MessageCircle className="h-3 w-3" />WA
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{apt.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{apt.serviceName}</div>
                    <div className="text-xs text-gray-400">{apt.serviceDurationMinutes} dk</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">{apt.employeeName}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{formatDate(apt.startTime)}</div>
                    <div className="text-xs text-gray-400">{formatTime(apt.startTime)} – {formatTime(apt.endTime)}</div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell font-medium">₺{apt.price.toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', statusColors[apt.status])}>
                      {statusLabels[apt.status] ?? apt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {apt.status === 'pending' && (
                        <button onClick={() => confirmMutation.mutate(apt.id)} disabled={confirmMutation.isPending}
                          className="rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 disabled:opacity-50">
                          Onayla
                        </button>
                      )}
                      {apt.status === 'confirmed' && (
                        <button onClick={() => completeMutation.mutate(apt.id)} disabled={completeMutation.isPending}
                          className="rounded px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 border border-transparent hover:border-blue-200 disabled:opacity-50">
                          Tamamla
                        </button>
                      )}
                      {(apt.status === 'pending' || apt.status === 'confirmed') && (
                        <button onClick={() => cancelMutation.mutate({ id: apt.id, reason: 'Manuel iptal' })} disabled={cancelMutation.isPending}
                          className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 disabled:opacity-50">
                          İptal
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Sayfa {page} / {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft className="h-4 w-4" /> Önceki
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50">
              Sonraki <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Appointment detail drawer */}
      {selectedApt && (
        <AppointmentDrawer apt={selectedApt} onClose={() => setSelectedApt(null)}
          onConfirm={id => confirmMutation.mutate(id)}
          onComplete={id => completeMutation.mutate(id)}
          onCancel={id => cancelMutation.mutate({ id, reason: 'Panel üzerinden iptal edildi.' })} />
      )}

      {/* Create modal */}
      {showCreate && <CreateAppointmentModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

