import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, User, Scissors,
  Filter, Loader2, CheckCircle2, XCircle,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAppointments, useCreateAppointment, useConfirmAppointment, useCompleteAppointment, useCancelAppointment } from '@/hooks/useAppointments'
import { useEmployees } from '@/hooks/useEmployees'
import { useServices } from '@/hooks/useServices'
import { useCustomers } from '@/hooks/useCustomers'
import type { Appointment } from '@/hooks/useAppointments'
import { cn, formatTime } from '@/lib/utils'

// ─── Constants ─────────────────────────────────────────────────────────────
type CalendarView = 'day' | 'week' | 'month'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'Beklemede',  color: 'text-amber-700',   bg: 'bg-amber-50',   border: 'border-amber-200' },
  confirmed: { label: 'Onaylandı', color: 'text-emerald-700',  bg: 'bg-emerald-50', border: 'border-emerald-200' },
  completed: { label: 'Tamamlandı',color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
  cancelled: { label: 'İptal',     color: 'text-red-700',     bg: 'bg-red-50',     border: 'border-red-200' },
  noShow:    { label: 'Gelmedi',   color: 'text-gray-600',    bg: 'bg-gray-50',    border: 'border-gray-200' },
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8)
const DAYS_TR = ['Pazar','Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi']
const DAYS_SHORT = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']
const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']

