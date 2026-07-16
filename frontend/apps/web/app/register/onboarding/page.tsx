'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api, ApiError } from '@/lib/api'
import {
  Scissors, Package, Users, Clock, Building2, CreditCard, Sparkles,
  Plus, Trash2, Check, ChevronLeft, ChevronRight, Loader2, PartyPopper,
  CalendarCheck,
} from 'lucide-react'

// ─── Step definitions ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 'services',  title: 'Hizmetler',        icon: Scissors,  desc: 'Sunduğunuz hizmetleri ekleyin' },
  { id: 'packages',  title: 'Paketler',          icon: Package,   desc: 'Hizmetlerinizi paketleyin (opsiyonel)' },
  { id: 'employees', title: 'Çalışanlar',        icon: Users,     desc: 'Ekibinizi tanıtın' },
  { id: 'hours',     title: 'Çalışma Saatleri',  icon: Clock,     desc: 'Açık olduğunuz saatleri belirleyin' },
  { id: 'branches',  title: 'Şubeler',           icon: Building2, desc: 'Diğer şubelerinizi ekleyin (opsiyonel)' },
  { id: 'plan',      title: 'Plan & Ödeme',      icon: CreditCard, desc: 'Size uygun planı seçin' },
] as const

const PLAN_CONFIGS = [
  { id: 'starter' as const,        name: 'Başlangıç',   price: '₺299/ay', badgeLabel: 'Başlangıç', accentClassName: 'border-gray-200 text-gray-600', features: ['Temel randevu, takvim ve müşteri yönetimi', 'Ödeme takibi ve temel raporlar', 'Tek şube ile hızlı başlangıç'] },
  { id: 'business' as const,       name: 'Büyüme',      price: '₺599/ay', badgeLabel: 'En Popüler', accentClassName: 'border-brand-200 bg-brand-50 text-brand-700', features: ['Kampanya, kupon ve indirim yönetimi', 'Online rezervasyon ve bekleme listesi', 'Çoklu şube yönetimi'] },
  { id: 'professional' as const,   name: 'Profesyonel',  price: '₺999/ay', badgeLabel: 'Profesyonel', accentClassName: 'border-amber-200 text-amber-700', features: ['Ürün satışı ve stok yönetimi', 'Personel performans takibi', 'Gelişmiş analitik & raporlar'] },
  { id: 'custom' as const,         name: 'Kurumsal',    price: 'Özel',    badgeLabel: 'Kurumsal',   accentClassName: 'border-purple-200 text-purple-700', features: ['Canlı chatbot ve walk-in sıra yönetimi', 'Özel entegrasyon ve onboarding', 'SLA garantisi & 7/24 destek'] },
]

const PLAN_PRICES: Record<string, number> = { starter: 299, business: 599, professional: 999, custom: 0 }

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2); const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

type DaySchedule = { open: boolean; start: string; end: string }
const defaultSchedule: DaySchedule[] = [
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '10:00', end: '18:00' },
  { open: false, start: '10:00', end: '18:00' },
]

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

function formatPhoneDisplay(raw: string) {
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
  const d = local.slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
}

function PhoneInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    onChange(digits ? `+90${digits}` : '')
  }
  return (
    <div className="flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-colors">
      <span className="flex shrink-0 select-none items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
        +90
      </span>
      <input
        type="tel"
        value={formatPhoneDisplay(value)}
        onChange={handleChange}
        placeholder={placeholder || '555 000 00 00'}
        autoComplete="tel"
        className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
      />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const role = localStorage.getItem('role')
    if (!token || (role !== 'business' && role !== 'tenant_admin')) {
      router.replace('/login')
      return
    }
    setAuthChecked(true)
  }, [router])

  function completeOnboarding(plan?: string) {
    localStorage.setItem('onboarding_done', '1')
    setDone(true)
  }

  function skipAll() {
    localStorage.setItem('onboarding_done', '1')
    const panelUrl = localStorage.getItem('business_panel_url')
    if (panelUrl) {
      window.location.href = panelUrl
    } else {
      router.push('/login')
    }
  }

  if (!authChecked) return <LoadingScreen />

  if (done) {
    const panelUrl = localStorage.getItem('business_panel_url')
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <PartyPopper className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Kurulum tamamlandı!</h2>
          <p className="mt-3 text-gray-600">İşletmeniz hazır, panelinize yönlendiriliyorsunuz…</p>
          <Loader2 className="mx-auto mt-5 h-6 w-6 animate-spin text-brand-500" />
          {panelUrl && (
            <a href={panelUrl} className="mt-4 inline-block text-sm text-brand-500 underline">
              Paneli manuel aç
            </a>
          )}
        </div>
      </div>
    )
  }

  const CurrentIcon = STEPS[step].icon

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <CalendarCheck className="h-4 w-4 text-black" />
            </div>
            <span className="text-base font-bold text-gray-900">NextBooking</span>
          </Link>
          <button type="button" onClick={skipAll} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Daha sonra tamamla
          </button>
        </div>
      </header>

      {/* Mobile progress */}
      <div className="border-b p-4 lg:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">
            Adım {step + 1}/{STEPS.length} · {STEPS[step].title}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 lg:grid lg:grid-cols-[240px_1fr] lg:gap-8 lg:py-10">
        {/* Left stepper rail */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-1">
            <div className="mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-500" />
              <span className="text-lg font-bold text-gray-900">Kurulum Sihirbazı</span>
            </div>
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const state = i < step ? 'done' : i === step ? 'active' : 'todo'
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    state === 'active' ? 'bg-brand-50 text-brand-600'
                    : state === 'done' ? 'text-gray-900 hover:bg-gray-50'
                    : 'text-gray-400'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    state === 'done' ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : state === 'active' ? 'border-brand-200 bg-brand-50 text-brand-600'
                    : 'border-gray-200 bg-white'
                  }`}>
                    {state === 'done' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{s.title}</span>
                    <span className="block text-xs text-gray-500">{s.desc}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
              <CurrentIcon className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{STEPS[step].title}</h1>
              <p className="text-sm text-gray-500">{STEPS[step].desc}</p>
            </div>
          </div>

          {step === 0 && <ServicesStep onNext={() => setStep(1)} />}
          {step === 1 && <PackagesStep onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <EmployeesStep onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <HoursStep onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <BranchesStep onNext={() => setStep(5)} onBack={() => setStep(3)} />}
          {step === 5 && <PlanStep onBack={() => setStep(4)} onComplete={completeOnboarding} />}
        </main>
      </div>
    </div>
  )
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
    </div>
  )
}

// ─── Shared step footer ───────────────────────────────────────────────────────

function StepFooter({ onBack, onNext, nextLabel = 'Devam Et', skippable, busy }: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  skippable?: boolean
  busy?: boolean
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
      <div>
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Geri
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {skippable && (
          <button type="button" onClick={onNext} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Şimdilik atla
          </button>
        )}
        <button type="button" onClick={onNext} disabled={busy}
          className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {nextLabel} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Step 1: Services ─────────────────────────────────────────────────────────

function ServicesStep({ onNext }: { onNext: () => void }) {
  const [services, setServices] = useState<Array<{ id: string; name: string; durationMinutes: number; price: number }>>([])
  const [form, setForm] = useState({ name: '', durationMinutes: 30, price: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<{ items: Array<{ id: string; name: string; durationMinutes: number; price: number }>; totalCount: number }>('/api/v1/services?pageNumber=1&pageSize=50')
      .then(d => setServices(d.items))
      .catch(() => {})
  }, [])

  async function add() {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      const res = await api.post<{ id: string; name: string; durationMinutes: number; price: number }>('/api/v1/services', {
        name: form.name.trim(),
        description: null,
        durationMinutes: form.durationMinutes || 30,
        bufferMinutes: 0,
        price: form.price || 0,
        color: null,
        imageUrl: null,
        isActive: true,
        requiresConfirmation: false,
        maxCapacity: null,
      })
      setServices(prev => [...prev, res])
      setForm({ name: '', durationMinutes: 30, price: 0 })
    } catch { /* ignore */ }
    setLoading(false)
  }

  async function remove(id: string) {
    try {
      await api.delete(`/api/v1/services/${id}`)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
  }

  function next() {
    if (services.length === 0) return
    onNext()
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_120px_auto]">
          <input className={inputCls} placeholder="Hizmet adı (örn. Saç Kesimi)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} onKeyDown={e => e.key === 'Enter' && add()} />
          <select className={inputCls} value={form.durationMinutes}
            onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}>
            {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} dk</option>)}
          </select>
          <div className="relative">
            <input className={`${inputCls} pr-8`} type="number" min={0} placeholder="Fiyat" value={form.price || ''}
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} onKeyDown={e => e.key === 'Enter' && add()} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₺</span>
          </div>
          <button type="button" onClick={add} disabled={loading || !form.name.trim()} aria-label="Hizmet ekle"
            className="inline-flex items-center justify-center rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-brand-600 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {services.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
          Henüz hizmet eklemediniz — en az bir hizmet eklemeniz gerekiyor
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {services.map(s => (
            <li key={s.id} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <span className="font-semibold text-gray-900">{s.name}</span>
              <span className="flex items-center gap-3">
                <span className="text-gray-500">{s.durationMinutes} dk · ₺{s.price}</span>
                <button type="button" onClick={() => remove(s.id)} aria-label={`${s.name} hizmetini sil`} className="text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <StepFooter onNext={next} busy={loading} />
    </div>
  )
}

// ─── Step 2: Packages ─────────────────────────────────────────────────────────

function PackagesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([])
  const [added, setAdded] = useState<Array<{ name: string; price: number }>>([])
  const [form, setForm] = useState<{ name: string; price: number; validityDays: number | null; serviceIds: string[] }>({
    name: '', price: 0, validityDays: null, serviceIds: [],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<{ items: Array<{ id: string; name: string }>; totalCount: number }>('/api/v1/services?pageNumber=1&pageSize=50')
      .then(d => setServices(d.items))
      .catch(() => {})
  }, [])

  function toggleService(id: string) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter(x => x !== id) : [...f.serviceIds, id],
    }))
  }

  async function add() {
    if (!form.name.trim() || form.serviceIds.length === 0) return
    setLoading(true)
    try {
      await api.post('/api/v1/packages', {
        name: form.name.trim(),
        description: null,
        price: form.price || 0,
        originalPrice: null,
        validityDays: form.validityDays,
        isActive: true,
        imageUrl: null,
        items: form.serviceIds.map(id => {
          const svc = services.find(s => s.id === id)
          return { serviceId: id, serviceName: svc?.name ?? '', quantity: 1 }
        }),
      })
      setAdded(a => [...a, { name: form.name.trim(), price: form.price }])
      setForm({ name: '', price: 0, validityDays: null, serviceIds: [] })
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_130px_130px]">
          <input className={inputCls} placeholder="Paket adı (örn. 5 Seans Masaj)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <div className="relative">
            <input className={`${inputCls} pr-8`} type="number" min={0} placeholder="Fiyat" value={form.price || ''}
              onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₺</span>
          </div>
          <select className={inputCls} value={form.validityDays ?? ''}
            onChange={e => setForm(f => ({ ...f, validityDays: e.target.value ? Number(e.target.value) : null }))}>
            <option value="">Süresiz</option>
            {[30, 60, 90, 180, 365].map(d => <option key={d} value={d}>{d} gün</option>)}
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-500">Paket içeriği — hizmet seçin:</p>
          {services.length === 0 ? (
            <p className="text-sm text-gray-400">Önce hizmet eklemelisiniz.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {services.map(s => (
                <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.serviceIds.includes(s.id)
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button" onClick={add} disabled={loading || !form.name.trim() || form.serviceIds.length === 0}
          className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-brand-600 disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Paketi Ekle
        </button>
      </div>

      {added.length > 0 && (
        <ul className="mt-4 space-y-2">
          {added.map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <span className="font-semibold text-gray-900">{p.name}</span>
              <span className="text-gray-500">₺{p.price}</span>
            </li>
          ))}
        </ul>
      )}

      <StepFooter onBack={onBack} onNext={onNext} skippable busy={loading} />
    </div>
  )
}

// ─── Step 3: Employees ────────────────────────────────────────────────────────

function EmployeesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([])
  const [added, setAdded] = useState<Array<{ name: string; title: string }>>([])
  const [form, setForm] = useState<{ name: string; title: string; phone: string; serviceIds: string[] }>({
    name: '', title: '', phone: '', serviceIds: [],
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get<{ items: Array<{ id: string; name: string }>; totalCount: number }>('/api/v1/services?pageNumber=1&pageSize=50')
      .then(d => setServices(d.items))
      .catch(() => {})
  }, [])

  function toggleService(id: string) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter(x => x !== id) : [...f.serviceIds, id],
    }))
  }

  async function add() {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await api.post('/api/v1/employees', {
        name: form.name.trim(),
        title: form.title.trim() || null,
        bio: null,
        phone: form.phone.trim() || null,
        email: null,
        isActive: true,
        acceptsOnlineBookings: true,
        serviceIds: form.serviceIds,
      })
      setAdded(a => [...a, { name: form.name.trim(), title: form.title.trim() }])
      setForm({ name: '', title: '', phone: '', serviceIds: [] })
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input className={inputCls} placeholder="Ad Soyad" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className={inputCls} placeholder="Ünvan (örn. Kuaför)" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="555 000 00 00" />
        </div>

        {services.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">Verebildiği hizmetler:</p>
            <div className="flex flex-wrap gap-2">
              {services.map(s => (
                <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.serviceIds.includes(s.id)
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="button" onClick={add} disabled={loading || !form.name.trim()}
          className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-brand-600 disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Çalışanı Ekle
        </button>
      </div>

      {added.length > 0 && (
        <ul className="mt-4 space-y-2">
          {added.map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <span className="font-semibold text-gray-900">{p.name}</span>
              <span className="text-gray-500">{p.title || 'Çalışan'}</span>
            </li>
          ))}
        </ul>
      )}

      <StepFooter onBack={onBack} onNext={onNext} skippable busy={loading} />
    </div>
  )
}

// ─── Step 4: Working hours ────────────────────────────────────────────────────

function HoursStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [schedule, setSchedule] = useState<DaySchedule[]>(defaultSchedule)
  const [saving, setSaving] = useState(false)

  function update(i: number, patch: Partial<DaySchedule>) {
    setSchedule(prev => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
  }

  async function saveAndNext() {
    setSaving(true)
    try {
      await api.patch('/api/v1/business/me/settings', { workingHours: JSON.stringify(schedule) }).catch(() => {})
    } catch { /* ignore */ }
    setSaving(false)
    onNext()
  }

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="space-y-3">
          {DAY_NAMES.map((day, i) => (
            <div key={day} className="flex items-center gap-3">
              <span className={`w-24 shrink-0 text-sm font-medium ${!schedule[i].open ? 'text-gray-400' : 'text-gray-700'}`}>
                {day}
              </span>
              <label className="relative flex shrink-0 cursor-pointer items-center">
                <input type="checkbox" checked={schedule[i].open}
                  onChange={e => update(i, { open: e.target.checked })} className="peer sr-only" />
                <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-brand-500 after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
              </label>
              {schedule[i].open ? (
                <div className="flex flex-1 items-center gap-2">
                  <select value={schedule[i].start} onChange={e => update(i, { start: e.target.value })}
                    className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    {HALF_HOURS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-gray-400">—</span>
                  <select value={schedule[i].end} onChange={e => update(i, { end: e.target.value })}
                    className="rounded-xl border border-gray-200 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20">
                    {HALF_HOURS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <span className="flex-1 text-sm text-gray-400">Kapalı</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <StepFooter onBack={onBack} onNext={saveAndNext} busy={saving} />
    </div>
  )
}

// ─── Step 5: Branches ─────────────────────────────────────────────────────────

function BranchesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [added, setAdded] = useState<Array<{ name: string; city: string }>>([])
  const [form, setForm] = useState({ name: '', city: '', address: '', phone: '' })
  const [loading, setLoading] = useState(false)

  async function add() {
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await api.post('/api/v1/branches', {
        name: form.name.trim(),
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        phone: form.phone.trim() || null,
        email: null,
        managerName: null,
        isActive: true,
        isMainBranch: false,
      })
      setAdded(a => [...a, { name: form.name.trim(), city: form.city.trim() }])
      setForm({ name: '', city: '', address: '', phone: '' })
    } catch { /* ignore */ }
    setLoading(false)
  }

  return (
    <div>
      <p className="mb-4 rounded-xl bg-brand-50 border border-brand-100 px-4 py-3 text-sm text-brand-700">
        Tek şubeniz varsa bu adımı atlayabilirsiniz — kayıt sırasında verdiğiniz adres ana şubeniz olarak kullanılır.
      </p>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input className={inputCls} placeholder="Şube adı (örn. Kadıköy Şubesi)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className={inputCls} placeholder="Şehir" value={form.city}
            onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
          <input className={inputCls} placeholder="Adres" value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          <PhoneInput value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="555 000 00 00" />
        </div>
        <button type="button" onClick={add} disabled={loading || !form.name.trim()}
          className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-brand-600 disabled:opacity-50 transition-colors">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Şubeyi Ekle
        </button>
      </div>

      {added.length > 0 && (
        <ul className="mt-4 space-y-2">
          {added.map((b, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
              <span className="font-semibold text-gray-900">{b.name}</span>
              <span className="text-gray-500">{b.city || '—'}</span>
            </li>
          ))}
        </ul>
      )}

      <StepFooter onBack={onBack} onNext={onNext} skippable busy={loading} />
    </div>
  )
}

// ─── Step 6: Plan selection + payment ─────────────────────────────────────────

function PlanStep({ onBack, onComplete }: { onBack: () => void; onComplete: (plan?: string) => void }) {
  const [selected, setSelected] = useState<string>('starter')
  const [phase, setPhase] = useState<'select' | 'pay'>('select')
  const [payForm, setPayForm] = useState({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' })
  const [payError, setPayError] = useState('')
  const [paying, setPaying] = useState(false)

  function proceed() {
    if (selected === 'custom') {
      onComplete('custom')
      return
    }
    setPhase('pay')
  }

  function detectBrand(num: string) {
    const n = num.replace(/\s/g, '')
    if (n.startsWith('4')) return 'Visa'
    if (/^5[1-5]/.test(n)) return 'Mastercard'
    if (/^3[47]/.test(n)) return 'Amex'
    return 'Kart'
  }

  async function pay() {
    setPayError('')
    const num = payForm.cardNumber.replace(/\s/g, '')
    if (num.length < 16) { setPayError('Geçerli bir kart numarası girin.'); return }
    if (!payForm.cardHolder.trim()) { setPayError('Kart üzerindeki isim gereklidir.'); return }
    if (payForm.expiry.length < 5) { setPayError('Geçerli bir son kullanma tarihi girin.'); return }
    if (payForm.cvv.length < 3) { setPayError('CVV en az 3 haneli olmalıdır.'); return }

    setPaying(true)
    try {
      await api.post('/api/v1/payments/cards', {
        cardHolder: payForm.cardHolder,
        cardNumber: num,
        expiry: payForm.expiry,
        cvv: payForm.cvv,
        brand: detectBrand(num),
      })
      await api.patch('/api/v1/business/me/plan', { plan: selected, months: 1 })

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)
      const planCfg = PLAN_CONFIGS.find(p => p.id === selected)
      await api.post('/api/v1/receivables', {
        customerName: payForm.cardHolder || 'Müşteri',
        totalAmount: PLAN_PRICES[selected],
        dueDate: dueDate.toISOString().split('T')[0],
        installmentCount: 1,
        description: `${planCfg?.name ?? selected} Plan aboneliği (aylık)`,
      }).catch(() => {})

      onComplete(selected)
    } catch (err) {
      const apiErr = err as ApiError
      setPayError(apiErr.message || 'Ödeme işlenirken bir hata oluştu.')
    }
    setPaying(false)
  }

  if (phase === 'pay') {
    const planCfg = PLAN_CONFIGS.find(p => p.id === selected)
    return (
      <div>
        <div className="mb-5 flex items-center justify-between rounded-xl border border-brand-200 bg-brand-50 p-4">
          <div>
            <p className="font-semibold text-gray-900">{planCfg?.name} Plan</p>
            <p className="text-sm text-gray-500">{planCfg?.badgeLabel} · aylık abonelik</p>
          </div>
          <p className="text-lg font-extrabold text-gray-900">₺{PLAN_PRICES[selected]}<span className="text-sm font-normal text-gray-500">/ay</span></p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Bu bölüm test aşamasındadır. Gerçek kart bilgisi girmenize gerek yok — herhangi bir kart numarası, isim ve güvenlik kodu (CVV) kullanabilirsiniz.
          </p>
          <input className={inputCls} placeholder="Kart üzerindeki isim" value={payForm.cardHolder}
            onChange={e => setPayForm(f => ({ ...f, cardHolder: e.target.value }))} />
          <input className={inputCls} placeholder="Kart numarası" inputMode="numeric" value={payForm.cardNumber}
            onChange={e => setPayForm(f => ({ ...f, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() }))} />
          <div className="grid grid-cols-2 gap-3">
            <input className={inputCls} placeholder="AA/YY" inputMode="numeric" value={payForm.expiry}
              onChange={e => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`
                setPayForm(f => ({ ...f, expiry: v }))
              }} />
            <input className={inputCls} placeholder="CVV" inputMode="numeric" value={payForm.cvv}
              onChange={e => setPayForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} />
          </div>
          {payError && <p className="text-sm text-red-600">{payError}</p>}
          <p className="text-xs text-gray-400">Ödeme bilgileriniz güvenle saklanır. 14 gün ücretsiz deneme.</p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
          <button type="button" onClick={() => setPhase('select')}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-4 w-4" /> Plan Seçimine Dön
          </button>
          <button type="button" onClick={pay} disabled={paying}
            className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-brand-600 disabled:opacity-60 transition-all hover:-translate-y-0.5">
            {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Ödemeyi Tamamla
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLAN_CONFIGS.map(plan => (
          <button key={plan.id} type="button" onClick={() => setSelected(plan.id)}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              selected === plan.id ? 'border-brand-500 bg-brand-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
            }`}>
            <div className="flex items-center justify-between">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${plan.accentClassName}`}>
                {plan.badgeLabel}
              </span>
              {selected === plan.id && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-black">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
            <p className="mt-3 text-lg font-bold text-gray-900">{plan.name}</p>
            <p className="text-xl font-extrabold text-brand-600">{plan.price}</p>
            <ul className="mt-3 space-y-1.5">
              {plan.features.map(feat => (
                <li key={feat} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> {feat}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          <ChevronLeft className="h-4 w-4" /> Geri
        </button>
        <button type="button" onClick={proceed}
          className="inline-flex items-center gap-1 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-brand-600 transition-all hover:-translate-y-0.5">
          {selected === 'custom' ? 'Satış Ekibine İlet' : 'Ödemeye Geç'} <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
