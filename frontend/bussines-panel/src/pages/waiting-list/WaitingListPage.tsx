import { useState } from 'react'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { PageHeader } from '@/components/ui/PageHeader'
import { MobileHeaderActions } from '@/components/ui/MobileHeaderActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  addEntry,
  deleteEntry,
  markNotified,
  updateStatus,
} from '@/store/slices/waitingListSlice'
import type { WaitStatus } from '@/store/slices/waitingListSlice'
import {
  Bell,
  CalendarCheck,
  Clock,
  Mail,
  Phone,
  Plus,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import { useServices } from '@/hooks/useServices'

const STATUS_LABEL: Record<WaitStatus, string> = {
  waiting: 'Bekliyor',
  notified: 'Bildirildi',
  confirmed: 'Onayladı',
  cancelled: 'İptal',
  booked: 'Randevu Alındı',
}

const STATUS_COLOR: Record<WaitStatus, string> = {
  waiting: 'bg-amber-100 text-amber-700',
  notified: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  booked: 'bg-purple-100 text-purple-700',
}


export function WaitingListPage() {
  const dispatch = useAppDispatch()
  const list = useAppSelector((state) => state.waitingList.list)
  const { data: servicesData } = useServices({ isActive: true, pageSize: 100 })
  const apiServices = servicesData?.items ?? []

  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState<WaitStatus | 'all'>('all')
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    serviceName: '',
    preferredDate: '',
    preferredTimeFrom: '',
    preferredTimeTo: '',
    notes: '',
  })
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; serviceName?: string; preferredDate?: string }>({})

  function validateForm() {
    const newErrors: { name?: string; phone?: string; email?: string; serviceName?: string; preferredDate?: string } = {}
    if (!form.name.trim()) newErrors.name = 'Bu bölüm boş bırakılamaz.'
    if (!form.phone) newErrors.phone = 'Bu bölüm boş bırakılamaz.'
    else if (!/^\+905\d{9}$/.test(form.phone)) newErrors.phone = 'Telefon formatı: +90 5XX XXX XX XX'
    if (form.email) {
      if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = 'Geçerli bir e-posta girin.'
    }
    if (!form.serviceName) newErrors.serviceName = 'Bu bölüm boş bırakılamaz.'
    if (!form.preferredDate) newErrors.preferredDate = 'Bu bölüm boş bırakılamaz.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleAddEntry() {
    if (!validateForm()) return
    dispatch(addEntry({
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      serviceId: form.serviceName.toLowerCase().replace(/\s+/g, '-'),
      serviceName: form.serviceName,
      preferredDate: form.preferredDate,
      preferredTimeFrom: form.preferredTimeFrom,
      preferredTimeTo: form.preferredTimeTo,
      notes: form.notes || undefined,
    }))
    setForm({
      name: '',
      phone: '',
      email: '',
      serviceName: '',
      preferredDate: '',
      preferredTimeFrom: '',
      preferredTimeTo: '',
      notes: '',
    })
    setErrors({})
    setShowAdd(false)
  }

  const filtered = filter === 'all' ? list : list.filter((entry) => entry.status === filter)
  const waitingCount = list.filter((entry) => entry.status === 'waiting').length
  const notifiedCount = list.filter((entry) => entry.status === 'notified').length
  const bookedCount = list.filter((entry) => entry.status === 'booked').length
  const confirmedCount = list.filter((entry) => entry.status === 'confirmed').length
  const cancelledCount = list.filter((entry) => entry.status === 'cancelled').length

  const filterOptions: { value: WaitStatus | 'all'; label: string; count: number }[] = [
    { value: 'all', label: 'Tümü', count: list.length },
    { value: 'waiting', label: 'Bekliyor', count: waitingCount },
    { value: 'notified', label: 'Bildirildi', count: notifiedCount },
    { value: 'confirmed', label: 'Onayladı', count: confirmedCount },
    { value: 'booked', label: 'Randevu Alındı', count: bookedCount },
    { value: 'cancelled', label: 'İptal', count: cancelledCount },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bekleme Listesi"
        description="Dolu randevu slotları için bekleme listesini yönetin, açılan yerleri bildirin"
      >
        <div className="hidden lg:block">
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Listeye Ekle
          </Button>
        </div>
        <MobileHeaderActions
          actions={[{ label: 'Listeye Ekle', icon: <Plus className="h-4 w-4" />, onClick: () => setShowAdd(true) }]}
        />
      </PageHeader>

      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible">
        {[
          { label: 'Bekleyen', value: waitingCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Bildirildi', value: notifiedCount, icon: Bell, color: 'text-blue-600 bg-blue-50' },
          { label: 'Randevu Alındı', value: bookedCount, icon: CalendarCheck, color: 'text-green-600 bg-green-50' },
        ].map((stat) => (
          <Card key={stat.label} className="min-w-[78%] shrink-0 snap-center lg:min-w-0 lg:shrink lg:snap-align-none">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.color)}><stat.icon className="h-5 w-5" /></div>
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
          <CardHeader><CardTitle className="text-sm">Bekleme Listesine Ekle</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ad Soyad *"
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full" />
                {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
              </div>
              <div>
                <PhoneInput value={form.phone} onChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
                {errors.phone && <div className="text-xs text-red-500 mt-1">{errors.phone}</div>}
              </div>
              <div>
                <input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="E-posta (opsiyonel)"
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full" type="email" />
                {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
              </div>
              <div>
                <select value={form.serviceName} onChange={(e) => setForm((f) => ({ ...f, serviceName: e.target.value }))}
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full">
                  <option value="">Hizmet seçin...</option>
                  {apiServices.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                {errors.serviceName && <div className="text-xs text-red-500 mt-1">{errors.serviceName}</div>}
              </div>
              <div>
                <input type="date" value={form.preferredDate} onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full" />
                {errors.preferredDate && <div className="text-xs text-red-500 mt-1">{errors.preferredDate}</div>}
              </div>
              <div className="flex gap-2">
                <input type="time" value={form.preferredTimeFrom} onChange={(e) => setForm((f) => ({ ...f, preferredTimeFrom: e.target.value }))}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                <input type="time" value={form.preferredTimeTo} onChange={(e) => setForm((f) => ({ ...f, preferredTimeTo: e.target.value }))}
                  className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Notlar"
                  className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddEntry}>Ekle</Button>
              <Button size="sm" variant="outline" onClick={() => setShowAdd(false)}>İptal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border',
              filter === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
            )}
          >
            {option.label}
            <span className={cn('rounded-full px-1.5 py-0.5 text-[10px]', filter === option.value ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>
              {option.count}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && !showAdd && (
          <Card>
            <CardContent className="py-16 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Bekleme listesi boş</p>
              <p className="text-gray-400 text-sm mt-1">Yeni bir kayıt ekleyerek müsait slotlar için sırayı başlatın.</p>
              <Button className="mt-4" onClick={() => setShowAdd(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> İlk Kaydı Ekle
              </Button>
            </CardContent>
          </Card>
        )}
        {filtered.map((entry) => (
          <Card key={entry.id} className="overflow-hidden">
            <CardContent className="py-4">
              <div className="flex items-start gap-4">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">{entry.name[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">{entry.name}</span>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full', STATUS_COLOR[entry.status])}>
                      {STATUS_LABEL[entry.status]}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{entry.serviceName} · {entry.preferredDate} · {entry.preferredTimeFrom || 'Saat yok'}-{entry.preferredTimeTo || 'Saat yok'}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-gray-400"><Phone className="h-3 w-3" />{entry.phone}</span>
                    {entry.email && <span className="flex items-center gap-1 text-xs text-gray-400"><Mail className="h-3 w-3" />{entry.email}</span>}
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">"{entry.notes}"</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {entry.status === 'waiting' && (
                    <button onClick={() => dispatch(markNotified(entry.id))} title="Bildir" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                      <Bell className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {entry.status === 'notified' && (
                    <button onClick={() => dispatch(updateStatus({ id: entry.id, status: 'confirmed' }))} title="Onayladı İşaretle" className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100">
                      <CalendarCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {(entry.status === 'confirmed' || entry.status === 'notified') && (
                    <button onClick={() => dispatch(updateStatus({ id: entry.id, status: 'booked' }))} title="Randevuya Dönüştür" className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100">
                      <CalendarCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {(entry.status === 'waiting' || entry.status === 'notified') && (
                    <button onClick={() => dispatch(updateStatus({ id: entry.id, status: 'cancelled' }))} title="İptal Et" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <XCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {(entry.status === 'cancelled' || entry.status === 'booked') && (
                    <button onClick={() => setDeleteEntryId(entry.id)} title="Sil" className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {deleteEntryId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Kayıt silinsin mi?</h3>
            <p className="text-sm text-gray-600 mb-4">Bu bekleme listesi kaydını silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteEntryId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button
                onClick={() => {
                  dispatch(deleteEntry(deleteEntryId))
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