function toDateStr(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const isToday = (d: Date) => {
  const n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

// ─── Appointment Detail Popup ──────────────────────────────────────────────
function AppointmentDetailPopup({ appointment, onClose, onConfirm, onComplete, onCancel }: {
  appointment: Appointment
  onClose: () => void
  onConfirm: (id: string) => void
  onComplete: (id: string) => void
  onCancel: (id: string) => void
}) {
  const cfg = STATUS_CONFIG[appointment.status] ?? STATUS_CONFIG.pending
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className={cn('flex items-center justify-between px-5 py-4 rounded-t-2xl border-b', cfg.bg, cfg.border)}>
          <div>
            <span className={cn('text-xs font-semibold uppercase tracking-wide', cfg.color)}>{cfg.label}</span>
            <h3 className="text-base font-bold text-gray-900 mt-0.5">{appointment.customerName}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/60"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Scissors className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="font-medium text-gray-700">{appointment.serviceName}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">₺{appointment.price.toLocaleString('tr-TR')}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-gray-700">{appointment.employeeName}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Clock className="h-4 w-4 text-gray-400 shrink-0" />
            <span className="text-gray-700">
              {new Date(appointment.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' '}{formatTime(appointment.startTime)} – {formatTime(appointment.endTime)}
            </span>
          </div>
          {appointment.notes && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2 text-sm text-gray-600">{appointment.notes}</div>
          )}
        </div>
        <div className="flex gap-2 px-5 pb-5">
          {appointment.status === 'pending' && (
            <button onClick={() => { onConfirm(appointment.id); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> Onayla
            </button>
          )}
          {appointment.status === 'confirmed' && (
            <button onClick={() => { onComplete(appointment.id); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <CheckCircle2 className="h-4 w-4" /> Tamamla
            </button>
          )}
          {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
            <button onClick={() => { onCancel(appointment.id); onClose() }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
              <XCircle className="h-4 w-4" /> İptal
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Create Appointment Modal ──────────────────────────────────────────────
function CreateAppointmentModal({ defaultDate, onClose, onCreated }: {
  defaultDate?: string; onClose: () => void; onCreated: () => void
}) {
  const { data: servicesData } = useServices({ isActive: true, pageSize: 100 })
  const { data: employeesData } = useEmployees({ isActive: true, pageSize: 100 })
  const { data: customersData } = useCustomers({ pageSize: 100 })
  const createMutation = useCreateAppointment()

  const [form, setForm] = useState({
    customerId: '', serviceId: '', employeeId: '',
    date: defaultDate ?? (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
    time: '09:00', notes: '',
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
    const startTime = new Date(`${form.date}T${form.time}:00`).toISOString()
    await createMutation.mutateAsync({ customerId: form.customerId, serviceId: form.serviceId, employeeId: form.employeeId, startTime, notes: form.notes || undefined, source: 'panel' })
    onCreated(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-bold text-gray-900">Yeni Randevu</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri *</label>
            <input type="text" placeholder="İsim veya telefon ile ara..." value={customerSearch}
              onChange={e => { setCustomerSearch(e.target.value); setForm(f => ({ ...f, customerId: '' })) }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            {customerSearch && !form.customerId && (
              <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {customers.slice(0, 8).map(c => (
                  <button key={c.id} type="button"
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    onClick={() => { setForm(f => ({ ...f, customerId: c.id })); setCustomerSearch(c.name) }}>
                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{c.name[0]}</div>
                    <div><div className="font-medium">{c.name}</div><div className="text-gray-400 text-xs">{c.phone}</div></div>
                  </button>
                ))}
                {customers.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">Müşteri bulunamadı</div>}
              </div>
            )}
            {errors.customerId && <p className="text-xs text-red-500 mt-1">{errors.customerId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet *</label>
            <select value={form.serviceId} onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Hizmet seçin...</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.durationMinutes} dk — ₺{s.price}</option>)}
            </select>
            {errors.serviceId && <p className="text-xs text-red-500 mt-1">{errors.serviceId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personel *</label>
            <select value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option value="">Personel seçin...</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}{emp.title ? ` — ${emp.title}` : ''}</option>)}
            </select>
            {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tarih *</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Saat *</label>
              <input type="time" value={form.time} step="900" onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Randevu notu..." rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={createMutation.isPending}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2">
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Randevu Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Day View ──────────────────────────────────────────────────────────────
function DayView({ date, appointments, onAptClick, onSlotClick }: {
  date: Date; appointments: Appointment[]
  onAptClick: (apt: Appointment) => void; onSlotClick: (date: string) => void
}) {
  const dateStr = toDateStr(date)
  const dayApts = appointments.filter(a => a.startTime.slice(0, 10) === dateStr)
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className={cn('px-4 py-3 border-b text-center', isToday(date) ? 'bg-primary/5' : 'bg-gray-50')}>
        <div className="text-xs font-medium text-gray-500">{DAYS_TR[date.getDay()]}</div>
        <div className={cn('text-2xl font-bold mt-0.5', isToday(date) ? 'text-primary' : 'text-gray-800')}>
          {date.getDate()} {MONTHS_TR[date.getMonth()]}
        </div>
      </div>
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 260px)' }}>
        {HOURS.map(hour => {
          const hourApts = dayApts.filter(a => new Date(a.startTime).getHours() === hour)
          return (
            <div key={hour} className="flex border-b border-gray-100 min-h-[64px]">
              <div className="w-16 shrink-0 py-2 px-3 text-xs text-gray-400 font-medium">{String(hour).padStart(2, '0')}:00</div>
              <div className="flex-1 py-1 px-2 space-y-1 cursor-pointer hover:bg-gray-50"
                onClick={() => hourApts.length === 0 && onSlotClick(dateStr)}>
                {hourApts.map(apt => {
                  const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.pending
                  return (
                    <div key={apt.id} className={cn('rounded-lg border px-2 py-1.5 cursor-pointer hover:opacity-80', cfg.bg, cfg.border)}
                      onClick={e => { e.stopPropagation(); onAptClick(apt) }}>
                      <div className={cn('text-xs font-semibold', cfg.color)}>{apt.customerName}</div>
                      <div className="text-xs text-gray-600">{apt.serviceName} • {apt.employeeName}</div>
                      <div className="text-xs text-gray-400">{formatTime(apt.startTime)} – {formatTime(apt.endTime)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Week View ─────────────────────────────────────────────────────────────
function WeekView({ weekDates, appointments, onAptClick, onSlotClick }: {
  weekDates: Date[]; appointments: Appointment[]
  onAptClick: (apt: Appointment) => void; onSlotClick: (date: string) => void
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="min-w-[700px]">
        <div className="flex border-b border-gray-200">
          <div className="w-14 shrink-0" />
          {weekDates.map(d => (
            <div key={d.toISOString()} className={cn('flex-1 py-2.5 text-center border-l border-gray-100', isToday(d) && 'bg-primary/5')}>
              <div className="text-xs font-medium text-gray-400">{DAYS_SHORT[d.getDay()]}</div>
              <div className={cn('text-sm font-bold mt-0.5', isToday(d) ? 'text-primary' : 'text-gray-700')}>{d.getDate()}</div>
            </div>
          ))}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {HOURS.map(hour => (
            <div key={hour} className="flex border-b border-gray-100">
              <div className="w-14 shrink-0 py-2 px-2 text-xs text-gray-400 font-medium text-right">{String(hour).padStart(2, '0')}:00</div>
              {weekDates.map(d => {
                const dateStr = toDateStr(d)
                const hourApts = appointments.filter(a => a.startTime.slice(0, 10) === dateStr && new Date(a.startTime).getHours() === hour)
                return (
                  <div key={d.toISOString()}
                    className={cn('flex-1 border-l border-gray-100 p-0.5 min-h-[56px] cursor-pointer hover:bg-gray-50', isToday(d) && 'bg-primary/[0.02]')}
                    onClick={() => hourApts.length === 0 && onSlotClick(dateStr)}>
                    {hourApts.map(apt => {
                      const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.pending
                      return (
                        <div key={apt.id}
                          className={cn('rounded border px-1.5 py-1 mb-0.5 cursor-pointer hover:opacity-80', cfg.bg, cfg.border)}
                          onClick={e => { e.stopPropagation(); onAptClick(apt) }}>
                          <div className={cn('text-[10px] font-semibold leading-tight truncate', cfg.color)}>{apt.customerName}</div>
                          <div className="text-[10px] text-gray-500 leading-tight truncate">{apt.serviceName}</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Month View ────────────────────────────────────────────────────────────
function MonthView({ year, month, appointments, onAptClick, onSlotClick }: {
  year: number; month: number; appointments: Appointment[]
  onAptClick: (apt: Appointment) => void; onSlotClick: (date: string) => void
}) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = (firstDay.getDay() + 6) % 7
  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b">
        {['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7" style={{ minHeight: '480px' }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="border-b border-r border-gray-100 bg-gray-50/50" />
          const dateStr = toDateStr(d)
          const dayApts = appointments.filter(a => a.startTime.slice(0, 10) === dateStr)
          const today = isToday(d)
          return (
            <div key={dateStr}
              className={cn('border-b border-r border-gray-100 p-1.5 cursor-pointer hover:bg-gray-50', today && 'bg-primary/[0.03]')}
              onClick={() => onSlotClick(dateStr)}>
              <div className={cn('h-6 w-6 flex items-center justify-center rounded-full text-xs font-bold mb-1', today ? 'bg-primary text-primary-foreground' : 'text-gray-700')}>
                {d.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayApts.slice(0, 3).map(apt => {
                  const cfg = STATUS_CONFIG[apt.status] ?? STATUS_CONFIG.pending
                  return (
                    <div key={apt.id}
                      className={cn('rounded px-1 py-0.5 text-[10px] font-medium truncate cursor-pointer hover:opacity-80', cfg.bg, cfg.color)}
                      onClick={e => { e.stopPropagation(); onAptClick(apt) }}>
                      {formatTime(apt.startTime)} {apt.customerName}
                    </div>
                  )
                })}
                {dayApts.length > 3 && <div className="text-[10px] text-gray-500 px-1">+{dayApts.length - 3} daha</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main CalendarPage ─────────────────────────────────────────────────────
export function CalendarPage() {
  const [view, setView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [employeeFilter, setEmployeeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null)
  const [createModal, setCreateModal] = useState<{ open: boolean; date?: string }>({ open: false })
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setCreateModal({ open: true })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { data: employeesData } = useEmployees({ isActive: true, pageSize: 100 })
  const employees = employeesData?.items ?? []
  const confirmMutation = useConfirmAppointment()
  const completeMutation = useCompleteAppointment()
  const cancelMutation = useCancelAppointment()

  const { startDate, endDate, label } = useMemo(() => {
    if (view === 'day') {
      const s = toDateStr(currentDate)
      return { startDate: s, endDate: s, label: currentDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) }
    }
    if (view === 'week') {
      const diff = (currentDate.getDay() + 6) % 7
      const mon = new Date(currentDate); mon.setDate(currentDate.getDate() - diff); mon.setHours(0,0,0,0)
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
      const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
      const lbl = mon.getMonth() === sun.getMonth()
        ? `${mon.getDate()} – ${sun.toLocaleDateString('tr-TR', opts)} ${mon.getFullYear()}`
        : `${mon.toLocaleDateString('tr-TR', opts)} – ${sun.toLocaleDateString('tr-TR', opts)} ${sun.getFullYear()}`
      return { startDate: toDateStr(mon), endDate: toDateStr(sun), label: lbl }
    }
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    return { startDate: toDateStr(first), endDate: toDateStr(last), label: `${MONTHS_TR[currentDate.getMonth()]} ${currentDate.getFullYear()}` }
  }, [view, currentDate])

  const { data, isLoading, refetch } = useAppointments({ pageSize: 500, employeeId: employeeFilter || undefined, status: statusFilter || undefined })

  const appointments = useMemo(() => {
    return (data?.items ?? []).filter(a => { const d = a.startTime.slice(0, 10); return d >= startDate && d <= endDate })
  }, [data?.items, startDate, endDate])

  const weekDates = useMemo(() => {
    const diff = (currentDate.getDay() + 6) % 7
    const mon = new Date(currentDate); mon.setDate(currentDate.getDate() - diff); mon.setHours(0,0,0,0)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(mon); d.setDate(mon.getDate() + i); return d })
  }, [currentDate])

  const navigate = useCallback((dir: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev)
      if (view === 'day') d.setDate(d.getDate() + dir)
      else if (view === 'week') d.setDate(d.getDate() + dir * 7)
      else d.setMonth(d.getMonth() + dir)
      return d
    })
  }, [view])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Takvim</h1>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View selector */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            {(['day','week','month'] as CalendarView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors', view === v ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-gray-50')}>
                {v === 'day' ? 'Günlük' : v === 'week' ? 'Haftalık' : 'Aylık'}
              </button>
            ))}
          </div>
          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-gray-50 shadow-sm">
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 shadow-sm">Bugün</button>
            <button onClick={() => navigate(1)} className="rounded-lg border border-gray-200 bg-white p-1.5 hover:bg-gray-50 shadow-sm">
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>
          {/* Filters */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm',
              (employeeFilter || statusFilter) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}>
            <Filter className="h-3.5 w-3.5" /> Filtreler
            {(employeeFilter || statusFilter) && (
              <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                {(employeeFilter ? 1 : 0) + (statusFilter ? 1 : 0)}
              </span>
            )}
          </button>
          {/* New Appointment */}
          <button onClick={() => setCreateModal({ open: true })}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-sm">
            <Plus className="h-3.5 w-3.5" /> Yeni Randevu
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Personel:</label>
            <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Tüm Personel</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Durum:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Tüm Durumlar</option>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {(employeeFilter || statusFilter) && (
            <button onClick={() => { setEmployeeFilter(''); setStatusFilter('') }} className="text-xs text-red-600 font-medium">Temizle</button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="ml-2 text-sm text-gray-500">Yükleniyor...</span>
        </div>
      )}

      {/* Calendar */}
      {!isLoading && (
        <>
          {view === 'day' && <DayView date={currentDate} appointments={appointments} onAptClick={setSelectedApt} onSlotClick={d => setCreateModal({ open: true, date: d })} />}
          {view === 'week' && <WeekView weekDates={weekDates} appointments={appointments} onAptClick={setSelectedApt} onSlotClick={d => setCreateModal({ open: true, date: d })} />}
          {view === 'month' && <MonthView year={currentDate.getFullYear()} month={currentDate.getMonth()} appointments={appointments} onAptClick={setSelectedApt} onSlotClick={d => setCreateModal({ open: true, date: d })} />}
        </>
      )}

      {/* Appointment detail */}
      {selectedApt && (
        <AppointmentDetailPopup appointment={selectedApt} onClose={() => setSelectedApt(null)}
          onConfirm={id => confirmMutation.mutate(id)}
          onComplete={id => completeMutation.mutate(id)}
          onCancel={id => cancelMutation.mutate({ id, reason: 'Panel üzerinden iptal edildi.' })} />
      )}

      {/* Create modal */}
      {createModal.open && (
        <CreateAppointmentModal defaultDate={createModal.date} onClose={() => setCreateModal({ open: false })} onCreated={() => refetch()} />
      )}
    </div>
  )
}