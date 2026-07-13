import { useState } from 'react'
import { TrendingUp, Users, Calendar, DollarSign, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { usePerformance, type PerformanceFilter } from '@/hooks/usePerformance'

function getDefaultDates() {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

export function PerformancePage() {
  const defaults = getDefaultDates()
  const [periodStart, setPeriodStart] = useState(defaults.start)
  const [periodEnd, setPeriodEnd] = useState(defaults.end)
  const isInvalidDateRange = !!periodStart && !!periodEnd && periodEnd < periodStart

  const filter: PerformanceFilter = { pageNumber: 1, pageSize: 50, periodStart, periodEnd }
  const { data, isLoading } = usePerformance(filter, { enabled: !isInvalidDateRange })
  const items = data?.items ?? []

  const totalRevenue = items.reduce((s, e) => s + e.totalRevenue, 0)
  const totalCompleted = items.reduce((s, e) => s + e.completedAppointments, 0)
  const totalAppointments = items.reduce((s, e) => s + e.totalAppointments, 0)

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Personel Performans Takibi</h1>
        <p className="text-sm text-gray-500">Personel bazlı randevu ve gelir performansı</p>
      </div>

      {/* Date range */}
      <div className="flex gap-3 items-center">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Başlangıç</label>
          <input type="date" className={`border rounded-lg px-3 py-2 text-sm ${isInvalidDateRange ? 'border-red-300' : ''}`} value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Bitiş</label>
          <input type="date" className={`border rounded-lg px-3 py-2 text-sm ${isInvalidDateRange ? 'border-red-300' : ''}`} value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
      </div>
      {isInvalidDateRange && (
        <p className="text-xs font-medium text-red-600">Bitiş tarihi başlangıç tarihinden önce olamaz.</p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div>
          <div>
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-xs text-gray-500">Aktif Personel</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg"><Calendar size={20} className="text-green-600" /></div>
          <div>
            <div className="text-2xl font-bold">{totalCompleted}<span className="text-gray-400 text-lg">/{totalAppointments}</span></div>
            <div className="text-xs text-gray-500">Tamamlanan / Toplam Randevu</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg"><DollarSign size={20} className="text-purple-600" /></div>
          <div>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <div className="text-xs text-gray-500">Toplam Ciro</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={28} /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp size={40} className="mx-auto mb-2 opacity-40" />
            <p>Bu dönem için veri bulunamadı</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Personel</th>
                <th className="px-4 py-3 text-right">Toplam</th>
                <th className="px-4 py-3 text-right">Tamamlanan</th>
                <th className="px-4 py-3 text-right">İptal</th>
                <th className="px-4 py-3 text-right">Tamamlanma %</th>
                <th className="px-4 py-3 text-right">Günlük Ort.</th>
                <th className="px-4 py-3 text-right">Ciro</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((e) => (
                <tr key={e.employeeId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium">{e.employeeName}</div>
                    {e.title && <div className="text-xs text-gray-400">{e.title}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">{e.totalAppointments}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{e.completedAppointments}</td>
                  <td className="px-4 py-3 text-right text-red-500">{e.cancelledAppointments}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${e.completionRate}%` }} />
                      </div>
                      <span>{e.completionRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">{e.avgDailyAppointments}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(e.totalRevenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
