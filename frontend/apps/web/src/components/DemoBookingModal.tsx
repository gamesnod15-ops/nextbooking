'use client'

import { useState, useMemo } from 'react'
import {
  X, Loader2, Sparkles, Store, Check, ChevronRight,
  Star, Clock,
} from 'lucide-react'

const MOCK_BUSINESSES = [
  { id: 'b1', name: 'Güzellik Merkezi Luna', category: 'Güzellik Salonu', rating: 4.8, img: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&q=80' },
  { id: 'b2', name: 'Berber Ali Usta', category: 'Kuaför', rating: 4.6, img: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=200&q=80' },
  { id: 'b3', name: 'Diş Kliniği DentArt', category: 'Diş Kliniği', rating: 4.9, img: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=200&q=80' },
  { id: 'b4', name: 'Masaj & Spa Huzur', category: 'Spa & Masaj', rating: 4.7, img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=200&q=80' },
  { id: 'b5', name: 'Spor Salonu FitLife', category: 'Spor Salonu', rating: 4.5, img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=80' },
]

const MOCK_SERVICES: Record<string, { id: string; name: string; durationMinutes: number; price: number }[]> = {
  b1: [
    { id: 's1', name: 'Cilt Bakımı', durationMinutes: 60, price: 400 },
    { id: 's2', name: 'Manikür', durationMinutes: 45, price: 250 },
    { id: 's3', name: 'Pedikür', durationMinutes: 45, price: 300 },
    { id: 's4', name: 'Kaş & Kirpik', durationMinutes: 30, price: 150 },
  ],
  b2: [
    { id: 's5', name: 'Saç Kesimi', durationMinutes: 30, price: 150 },
    { id: 's6', name: 'Sakal Kesimi', durationMinutes: 20, price: 80 },
    { id: 's7', name: 'Saç & Sakal Bakımı', durationMinutes: 45, price: 200 },
  ],
  b3: [
    { id: 's8', name: 'Diş Beyazlatma', durationMinutes: 60, price: 1000 },
    { id: 's9', name: 'Diş Taşı Temizliği', durationMinutes: 30, price: 500 },
    { id: 's10', name: 'Muayene', durationMinutes: 30, price: 300 },
  ],
  b4: [
    { id: 's11', name: 'Klasik Masaj', durationMinutes: 60, price: 500 },
    { id: 's12', name: 'Aroma Terapi', durationMinutes: 90, price: 700 },
    { id: 's13', name: 'Sırt & Boyun Masajı', durationMinutes: 45, price: 350 },
  ],
  b5: [
    { id: 's14', name: 'Kişisel Antrenör', durationMinutes: 60, price: 400 },
    { id: 's15', name: 'Yoga Dersi', durationMinutes: 60, price: 250 },
    { id: 's16', name: 'Pilates', durationMinutes: 45, price: 200 },
  ],
}

const MOCK_TIME_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30',
]

interface DemoBookingModalProps {
  open: boolean
  onClose: () => void
}

export function DemoBookingModal({ open, onClose }: DemoBookingModalProps) {
  const [step, setStep] = useState(1)
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const today = new Date()
  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      days.push(d)
    }
    return days
  }, [])

  const months = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  const days = ['Paz','Pzt','Sal','Çar','Per','Cum','Cmt']

  const currentServices = selectedBusiness ? MOCK_SERVICES[selectedBusiness] : []
  const currentBusiness = selectedBusiness ? MOCK_BUSINESSES.find(b => b.id === selectedBusiness) : null
  const currentService = selectedService ? currentServices?.find(s => s.id === selectedService) : null

  function resetForm() {
    setStep(1)
    setSelectedBusiness(null)
    setSelectedService(null)
    setSelectedDate(null)
    setSelectedTime(null)
    setLoading(false)
    setSuccess(false)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  async function handleSubmit() {
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setLoading(false)
    setSuccess(true)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <Sparkles className="h-4 w-4 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hemen Dene</h2>
              <p className="text-xs text-gray-500">Ücretsiz demo randevu deneyimi</p>
            </div>
          </div>
          <button onClick={handleClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-16 px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <Check className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Randevu Oluşturuldu!</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-xs">
              {currentBusiness?.name} için {currentService?.name} randevunuz {selectedDate} {selectedTime} olarak alındı.
            </p>
            <div className="mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4 w-full max-w-xs text-left space-y-2">
              <p className="text-xs font-semibold text-gray-700">Randevu Özeti</p>
              <div className="flex justify-between text-xs text-gray-600">
                <span>İşletme</span>
                <span className="font-medium text-gray-900">{currentBusiness?.name}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Hizmet</span>
                <span className="font-medium text-gray-900">{currentService?.name}</span>
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
                <span className="font-medium text-brand-600">{currentService?.price.toLocaleString('tr-TR')} ₺</span>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              Gerçek randevu almak için{' '}
              <a href="/register" className="font-semibold text-brand-500 hover:text-brand-600 underline" onClick={handleClose}>
                ücretsiz kaydolun
              </a>
            </p>
            <button onClick={handleClose} className="mt-4 rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors">
              Kapat
            </button>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="mb-6 flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step >= s ? 'bg-brand-500 text-black' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {s}
                  </div>
                  <span className={`text-xs font-medium ${step >= s ? 'text-brand-600' : 'text-gray-400'}`}>
                    {s === 1 ? 'İşletme' : s === 2 ? 'Hizmet' : 'Tarih & Saat'}
                  </span>
                  {s < 3 && <div className="h-px w-6 bg-gray-200" />}
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700">Bir işletme seçin</p>
                <p className="text-xs text-gray-400 mb-4">Randevu almak istediğiniz işletmeyi seçin ve adımları takip edin.</p>
                {MOCK_BUSINESSES.map((biz) => (
                  <button
                    key={biz.id}
                    onClick={() => setSelectedBusiness(biz.id)}
                    className={`w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all ${
                      selectedBusiness === biz.id
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                      <img src={biz.img} alt={biz.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{biz.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{biz.category}</span>
                        <span className="flex items-center gap-0.5 text-xs text-amber-500">
                          <Star className="h-3 w-3 fill-current" /> {biz.rating}
                        </span>
                      </div>
                    </div>
                    {selectedBusiness === biz.id && (
                      <Check className="h-5 w-5 shrink-0 text-brand-500" />
                    )}
                  </button>
                ))}
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedBusiness}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Devam Et <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">{currentBusiness?.name}</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Hizmet seçin</p>
                {currentServices.map((svc) => (
                  <button
                    key={svc.id}
                    onClick={() => setSelectedService(svc.id)}
                    className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition-all ${
                      selectedService === svc.id
                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                        : 'border-gray-200 bg-white hover:border-brand-300'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                      <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <Clock className="h-3 w-3" /> {svc.durationMinutes} dk
                      </p>
                    </div>
                    <p className="text-sm font-bold text-brand-600">{svc.price.toLocaleString('tr-TR')} ₺</p>
                  </button>
                ))}
                <div className="pt-4 flex justify-between">
                  <button onClick={() => setStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    Geri
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedService}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Devam Et <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{currentBusiness?.name}</span>
                  <ChevronRight className="h-3 w-3 text-gray-300" />
                  <span className="text-sm font-medium text-gray-700">{currentService?.name}</span>
                </div>

                <p className="text-sm font-medium text-gray-700">Tarih Seçin</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {weekDays.map((d) => {
                    const dateStr = d.toISOString().split('T')[0]
                    const isSelected = selectedDate === dateStr
                    const isToday = dateStr === today.toISOString().split('T')[0]
                    return (
                      <button
                        key={dateStr}
                        onClick={() => { setSelectedDate(dateStr); setSelectedTime(null) }}
                        className={`flex flex-col items-center rounded-lg py-2 px-1 text-xs transition-colors ${
                          isSelected
                            ? 'bg-brand-500 text-black'
                            : isToday
                              ? 'bg-brand-50 text-brand-700'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <span className="font-semibold">{days[d.getDay()]}</span>
                        <span className="text-lg font-bold">{d.getDate()}</span>
                        <span className="text-[10px]">{months[d.getMonth()].slice(0, 3)}</span>
                      </button>
                    )
                  })}
                </div>

                {selectedDate && (
                  <>
                    <p className="text-sm font-medium text-gray-700 pt-2">Saat Seçin</p>
                    <div className="grid grid-cols-4 gap-2">
                      {MOCK_TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedTime(t)}
                          className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                            selectedTime === t
                              ? 'border-brand-500 bg-brand-50 text-brand-700'
                              : 'border-gray-200 text-gray-600 hover:border-brand-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </>
                )}

                <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-700">Randevu Özeti</p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>İşletme</span>
                    <span className="font-medium text-gray-900">{currentBusiness?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Hizmet</span>
                    <span className="font-medium text-gray-900">{currentService?.name}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Süre</span>
                    <span className="font-medium text-gray-900">{currentService?.durationMinutes} dk</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Ücret</span>
                    <span className="font-medium text-brand-600">{currentService?.price.toLocaleString('tr-TR')} ₺</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-between">
                  <button onClick={() => setStep(2)} className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                    Geri
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedDate || !selectedTime || loading}
                    className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Oluşturuluyor...</> : 'Randevu Oluştur'}
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
