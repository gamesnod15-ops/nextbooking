import { useState } from 'react'
import { Calendar, Loader2, AlertTriangle, TrendingUp } from 'lucide-react'
import {
  useScheduleOptimizations,
  useOverbookingSuggestions,
} from '@/hooks/useSmartSchedule'

export function SmartSchedulePage() {
  const today = new Date()
  const weekLater = new Date(today)
  weekLater.setDate(weekLater.getDate() + 7)

  const formatDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`

  const [startDate, setStartDate] = useState(formatDate(today))
  const [endDate, setEndDate] = useState(formatDate(weekLater))
  const [overbookingDate, setOverbookingDate] = useState(formatDate(today))
  const [tab, setTab] = useState<'optimizations' | 'overbooking'>('optimizations')

  const { data: optimizations, isLoading: optLoading } = useScheduleOptimizations(startDate, endDate)
  const { data: overbookings, isLoading: ovrLoading } = useOverbookingSuggestions(overbookingDate)

  const highDemand = (optimizations ?? []).filter(s => s.expectedDemandScore >= 70)
  const lowDemand = (optimizations ?? []).filter(s => s.expectedDemandScore < 30)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Akıllı Vardiya Planlama</h1>
          <p className="text-sm text-gray-500">AI destekli talep tahmini ve vardiya optimizasyonu</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200">
        {(['optimizations', 'overbooking'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'optimizations' ? 'Vardiya Önerileri' : 'Overbooking Tahminleri'}
          </button>
        ))}
      </div>

      {tab === 'optimizations' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Başlangıç:</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Bitiş:</label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-2xl"><TrendingUp className="h-6 w-6 text-green-500" /></div>
              <div className="mt-1 text-xl font-bold text-gray-900">{highDemand.length}</div>
              <div className="text-xs text-gray-500">Yüksek Talep (kapasite artırılmalı)</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-2xl"><AlertTriangle className="h-6 w-6 text-yellow-500" /></div>
              <div className="mt-1 text-xl font-bold text-gray-900">{lowDemand.length}</div>
              <div className="text-xs text-gray-500">Düşük Talep (kapasite düşürülebilir)</div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-2xl"><Calendar className="h-6 w-6 text-blue-500" /></div>
              <div className="mt-1 text-xl font-bold text-gray-900">{optimizations?.length ?? 0}</div>
              <div className="text-xs text-gray-500">Toplam Öneri</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {optLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Çalışan</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Tarih</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Önerilen</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Talep Skoru</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Sebep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(optimizations ?? []).length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">Öneri bulunamadı</td></tr>
                  ) : (optimizations ?? []).map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{s.employeeName}</td>
                      <td className="px-4 py-3 text-gray-600">{new Date(s.date).toLocaleDateString('tr-TR')}</td>
                      <td className="px-4 py-3 text-gray-600">{s.suggestedStart} - {s.suggestedEnd}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-12 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${s.expectedDemandScore >= 70 ? 'bg-green-500' : s.expectedDemandScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${s.expectedDemandScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{s.expectedDemandScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{s.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {tab === 'overbooking' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Tarih:</label>
            <input
              type="date"
              value={overbookingDate}
              onChange={e => setOverbookingDate(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {ovrLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Randevu</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">No-Show Olasılığı</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Risk</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Öneri</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {(overbookings ?? []).length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Overbooking önerisi bulunamadı</td></tr>
                  ) : (overbookings ?? []).map((o, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{o.appointmentId.slice(0, 8)}...</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-12 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${o.noShowProbability >= 0.5 ? 'bg-red-500' : 'bg-yellow-500'}`}
                              style={{ width: `${Math.min(o.noShowProbability * 100, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">%{Math.round(o.noShowProbability * 100)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          o.riskLevel === 'Çok Yüksek' ? 'bg-red-100 text-red-700' :
                          o.riskLevel === 'Yüksek' ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>{o.riskLevel}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{o.suggestion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
