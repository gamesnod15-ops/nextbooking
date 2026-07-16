'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { Calendar, Clock, XCircle, AlertCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const STATUS_STYLES: Record<string, string> = {
  confirmed:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending:      'bg-yellow-100 text-yellow-700 border-yellow-200',
  cancelled:    'bg-red-100 text-red-700 border-red-200',
  completed:    'bg-blue-100 text-blue-700 border-blue-200',
}

const STATUS_LABELS: Record<string, string> = {
  confirmed:    'Onaylandı',
  pending:      'Bekliyor',
  cancelled:    'İptal Edildi',
  completed:    'Tamamlandı',
}

type Appointment = {
  id: string
  serviceName: string
  employeeName: string
  customerName: string
  customerPhone: string
  startTime: string
  endTime: string
  status: string
  price: number
  notes?: string
}

export default function MusteriPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 12

  useEffect(() => {
    setPage(1)
  }, [filter])

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const meRes = await axios.get('/api/v1/Users/me')
        const email = meRes.data.email
        if (!email) {
          setAppointments([])
          setLoading(false)
          return
        }
        const params: Record<string, unknown> = {
          search: email,
          pageNumber: page,
          pageSize,
        }
        if (filter !== 'all') params.status = filter
        const res = await axios.get('/api/v1/Appointments', { params })
        const data = res.data
        setAppointments(data?.items || [])
        setTotalPages(data?.totalPages || 1)
      } catch {
        setError('Randevular yüklenirken bir hata oluştu.')
      } finally {
        setLoading(false)
      }
    })()
  }, [filter, page])

  async function cancelAppointment(id: string) {
    if (!confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return
    try {
      await axios.post(`/api/v1/Appointments/${id}/cancel`, { reason: 'Müşteri tarafından iptal' })
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a))
    } catch {
      alert('İptal işlemi başarısız oldu.')
    }
  }

  const tabs = [
    { key: 'all',       label: 'Tümü' },
    { key: 'confirmed', label: 'Onaylanan' },
    { key: 'pending',   label: 'Bekleyen' },
    { key: 'completed', label: 'Tamamlanan' },
    { key: 'cancelled', label: 'İptal' },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Randevularım</h1>
          <p className="text-sm text-gray-500 mt-1">Tüm randevularınızı görüntüleyin ve yönetin.</p>
        </div>
        <Link
          href="/isletmeler"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5 shrink-0"
        >
          Yeni Randevu Al <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-2" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <Calendar className="mx-auto h-10 w-10 text-gray-300 mb-3" />
          <h3 className="text-base font-semibold text-gray-900">Randevu bulunmuyor</h3>
          <p className="text-sm text-gray-500 mt-1">Henüz hiçbir randevunuz yok.</p>
          <Link
            href="/isletmeler"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5"
          >
            İşletmelere Göz At <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {appointments.map(appt => (
              <div key={appt.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-gray-900 truncate flex-1">{appt.serviceName}</h3>
                  <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[appt.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {STATUS_LABELS[appt.status] || appt.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{appt.employeeName}</p>
                <div className="space-y-1.5 text-xs text-gray-500 mb-3 flex-1">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    {new Date(appt.startTime).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    {new Date(appt.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - {new Date(appt.endTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <p className="text-base font-bold text-gray-900">{appt.price?.toLocaleString('tr-TR')} ₺</p>
                  {(appt.status === 'confirmed' || appt.status === 'pending') && (
                    <button onClick={() => cancelAppointment(appt.id)}
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                      <XCircle className="h-3 w-3" /> İptal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
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
        </>
      )}
    </div>
  )
}
