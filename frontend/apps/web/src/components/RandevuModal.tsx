'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { X, Loader2, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { api, ApiError } from '@/lib/api'

interface RandevuModalProps {
  open: boolean
  onClose: () => void
  businessName: string
  businessId: string
  services: { id: string; name: string; durationMinutes: number; price: number }[]
}

interface AvailabilityDay {
  date: string
  hasAvailability: boolean
  availableEmployeeCount: number
}

interface TimeSlot {
  startTime: string
  endTime: string
  isAvailable: boolean
}

const MONTHS = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
const DAY_NAMES = ['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']

export function RandevuModal({ open, onClose, businessName, businessId, services }: RandevuModalProps) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [form, setForm] = useState({ ad: '', soyad: '', telefon: '', email: '', sehir: '', aciklama: '' })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Calendar state
  const today = useMemo(() => new Date(), [])
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth())
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [availability, setAvailability] = useState<Map<string, AvailabilityDay>>(new Map())
  const [availabilityLoading, setAvailabilityLoading] = useState(false)

  // Time slots state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  const selectedServiceData = useMemo(
    () => services.find(s => s.id === selectedService),
    [selectedService, services]
  )

  // Fetch availability when service is selected or month changes
  useEffect(() => {
    if (!selectedService || step < 2) return
    setAvailabilityLoading(true)
    setError(null)

    fetch(`/api/v1/businesses/${businessId}/availability?serviceId=${selectedService}&month=${calendarMonth + 1}&year=${calendarYear}`)
      .then(r => r.ok ? r.json() : [])
      .then((data: AvailabilityDay[]) => {
        const map = new Map<string, AvailabilityDay>()
        data.forEach(d => map.set(d.date, d))
        setAvailability(map)
      })
      .catch(() => setError('Takvim yüklenirken bir hata oluştu.'))
      .finally(() => setAvailabilityLoading(false))
  }, [selectedService, calendarMonth, calendarYear, businessId, step])

  // Fetch time slots when date is selected
  useEffect(() => {
    if (!selectedDate || !selectedService) return
    setSlotsLoading(true)
    setSelectedTime(null)
    setError(null)

    fetch(`/api/v1/appointments/available-slots?serviceId=${selectedService}&date=${selectedDate}&businessId=${businessId}`)
      .then(r => r.ok ? r.json() : [])
      .then(setTimeSlots)
      .catch(() => setError('Saatler yüklenirken bir hata oluştu.'))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate, selectedService, businessId])

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1)
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7 // Monday = 0
    const days: (Date | null)[] = []

    for (let i = 0; i < startPad; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(calendarYear, calendarMonth, d))
    }
    return days
  }, [calendarMonth, calendarYear])

  function formatDate(d: Date) {
    return d.toISOString().split('T')[0]
  }

  function isDateInPast(d: Date) {
    const date = new Date(d)
    date.setHours(23, 59, 59, 999)
    return date < today
  }

  function getAvailabilityForDate(d: Date): AvailabilityDay | undefined {
    return availability.get(formatDate(d))
  }

  function canMonthGoBack() {
    return calendarYear > today.getFullYear() || (calendarYear === today.getFullYear() && calendarMonth > today.getMonth())
  }

  function prevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(prev => prev - 1)
    } else {
      setCalendarMonth(prev => prev - 1)
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(prev => prev + 1)
    } else {
      setCalendarMonth(prev => prev + 1)
    }
  }

  function formatPhoneDisplay(raw: string) {
    const digits = raw.replace(/\D/g, '')
    const local = digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
    const d = local.slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm(prev => ({ ...prev, telefon: digits ? `+90${digits}` : '' }))
  }

  function resetForm() {
    setStep(1)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setForm({ ad: '', soyad: '', telefon: '', email: '', sehir: '', aciklama: '' })
    setLoading(false)
    setError(null)
    setSuccess(false)
    setTimeSlots([])
    setCalendarMonth(today.getMonth())
    setCalendarYear(today.getFullYear())
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit() {
    if (!selectedService || !selectedDate || !selectedTime || !form.ad || !form.soyad || !form.telefon || !form.email || !form.sehir) {
      setError('Lütfen tüm zorunlu alanları doldurun.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await api.post('/api/v1/appointments', {
        serviceId: selectedService,
        employeeId: null,
        date: selectedDate,
        time: selectedTime,
        firstName: form.ad,
        lastName: form.soyad,
        phone: form.telefon,
        email: form.email,
        city: form.sehir,
        notes: form.aciklama,
      })
      setSuccess(true)
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message || 'Randevu oluşturulurken bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const stepLabels = ['Hizmet', 'Tarih', 'Saat', 'Bilgiler']
  const totalSteps = stepLabels.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Randevu Al</h2>
            <p className="text-xs text-gray-500">{businessName}</p>
          </div>
          <button onClick={handleClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-16 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Randevu Oluşturuldu!</h3>
            <p className="mt-2 text-sm text-gray-500 text-center max-w-xs">
              Randevu talebiniz alındı. İşletme sizinle iletişime geçecektir.
            </p>
            <button onClick={handleClose} className="mt-6 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 transition-colors">
              Kapat
            </button>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="mb-6 flex items-center gap-2">
              {stepLabels.map((label, i) => {
                const s = i + 1
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div className={'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ' + (step >= s ? 'bg-brand-500 text-black' : 'bg-gray-100 text-gray-400')}>
                      {s}
                    </div>
                    <span className={'text-xs font-medium ' + (step >= s ? 'text-brand-600' : 'text-gray-400')}>
                      {label}
                    </span>
                    {s < totalSteps && <div className="h-px w-6 bg-gray-200" />}
                  </div>
                )
              })}
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Hizmet Seçin</p>
                {services.length === 0 ? (
                  <p className="text-sm text-gray-400">Henüz hizmet eklenmemiş.</p>
                ) : (
                  services.map((svc) => (
                    <button key={svc.id} onClick={() => setSelectedService(svc.id)}
                      className={'w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all ' + (selectedService === svc.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 bg-white hover:border-brand-300')}>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{svc.durationMinutes} dk</p>
                      </div>
                      <p className="text-sm font-bold text-brand-600">{svc.price.toLocaleString('tr-TR')} ₺</p>
                    </button>
                  ))
                )}
                <div className="pt-4 flex justify-end">
                  <button onClick={() => { setStep(2); setCalendarMonth(today.getMonth()); setCalendarYear(today.getFullYear()) }} disabled={!selectedService}
                    className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Devam Et
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Tarih Seçin</p>
                  {selectedServiceData && (
                    <span className="text-xs text-gray-500">{selectedServiceData.name}</span>
                  )}
                </div>

                {/* Calendar navigation */}
                <div className="flex items-center justify-between">
                  <button onClick={prevMonth} disabled={!canMonthGoBack()}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold text-gray-900">{MONTHS[calendarMonth]} {calendarYear}</span>
                  <button onClick={nextMonth}
                    className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
                  {DAY_NAMES.map(d => <div key={d} className="py-1">{d}</div>)}
                </div>

                {/* Calendar grid */}
                {availabilityLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((d, i) => {
                      if (!d) return <div key={`empty-${i}`} />
                      const dateStr = formatDate(d)
                      const isPast = isDateInPast(d)
                      const isSelected = selectedDate === dateStr
                      const isToday = dateStr === formatDate(today)
                      const dayAvail = getAvailabilityForDate(d)
                      const hasSlots = dayAvail?.hasAvailability ?? false

                      let cls = 'flex flex-col items-center rounded-lg py-2 px-1 text-xs transition-colors '
                      if (isPast) {
                        cls += 'text-gray-300 cursor-not-allowed '
                      } else if (isSelected) {
                        cls += 'bg-brand-500 text-black '
                      } else if (isToday) {
                        cls += 'bg-brand-50 text-brand-700 '
                      } else if (hasSlots) {
                        cls += 'bg-emerald-50 text-gray-900 hover:bg-emerald-100 cursor-pointer '
                      } else {
                        cls += 'bg-gray-50 text-gray-400 cursor-not-allowed '
                      }

                      return (
                        <button key={dateStr} onClick={() => { if (!isPast && hasSlots) { setSelectedDate(dateStr); setSelectedTime(null) } }}
                          className={cls} disabled={isPast || !hasSlots}>
                          <span className="text-lg font-bold">{d.getDate()}</span>
                          {!isPast && hasSlots && (
                            <span className="text-[8px] text-emerald-600 font-semibold">Uygun</span>
                          )}
                          {!isPast && !hasSlots && !isSelected && (
                            <span className="text-[8px] text-gray-300">Dolu</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    Geri
                  </button>
                  <button onClick={() => setStep(3)} disabled={!selectedDate}
                    className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Devam Et
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Saat Seçin</p>
                  <span className="text-xs text-gray-500">{selectedDate}</span>
                </div>

                {slotsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                  </div>
                ) : timeSlots.filter(s => s.isAvailable).length === 0 ? (
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-6 text-center">
                    <p className="text-sm text-gray-500">Bu tarihte uygun saat bulunmamaktadır.</p>
                    <button onClick={() => setStep(2)} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors">
                      Başka bir tarih seçin
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.filter(s => s.isAvailable).map((slot) => {
                      const timeStr = new Date(slot.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                      return (
                        <button key={slot.startTime} onClick={() => setSelectedTime(timeStr)}
                          className={'rounded-lg border py-2.5 text-xs font-medium transition-colors ' + (selectedTime === timeStr ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500' : 'border-gray-200 text-gray-600 hover:border-brand-300')}>
                          {timeStr}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="pt-4 flex justify-between">
                  <button onClick={() => setStep(2)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    Geri
                  </button>
                  <button onClick={() => setStep(4)} disabled={!selectedTime}
                    className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Devam Et
                  </button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-gray-700">Kişisel Bilgiler</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Ad *</label>
                    <input name="ad" value={form.ad} onChange={handleFormChange} placeholder="Ad"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Soyad *</label>
                    <input name="soyad" value={form.soyad} onChange={handleFormChange} placeholder="Soyad"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Telefon *</label>
                  <div className="flex w-full overflow-hidden rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-shadow">
                    <span className="flex shrink-0 items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500">+90</span>
                    <input name="telefon" value={formatPhoneDisplay(form.telefon)} onChange={handlePhoneChange} placeholder="5XX XXX XX XX" type="tel"
                      className="flex-1 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">E-posta *</label>
                  <input name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="ornek@email.com"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Şehir *</label>
                  <input name="sehir" value={form.sehir} onChange={handleFormChange} placeholder="Şehir"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Açıklama</label>
                  <textarea name="aciklama" value={form.aciklama} onChange={handleFormChange} rows={3} placeholder="Randevu ile ilgili eklemek istedikleriniz..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none" />
                </div>

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Randevu Özeti</p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Hizmet</span>
                    <span className="font-medium text-gray-900">{services.find(s => s.id === selectedService)?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Tarih</span>
                    <span className="font-medium text-gray-900">{selectedDate}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Saat</span>
                    <span className="font-medium text-gray-900">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Ücret</span>
                    <span className="font-medium text-brand-600">{services.find(s => s.id === selectedService)?.price.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button onClick={() => setStep(3)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    Geri
                  </button>
                  <button onClick={handleSubmit} disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Gönderiliyor...</> : 'Randevu Oluştur'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
