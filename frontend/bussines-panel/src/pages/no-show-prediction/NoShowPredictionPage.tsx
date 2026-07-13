import { useState } from 'react'
import { ShieldAlert, Loader2, Filter } from 'lucide-react'
import {
  useNoShowPredictions,
  usePredictNoShow,
} from '@/hooks/useNoShowPrediction'
import { useAppointments } from '@/hooks/useAppointments'

export function NoShowPredictionPage() {
  const [page, setPage] = useState(1)
  const [riskFilter, setRiskFilter] = useState<string>('')
  const [showPredictModal, setShowPredictModal] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')

  const { data, isLoading } = useNoShowPredictions({
    pageNumber: page,
    pageSize: 20,
    riskLevel: riskFilter || undefined,
  })
  const predictMutation = usePredictNoShow()
  const { data: appointmentsData } = useAppointments({ pageSize: 50 })

  const predictions = data?.items ?? []

  const riskColors: Record<string, string> = {
    'Düşük': 'bg-green-100 text-green-700',
    'Orta': 'bg-yellow-100 text-yellow-700',
    'Yüksek': 'bg-orange-100 text-orange-700',
    'Çok Yüksek': 'bg-red-100 text-red-700',
  }

  async function handlePredict() {
    if (!selectedAppointmentId || !selectedCustomerId) return
    await predictMutation.mutateAsync({
      appointmentId: selectedAppointmentId,
      customerId: selectedCustomerId,
    })
    setShowPredictModal(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">No-Show Tahmin Sistemi</h1>
          <p className="text-sm text-gray-500">Randevuya gelmeme riskini tahmin edin ve önlem alın</p>
        </div>
        <button
          onClick={() => setShowPredictModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <ShieldAlert className="h-4 w-4" /> Tahmin Yap
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <select
            value={riskFilter}
            onChange={e => { setRiskFilter(e.target.value); setPage(1) }}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">Tüm Risk Seviyeleri</option>
            <option value="Düşük">Düşük</option>
            <option value="Orta">Orta</option>
            <option value="Yüksek">Yüksek</option>
            <option value="Çok Yüksek">Çok Yüksek</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Toplam Tahmin', value: data?.totalCount ?? 0, icon: '📊' },
          { label: 'Yüksek Risk', value: predictions.filter(p => p.riskLevel === 'Yüksek' || p.riskLevel === 'Çok Yüksek').length, icon: '🔴' },
          { label: 'Kapora Gerekli', value: predictions.filter(p => p.requiresDeposit).length, icon: '💰' },
          { label: 'Doğrulanan', value: predictions.filter(p => p.actualNoShow !== null).length, icon: '✅' },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl">{stat.icon}</div>
            <div className="mt-1 text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Müşteri</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Hizmet</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Tarih</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Risk</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Olasılık</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Kapora</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Sonuç</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {predictions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-400">Tahmin bulunamadı</td></tr>
              ) : predictions.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.customerName}</div>
                    <div className="text-xs text-gray-400">{p.customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.serviceName}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(p.appointmentStart).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${riskColors[p.riskLevel] || 'bg-gray-100 text-gray-500'}`}>
                      {p.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${p.probability >= 0.5 ? 'bg-red-500' : p.probability >= 0.3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(p.probability * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">%{Math.round(p.probability * 100)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {p.requiresDeposit ? (
                      <span className="text-yellow-600 font-medium">Gerekli</span>
                    ) : (
                      <span className="text-gray-400">Gerekmez</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.actualNoShow === null ? (
                      <span className="text-gray-400">Bekleniyor</span>
                    ) : p.actualNoShow ? (
                      <span className="text-red-600 font-medium">Gelmedi</span>
                    ) : (
                      <span className="text-green-600 font-medium">Geldi</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data?.totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= (data?.totalPages ?? 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
        </div>
      )}

      {showPredictModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <h2 className="text-base font-bold text-gray-900 mb-4">No-Show Tahmini Yap</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Randevu</label>
                <select
                  value={selectedAppointmentId}
                  onChange={e => setSelectedAppointmentId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                >
                  <option value="">Seçiniz</option>
                  {(appointmentsData?.items ?? []).map(a => (
                    <option key={a.id} value={a.id}>
                      {a.customerName} - {a.serviceName} ({new Date(a.startTime).toLocaleDateString('tr-TR')})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Müşteri ID</label>
                <input
                  value={selectedCustomerId}
                  onChange={e => setSelectedCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Müşteri ID girin"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setShowPredictModal(false)} className="flex-1 rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">İptal</button>
              <button
                onClick={handlePredict}
                disabled={!selectedAppointmentId || !selectedCustomerId || predictMutation.isPending}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {predictMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Tahmin Et'}
              </button>
            </div>
            {predictMutation.data && (
              <div className="mt-4 rounded-lg bg-gray-50 p-4">
                <p className="text-sm font-medium">Olasılık: %{Math.round(predictMutation.data.probability * 100)}</p>
                <p className="text-sm">Risk Seviyesi: {predictMutation.data.riskLevel}</p>
                {predictMutation.data.requiresDeposit && (
                  <p className="text-sm text-yellow-600">Kapora önerisi: {predictMutation.data.recommendedDepositAmount} TL</p>
                )}
                {predictMutation.data.factors && (
                  <p className="text-xs text-gray-500 mt-1">Faktörler: {predictMutation.data.factors}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
