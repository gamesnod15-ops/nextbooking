import { useEffect, useMemo, useState } from 'react'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useServices } from '@/hooks/useServices'
import { useAppDispatch, useAppSelector } from '@/store'
import { addToQueue, clearCompleted, removeEntry, updateStatus } from '@/store/slices/queueSlice'
import type { QueueStatus } from '@/store/slices/queueSlice'
import {
  Bell,
  CheckCircle2,
  Clock,
  Play,
  Plus,
  SkipForward,
  Timer,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react'

const STATUS_LABEL: Record<QueueStatus, string> = {
  waiting: 'Bekliyor',
  called: 'Çağrıldı',
  serving: 'Hizmet Alıyor',
  done: 'Tamamlandı',
  cancelled: 'İptal',
}

const STATUS_COLOR: Record<QueueStatus, string> = {
  waiting: 'bg-amber-100 text-amber-700',
  called: 'bg-blue-100 text-blue-700',
  serving: 'bg-green-100 text-green-700',
  done: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

function formatWait(addedAtIso: string): string {
  const diff = Math.floor((Date.now() - new Date(addedAtIso).getTime()) / 60000)
  if (diff < 1) return 'Az önce'
  return `${diff} dk`
}

export function WalkinQueuePage() {
  const dispatch = useAppDispatch()
  const queue = useAppSelector((state) => state.queue.queue)
  const { data: servicesData } = useServices({ pageSize: 200, isActive: true })

  const serviceOptions = useMemo(
    () => (servicesData?.items ?? []).map((service) => service.name).filter((name) => name.trim().length > 0),
    [servicesData?.items],
  )

  const [showAdd, setShowAdd] = useState(false)
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', service: '', phone: '', email: '' })
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string }>({})

  useEffect(() => {
    if (!form.service && serviceOptions.length > 0) {
      setForm((prev) => ({ ...prev, service: serviceOptions[0] }))
    }
  }, [form.service, serviceOptions])

  function validateForm() {
    const newErrors: { name?: string; phone?: string; email?: string } = {}
    if (!form.name.trim()) newErrors.name = 'Bu bölüm boş bırakılamaz.'
    // Telefon zorunluysa aşağıdaki satırı açın:
    // if (!form.phone) newErrors.phone = 'Bu bölüm boş bırakılamaz.'
    if (form.phone) {
      // +905XXXXXXXXX formatı kontrolü
      if (!/^\+905\d{9}$/.test(form.phone)) {
        newErrors.phone = 'Telefon formatı: +90 5XX XXX XX XX'
      }
    }
    if (form.email) {
      // Basit email regex
      if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        newErrors.email = 'Geçerli bir e-posta girin.'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleAddToQueue() {
    if (!validateForm()) return
    dispatch(addToQueue({ name: form.name, service: form.service, phone: form.phone, email: form.email, estimatedWait: 15 }))
    setForm({ name: '', service: serviceOptions[0] ?? '', phone: '', email: '' })
    setErrors({})
    setShowAdd(false)
  }

  function callNext() {
    const next = queue.find((entry) => entry.status === 'waiting')
    if (next) dispatch(updateStatus({ id: next.id, status: 'called' }))
  }

  const waiting = queue.filter((entry) => entry.status === 'waiting')
  const active = queue.filter((entry) => entry.status === 'called' || entry.status === 'serving')
  const done = queue.filter((entry) => entry.status === 'done' || entry.status === 'cancelled')

  const stats = [
    { label: 'Bekleyen', value: waiting.length, icon: Users, color: 'text-amber-600 bg-amber-50' },
    { label: 'Hizmet Alan', value: active.length, icon: UserCheck, color: 'text-green-600 bg-green-50' },
    { label: 'Tamamlanan', value: done.filter((entry) => entry.status === 'done').length, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50' },
    { label: 'Ort. Bekleme', value: `${Math.max(0, Math.round(waiting.reduce((sum, entry) => sum + entry.estimatedWait, 0) / (waiting.length || 1)))} dk`, icon: Timer, color: 'text-purple-600 bg-purple-50' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sıra / Walk-in Yönetimi"
        description="Randevusuz gelen müşterileri sıraya alın ve beklemeleri yönetin"
      >
        {done.length > 0 && (
          <Button variant="outline" size="sm" onClick={() => dispatch(clearCompleted())}>
            Tamamlananları Temizle
          </Button>
        )}
        <Button onClick={callNext} variant="outline" disabled={waiting.length === 0}>
          <Bell className="h-4 w-4 mr-1.5" /> Sıradakini Çağır
        </Button>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="h-4 w-4 mr-1.5" /> Sıraya Ekle
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Sıraya Müşteri Ekle</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Müşteri adı *"
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
              </div>
              <div>
                <select
                  value={form.service}
                  onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
                  disabled={serviceOptions.length === 0}
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {serviceOptions.length === 0
                    ? <option value="">Aktif hizmet bulunamadı</option>
                    : serviceOptions.map((service) => <option key={service}>{service}</option>)}
                </select>
              </div>
              <div>
                <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
                {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
              </div>
              <div className="sm:col-span-3">
                <input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="E-posta (opsiyonel)"
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
                  type="email"
                />
                {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleAddToQueue}>Ekle</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>İptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bekleyenler */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Bekleyenler
              <Badge variant="warning" className="ml-auto">{waiting.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {waiting.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Bekleyen müşteri yok</p>
            )}
            {waiting.map((entry, idx) => (
              <div key={entry.id} className="rounded-lg border bg-amber-50/40 border-amber-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">#{entry.ticketNo}</span>
                      <span className="text-sm font-semibold text-gray-900">{entry.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{entry.service}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      <Clock className="inline h-3 w-3 mr-0.5" />
                      {formatWait(entry.addedAt)} önce · ~{entry.estimatedWait} dk
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {idx === 0 && (
                      <button onClick={() => dispatch(updateStatus({ id: entry.id, status: 'serving' }))} title="Çağır" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <Bell className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => dispatch(updateStatus({ id: entry.id, status: 'cancelled' }))} title="İptal" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Aktif */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Play className="h-4 w-4 text-green-500" />
              Aktif
              <Badge variant="success" className="ml-auto">{active.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {active.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Aktif müşteri yok</p>
            )}
            {active.map(entry => (
              <div key={entry.id} className={cn('rounded-lg border p-3', entry.status === 'serving' ? 'bg-green-50/40 border-green-100' : 'bg-blue-50/40 border-blue-100')}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">#{entry.ticketNo}</span>
                      <span className="text-sm font-semibold text-gray-900">{entry.name}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{entry.service}</p>
                    <span className={cn('inline-block text-[10px] px-2 py-0.5 rounded-full mt-1', STATUS_COLOR[entry.status])}>
                      {STATUS_LABEL[entry.status]}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {entry.status === 'called' && (
                      <button onClick={() => dispatch(updateStatus({ id: entry.id, status: 'serving' }))} title="Hizmet Başlat" className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                        <SkipForward className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => dispatch(updateStatus({ id: entry.id, status: 'done' }))} title="Tamamla" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tamamlanan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-gray-400" />
              Tamamlanan
              <Badge className="ml-auto bg-gray-100 text-gray-600 hover:bg-gray-100">{done.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {done.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">Henüz tamamlanan yok</p>
            )}
            {done.map(entry => (
              <div key={entry.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">#{entry.ticketNo}</span>
                      <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{entry.service}</p>
                    <span className={cn('inline-block text-[10px] px-2 py-0.5 rounded-full mt-1', STATUS_COLOR[entry.status])}>
                      {STATUS_LABEL[entry.status]}
                    </span>
                  </div>
                  <button onClick={() => setDeleteEntryId(entry.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {deleteEntryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Kayıt silinsin mi?</h3>
            <p className="text-sm text-gray-600 mb-4">Bu sıra kaydını silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteEntryId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button
                onClick={() => {
                  dispatch(removeEntry(deleteEntryId))
                  setDeleteEntryId(null)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
