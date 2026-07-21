import { useState, useMemo } from 'react'
import { useReports, type ReportsFilter } from '@/hooks/useReports'
import { useEmployees } from '@/hooks/useEmployees'
import { useServices } from '@/hooks/useServices'
import { formatCurrency, cn, toLocalDateStr } from '@/lib/utils'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { TrendingUp, Users, XCircle, CheckCircle2, Loader2, Filter } from 'lucide-react'

type Preset = 'week' | 'month' | '3months' | 'year' | 'custom'

const PRESET_LABELS: Record<Preset, string> = {
  week: 'Bu Hafta', month: 'Bu Ay', '3months': 'Son 3 Ay', year: 'Bu Yıl', custom: 'Özel',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b', confirmed: '#10b981', completed: '#3b82f6',
  cancelled: '#ef4444', noShow: '#6b7280',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede', confirmed: 'Onaylandı', completed: 'Tamamlandı',
  cancelled: 'İptal', noShow: 'Gelmedi',
}


function getPresetDates(preset: Preset): { startDate: string; endDate: string } {
  const today = new Date()
  const fmt = (d: Date) => toLocalDateStr(d)
  if (preset === 'week') {
    const diff = (today.getDay() + 6) % 7
    const mon = new Date(today); mon.setDate(today.getDate() - diff)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { startDate: fmt(mon), endDate: fmt(sun) }
  }
  if (preset === 'month') {
    return { startDate: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: fmt(today) }
  }
  if (preset === '3months') {
    const s = new Date(today); s.setMonth(s.getMonth() - 3)
    return { startDate: fmt(s), endDate: fmt(today) }
  }
  if (preset === 'year') {
    return { startDate: fmt(new Date(today.getFullYear(), 0, 1)), endDate: fmt(today) }
  }
  return { startDate: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: fmt(today) }
}

export function ReportsPage() {
  const [preset, setPreset] = useState<Preset>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [employeeId, setEmployeeId] = useState('')
  const [serviceId, setServiceId] = useState('')

  const { data: employeesData } = useEmployees({ isActive: true, pageSize: 100 })
  const { data: servicesData } = useServices({ isActive: true, pageSize: 100 })

  const isInvalidCustomRange =
    preset === 'custom' && !!customStart && !!customEnd && customEnd < customStart

  const filter = useMemo<ReportsFilter>(() => {
    const dates = preset === 'custom'
      ? { startDate: customStart || undefined, endDate: customEnd || undefined }
      : getPresetDates(preset)
    return { ...dates, employeeId: employeeId || undefined, serviceId: serviceId || undefined }
  }, [preset, customStart, customEnd, employeeId, serviceId])

  const { data, isLoading } = useReports(filter, { enabled: !isInvalidCustomRange })

  const kpis = data?.kpis
  const revenueData = data?.revenueTimeline ?? []
  const serviceData = data?.serviceBreakdown ?? []
  const employeeData = data?.employeePerformance ?? []
  const statusData = (data?.statusBreakdown ?? []).map(s => ({
    ...s, name: STATUS_LABELS[s.status] ?? s.status,
    fill: STATUS_COLORS[s.status] ?? '#9ca3af',
  }))

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
          <p className="text-sm text-gray-500">Gerçek zamanlı performans ve istatistikler</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period picker */}
          <div className="flex rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
            {(['week', 'month', '3months', 'year', 'custom'] as Preset[]).map(p => (
              <button key={p} onClick={() => setPreset(p)}
                className={cn('px-3 py-1.5 text-xs font-medium transition-colors', preset === p ? 'bg-primary text-primary-foreground' : 'text-gray-600 hover:bg-gray-50')}>
                {PRESET_LABELS[p]}
              </button>
            ))}
          </div>
          {/* Filters */}
          <button onClick={() => setShowFilters(!showFilters)}
            className={cn('flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-sm',
              (employeeId || serviceId) ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50')}>
            <Filter className="h-3.5 w-3.5" /> Filtrele
          </button>
        </div>
      </div>

      {/* Custom date range */}
      {preset === 'custom' && (
        <div className="space-y-2 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-gray-600">Başlangıç:</label>
          <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
            className={cn('rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-2',
              isInvalidCustomRange ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/30')} />
          <label className="text-xs font-medium text-gray-600">Bitiş:</label>
          <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
            className={cn('rounded-lg border px-2 py-1 text-xs focus:outline-none focus:ring-2',
              isInvalidCustomRange ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary/30')} />
          </div>
          {isInvalidCustomRange && (
            <p className="text-xs font-medium text-red-600">Bitiş tarihi başlangıç tarihinden önce olamaz.</p>
          )}
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="flex flex-wrap gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Personel:</label>
            <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Tümü</option>
              {(employeesData?.items ?? []).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600">Hizmet:</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30">
              <option value="">Tümü</option>
              {(servicesData?.items ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {(employeeId || serviceId) && (
            <button onClick={() => { setEmployeeId(''); setServiceId('') }} className="text-xs text-red-600 font-medium">Temizle</button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="ml-2 text-sm text-gray-500">Veriler yükleniyor...</span>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={<TrendingUp className="h-5 w-5 text-blue-500" />} label="Toplam Ciro" value={formatCurrency(kpis?.totalRevenue ?? 0)} sub={`Ort. sepet: ${formatCurrency(kpis?.averageBasket ?? 0)}`} />
            <KpiCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} label="Tamamlanan" value={(kpis?.completedAppointments ?? 0).toLocaleString('tr-TR')} sub={`Tamamlanma: %${(kpis?.completionRate ?? 0).toFixed(0)}`} />
            <KpiCard icon={<Users className="h-5 w-5 text-amber-500" />} label="Toplam Randevu" value={(kpis?.totalAppointments ?? 0).toLocaleString('tr-TR')} sub={`Tekil müşteri: ${kpis?.uniqueCustomers ?? 0}`} />
            <KpiCard icon={<XCircle className="h-5 w-5 text-red-500" />} label="İptal Oranı" value={`%${(kpis?.cancellationRate ?? 0).toFixed(1)}`} sub={`İptal: ${kpis?.cancelledAppointments ?? 0} randevu`} />
          </div>

          {/* Revenue + Status charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Revenue timeline (2/3 width) */}
            <div className="lg:col-span-2 rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Ciro Trendi</h2>
              {revenueData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="label" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₺${v}`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), 'Ciro']}
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Status donut */}
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Durum Dağılımı</h2>
              {statusData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip formatter={(v: number, name) => [v, name]}
                      contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Service breakdown + Employee performance */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Hizmet Dağılımı</h2>
              {serviceData.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={serviceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="serviceName" type="category" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" name="Randevu" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-900">Personel Performansı</h2>
              {employeeData.length === 0 ? <EmptyChart /> : (
                <div className="space-y-3 overflow-y-auto max-h-52">
                  {employeeData.map((e) => (
                    <div key={e.employeeName} className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {e.employeeName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="font-medium text-gray-800 truncate">{e.employeeName}</span>
                          <span className="text-gray-500 shrink-0 ml-1">{e.completed}/{e.appointments}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${e.completionRate}%` }} />
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 shrink-0 w-20 text-right">
                        {formatCurrency(e.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-52 text-sm text-gray-400">
      Bu dönem için veri bulunamadı
    </div>
  )
}
