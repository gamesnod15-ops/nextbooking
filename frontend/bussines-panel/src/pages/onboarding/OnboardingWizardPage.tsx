import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import type { RootState } from '@/store'
import { updateBusiness } from '@/store/slices/businessSlice'
import api from '@/lib/api'
import { toLocalDateStr } from '@/lib/utils'
import { showToast } from '@/components/ui/Toast'
import { Button } from '@/components/ui/Button'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { PLAN_CONFIGS } from '@/config/plans'
import type { PlanId } from '@/types'
import { useServices, useCreateService, type Service } from '@/hooks/useServices'
import { useCreateEmployee } from '@/hooks/useEmployees'
import { useCreateBranch } from '@/hooks/useBranches'
import { useCreatePackage } from '@/hooks/useMarketingData'
import {
  Scissors, Package, Users, Clock, Building2, CreditCard, Sparkles,
  Plus, Trash2, Check, ChevronLeft, ChevronRight, Loader2, PartyPopper,
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

const PLAN_PRICES: Record<PlanId, number> = { starter: 299, business: 599, professional: 999, custom: 0 }

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

function onboardingKey(tenantId?: string | null) {
  return `onboarding_done_${tenantId ?? 'default'}`
}

const inputCls =
  'w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'

// ─── Wizard page ──────────────────────────────────────────────────────────────

export function OnboardingWizardPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const tenantId = useSelector((s: RootState) => s.auth.tenantId)
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  function completeOnboarding(plan?: PlanId) {
    localStorage.setItem(onboardingKey(tenantId), '1')
    if (plan) dispatch(updateBusiness({ plan }))
    setDone(true)
    setTimeout(() => navigate('/dashboard', { replace: true }), 2200)
  }

  function skipAll() {
    localStorage.setItem(onboardingKey(tenantId), '1')
    navigate('/dashboard', { replace: true })
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
            <PartyPopper className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold">Kurulum tamamlandı! 🎉</h1>
          <p className="mt-2 text-muted-foreground">İşletmeniz hazır, panelinize yönlendiriliyorsunuz…</p>
          <Loader2 className="mx-auto mt-5 h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  const CurrentIcon = STEPS[step].icon

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left stepper rail */}
      <aside className="hidden w-72 shrink-0 flex-col border-r bg-muted/30 p-6 lg:flex">
        <div className="mb-8 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold">Kurulum Sihirbazı</span>
        </div>
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const state = i < step ? 'done' : i === step ? 'active' : 'todo'
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)}
                  disabled={i > step}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                    state === 'active' ? 'bg-primary/10 text-primary'
                    : state === 'done' ? 'text-foreground hover:bg-accent'
                    : 'text-muted-foreground'
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                    state === 'done' ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    : state === 'active' ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-background'
                  }`}>
                    {state === 'done' ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{s.title}</span>
                    <span className="block text-xs opacity-70">{s.desc}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <button
          type="button"
          onClick={skipAll}
          className="mt-auto text-left text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Kurulumu daha sonra tamamla →
        </button>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col">
        {/* Mobile progress header */}
        <div className="border-b p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              Adım {step + 1}/{STEPS.length} · {STEPS[step].title}
            </span>
            <button type="button" onClick={skipAll} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
              Daha sonra
            </button>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        <div className="mx-auto w-full max-w-2xl flex-1 p-6 lg:p-10">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <CurrentIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{STEPS[step].title}</h1>
              <p className="text-sm text-muted-foreground">{STEPS[step].desc}</p>
            </div>
          </div>

          {step === 0 && <ServicesStep onNext={() => setStep(1)} />}
          {step === 1 && <PackagesStep onNext={() => setStep(2)} onBack={() => setStep(0)} />}
          {step === 2 && <EmployeesStep onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && <HoursStep onNext={() => setStep(4)} onBack={() => setStep(2)} />}
          {step === 4 && <BranchesStep onNext={() => setStep(5)} onBack={() => setStep(3)} />}
          {step === 5 && <PlanStep onBack={() => setStep(4)} onComplete={completeOnboarding} />}
        </div>
      </main>
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
    <div className="mt-8 flex items-center justify-between border-t pt-5">
      <div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Geri
          </Button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {skippable && (
          <button type="button" onClick={onNext} className="text-sm text-muted-foreground hover:underline">
            Şimdilik atla
          </button>
        )}
        <Button onClick={onNext} disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
          {nextLabel} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Step 1: Services ─────────────────────────────────────────────────────────

function ServicesStep({ onNext }: { onNext: () => void }) {
  const { data } = useServices({ pageNumber: 1, pageSize: 50 })
  const createService = useCreateService()
  const [form, setForm] = useState({ name: '', durationMinutes: 30, price: 0 })
  const [added, setAdded] = useState<Array<{ id: string; name: string; durationMinutes: number; price: number }>>([])
  const fetched = data?.items ?? []
  // Show newly created services immediately instead of waiting on the
  // invalidateQueries → refetch round trip; once the refetch lands, the
  // fetched copy (with real sortOrder etc.) takes over by matching id.
  const services = [...added.filter(a => !fetched.some(s => s.id === a.id)), ...fetched]

  async function add() {
    if (!form.name.trim()) { showToast('error', 'Hizmet adı gereklidir'); return }
    try {
      const durationMinutes = form.durationMinutes || 30
      const price = form.price || 0
      const result = await createService.mutateAsync({
        name: form.name.trim(),
        description: null,
        durationMinutes,
        bufferMinutes: 0,
        price,
        color: null,
        imageUrl: null,
        isActive: true,
        requiresConfirmation: false,
        maxCapacity: null,
      })
      setAdded(a => [...a, { id: result.id, name: form.name.trim(), durationMinutes, price }])
      setForm({ name: '', durationMinutes: 30, price: 0 })
      showToast('success', 'Hizmet eklendi')
    } catch {
      showToast('error', 'Hizmet eklenemedi', 'Lütfen tekrar deneyin')
    }
  }

  function next() {
    if (services.length === 0) { showToast('error', 'En az bir hizmet ekleyin', 'Randevu alabilmeniz için bir hizmet gerekli') ; return }
    onNext()
  }

  return (
    <div>
      <div className="rounded-xl border p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_120px_120px_auto]">
          <input
            className={inputCls}
            placeholder="Hizmet adı (örn. Saç Kesimi)"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && add()}
          />
          <select
            className={inputCls}
            value={form.durationMinutes}
            onChange={(e) => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
          >
            {[15, 30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} dk</option>)}
          </select>
          <div className="relative">
            <input
              className={`${inputCls} pr-8`}
              type="number"
              min={0}
              placeholder="Fiyat"
              value={form.price || ''}
              onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))}
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₺</span>
          </div>
          <Button onClick={add} disabled={createService.isPending}>
            {createService.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <AddedList
        emptyText="Henüz hizmet eklemediniz"
        items={services.map(s => ({ id: s.id, primary: s.name, secondary: `${s.durationMinutes} dk · ₺${s.price}` }))}
        deleteEndpoint="/services"
        queryKey="services"
      />

      <StepFooter onNext={next} busy={createService.isPending} />
    </div>
  )
}

// ─── Step 2: Packages ─────────────────────────────────────────────────────────

function PackagesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data: svcData } = useServices({ pageNumber: 1, pageSize: 50 })
  const createPackage = useCreatePackage()
  const services = svcData?.items ?? []
  const [added, setAdded] = useState<Array<{ name: string; price: number }>>([])
  const [form, setForm] = useState<{ name: string; price: number; validityDays: number | null; serviceIds: string[] }>({
    name: '', price: 0, validityDays: null, serviceIds: [],
  })

  function toggleService(id: string) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter(x => x !== id) : [...f.serviceIds, id],
    }))
  }

  async function add() {
    if (!form.name.trim()) { showToast('error', 'Paket adı gereklidir'); return }
    if (form.serviceIds.length === 0) { showToast('error', 'Pakete en az bir hizmet seçin'); return }
    try {
      await createPackage.mutateAsync({
        name: form.name.trim(),
        description: null,
        price: form.price || 0,
        originalPrice: null,
        validityDays: form.validityDays,
        isActive: true,
        imageUrl: null,
        items: form.serviceIds.map(id => {
          const svc = services.find(s => s.id === id) as Service | undefined
          return { serviceId: id, serviceName: svc?.name ?? '', quantity: 1 }
        }),
      })
      setAdded(a => [...a, { name: form.name.trim(), price: form.price }])
      setForm({ name: '', price: 0, validityDays: null, serviceIds: [] })
      showToast('success', 'Paket eklendi')
    } catch {
      showToast('error', 'Paket eklenemedi', 'Lütfen tekrar deneyin')
    }
  }

  return (
    <div>
      <div className="rounded-xl border p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_130px_130px]">
          <input
            className={inputCls}
            placeholder="Paket adı (örn. 5 Seans Masaj)"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <div className="relative">
            <input
              className={`${inputCls} pr-8`}
              type="number" min={0}
              placeholder="Fiyat"
              value={form.price || ''}
              onChange={(e) => setForm(f => ({ ...f, price: Number(e.target.value) }))}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₺</span>
          </div>
          <select
            className={inputCls}
            value={form.validityDays ?? ''}
            onChange={(e) => setForm(f => ({ ...f, validityDays: e.target.value ? Number(e.target.value) : null }))}
          >
            <option value="">Süresiz</option>
            {[30, 60, 90, 180, 365].map(d => <option key={d} value={d}>{d} gün geçerli</option>)}
          </select>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Paket içeriği — hizmet seçin:</p>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Önce hizmet eklemelisiniz.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {services.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.serviceIds.includes(s.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <Button onClick={add} disabled={createPackage.isPending} className="w-full sm:w-auto">
          {createPackage.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
          Paketi Ekle
        </Button>
      </div>

      {added.length > 0 && (
        <ul className="mt-4 space-y-2">
          {added.map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">₺{p.price}</span>
            </li>
          ))}
        </ul>
      )}

      <StepFooter onBack={onBack} onNext={onNext} skippable busy={createPackage.isPending} />
    </div>
  )
}

// ─── Step 3: Employees ────────────────────────────────────────────────────────

function EmployeesStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { data: svcData } = useServices({ pageNumber: 1, pageSize: 50 })
  const createEmployee = useCreateEmployee()
  const services = svcData?.items ?? []
  const [added, setAdded] = useState<Array<{ name: string; title: string }>>([])
  const [form, setForm] = useState<{ name: string; title: string; phone: string; serviceIds: string[] }>({
    name: '', title: '', phone: '', serviceIds: [],
  })

  function toggleService(id: string) {
    setForm(f => ({
      ...f,
      serviceIds: f.serviceIds.includes(id) ? f.serviceIds.filter(x => x !== id) : [...f.serviceIds, id],
    }))
  }

  async function add() {
    if (!form.name.trim()) { showToast('error', 'Çalışan adı gereklidir'); return }
    try {
      await createEmployee.mutateAsync({
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
      showToast('success', 'Çalışan eklendi')
    } catch {
      showToast('error', 'Çalışan eklenemedi', 'Lütfen tekrar deneyin')
    }
  }

  return (
    <div>
      <div className="rounded-xl border p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            className={inputCls}
            placeholder="Ad Soyad"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="Ünvan (örn. Kuaför)"
            value={form.title}
            onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <PhoneInput value={form.phone} onChange={(v) => setForm(f => ({ ...f, phone: v }))} />
        </div>

        {services.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Verebildiği hizmetler:</p>
            <div className="flex flex-wrap gap-2">
              {services.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.serviceIds.includes(s.id)
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'hover:bg-accent'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button onClick={add} disabled={createEmployee.isPending} className="w-full sm:w-auto">
          {createEmployee.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
          Çalışanı Ekle
        </Button>
      </div>

      {added.length > 0 && (
        <ul className="mt-4 space-y-2">
          {added.map((p, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
              <span className="font-medium">{p.name}</span>
              <span className="text-muted-foreground">{p.title || 'Çalışan'}</span>
            </li>
          ))}
        </ul>
      )}

      <StepFooter onBack={onBack} onNext={onNext} skippable busy={createEmployee.isPending} />
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
      localStorage.setItem('working_hours', JSON.stringify(schedule))
      await api.patch('/business/me/settings', { workingHours: JSON.stringify(schedule) }).catch(() => {})
      showToast('success', 'Çalışma saatleri kaydedildi')
      onNext()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="rounded-xl border p-4">
        <div className="space-y-3">
          {DAY_NAMES.map((day, i) => (
            <div key={day} className="flex items-center gap-3">
              <span className={`w-24 shrink-0 text-sm font-medium ${!schedule[i].open ? 'text-muted-foreground' : ''}`}>
                {day}
              </span>
              <label className="relative flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={schedule[i].open}
                  onChange={(e) => update(i, { open: e.target.checked })}
                  className="peer sr-only"
                />
                <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
              </label>
              {schedule[i].open ? (
                <div className="flex flex-1 items-center gap-2">
                  <select
                    value={schedule[i].start}
                    onChange={(e) => update(i, { start: e.target.value })}
                    className="rounded-lg border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {HALF_HOURS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-muted-foreground">—</span>
                  <select
                    value={schedule[i].end}
                    onChange={(e) => update(i, { end: e.target.value })}
                    className="rounded-lg border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {HALF_HOURS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <span className="flex-1 text-sm text-muted-foreground">Kapalı</span>
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
  const createBranch = useCreateBranch()
  const [added, setAdded] = useState<Array<{ name: string; city: string }>>([])
  const [form, setForm] = useState({ name: '', city: '', address: '', phone: '' })

  async function add() {
    if (!form.name.trim()) { showToast('error', 'Şube adı gereklidir'); return }
    try {
      await createBranch.mutateAsync({
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
      showToast('success', 'Şube eklendi')
    } catch {
      showToast('error', 'Şube eklenemedi', 'Lütfen tekrar deneyin')
    }
  }

  return (
    <div>
      <p className="mb-4 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
        Tek şubeniz varsa bu adımı atlayabilirsiniz — kayıt sırasında verdiğiniz adres ana şubeniz olarak kullanılır.
      </p>

      <div className="rounded-xl border p-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            className={inputCls}
            placeholder="Şube adı (örn. Kadıköy Şubesi)"
            value={form.name}
            onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="Şehir"
            value={form.city}
            onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="Adres"
            value={form.address}
            onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))}
          />
          <PhoneInput value={form.phone} onChange={(v) => setForm(f => ({ ...f, phone: v }))} />
        </div>
        <Button onClick={add} disabled={createBranch.isPending} className="w-full sm:w-auto">
          {createBranch.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
          Şubeyi Ekle
        </Button>
      </div>

      {added.length > 0 && (
        <ul className="mt-4 space-y-2">
          {added.map((b, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
              <span className="font-medium">{b.name}</span>
              <span className="text-muted-foreground">{b.city || '—'}</span>
            </li>
          ))}
        </ul>
      )}

      <StepFooter onBack={onBack} onNext={onNext} skippable busy={createBranch.isPending} />
    </div>
  )
}

// ─── Step 6: Plan selection + payment ─────────────────────────────────────────

function PlanStep({ onBack, onComplete }: { onBack: () => void; onComplete: (plan?: PlanId) => void }) {
  const [selected, setSelected] = useState<PlanId>('starter')
  const [phase, setPhase] = useState<'select' | 'pay'>('select')
  const [payForm, setPayForm] = useState({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' })
  const [payError, setPayError] = useState('')
  const [paying, setPaying] = useState(false)

  function proceed() {
    if (selected === 'custom') {
      showToast('success', 'Talebiniz alındı', 'Satış ekibimiz sizinle iletişime geçecek')
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
      await api.post('/payments/cards', {
        cardHolder: payForm.cardHolder,
        cardNumber: num,
        expiry: payForm.expiry,
        cvv: payForm.cvv,
        brand: detectBrand(num),
      })
      await api.patch('/business/me/plan', { plan: selected, months: 1 })

      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)
      const planCfg = PLAN_CONFIGS.find(p => p.id === selected)
      await api.post('/receivables', {
        customerName: payForm.cardHolder || 'Müşteri',
        totalAmount: PLAN_PRICES[selected],
        dueDate: toLocalDateStr(dueDate),
        installmentCount: 1,
        description: `${planCfg?.name ?? selected} Plan aboneliği (aylık)`,
      }).catch(() => {})

      showToast('success', 'Ödeme tamamlandı', `${planCfg?.name} planına geçiş yapıldı`)
      onComplete(selected)
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string; detail?: string } } }
      setPayError(anyErr?.response?.data?.message ?? anyErr?.response?.data?.detail ?? 'Ödeme işlenirken bir hata oluştu.')
    } finally {
      setPaying(false)
    }
  }

  if (phase === 'pay') {
    const planCfg = PLAN_CONFIGS.find(p => p.id === selected)
    return (
      <div>
        <div className="mb-5 flex items-center justify-between rounded-xl border bg-primary/5 p-4">
          <div>
            <p className="font-semibold">{planCfg?.name} Plan</p>
            <p className="text-sm text-muted-foreground">{planCfg?.badgeLabel} · aylık abonelik</p>
          </div>
          <p className="text-lg font-extrabold">₺{PLAN_PRICES[selected]}<span className="text-sm font-normal text-muted-foreground">/ay</span></p>
        </div>

        <div className="rounded-xl border p-4 space-y-3">
          <input
            className={inputCls}
            placeholder="Kart üzerindeki isim"
            value={payForm.cardHolder}
            onChange={(e) => setPayForm(f => ({ ...f, cardHolder: e.target.value }))}
          />
          <input
            className={inputCls}
            placeholder="Kart numarası"
            inputMode="numeric"
            value={payForm.cardNumber}
            onChange={(e) => setPayForm(f => ({
              ...f,
              cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim(),
            }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className={inputCls}
              placeholder="AA/YY"
              inputMode="numeric"
              value={payForm.expiry}
              onChange={(e) => {
                let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`
                setPayForm(f => ({ ...f, expiry: v }))
              }}
            />
            <input
              className={inputCls}
              placeholder="CVV"
              inputMode="numeric"
              value={payForm.cvv}
              onChange={(e) => setPayForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            />
          </div>
          {payError && <p className="text-sm text-red-600">{payError}</p>}
          <p className="text-xs text-muted-foreground">🔒 Ödeme bilgileriniz güvenle saklanır. 14 gün ücretsiz deneme — istediğiniz zaman iptal edebilirsiniz.</p>
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-5">
          <Button variant="outline" onClick={() => setPhase('select')}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Plan Seçimine Dön
          </Button>
          <Button onClick={pay} disabled={paying}>
            {paying ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CreditCard className="mr-1 h-4 w-4" />}
            Ödemeyi Tamamla
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PLAN_CONFIGS.map(plan => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelected(plan.id)}
            className={`rounded-2xl border-2 p-5 text-left transition-all ${
              selected === plan.id ? 'border-primary bg-primary/5 shadow-md' : 'hover:border-muted-foreground/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${plan.accentClassName}`}>
                {plan.badgeLabel}
              </span>
              {selected === plan.id && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </div>
            <p className="mt-3 text-lg font-bold">{plan.name}</p>
            <p className="text-xl font-extrabold text-primary">{plan.price}</p>
            <ul className="mt-3 space-y-1.5">
              {plan.features.slice(0, 3).map(feat => (
                <li key={feat} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" /> {feat}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between border-t pt-5">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Geri
        </Button>
        <Button onClick={proceed}>
          {selected === 'custom' ? 'Satış Ekibine İlet' : 'Ödemeye Geç'} <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// ─── Small shared list for added items ────────────────────────────────────────

function AddedList({ items, emptyText, deleteEndpoint, queryKey }: {
  items: Array<{ id: string; primary: string; secondary: string }>
  emptyText: string
  deleteEndpoint: string
  queryKey: string
}) {
  const qc = useQueryClient()
  const [deleting, setDeleting] = useState<string | null>(null)

  async function remove(id: string) {
    setDeleting(id)
    try {
      await api.delete(`${deleteEndpoint}/${id}`)
      qc.invalidateQueries({ queryKey: [queryKey] })
    } catch {
      showToast('error', 'Silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  if (items.length === 0) {
    return <p className="mt-4 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">{emptyText}</p>
  }

  return (
    <ul className="mt-4 space-y-2">
      {items.map(item => (
        <li key={item.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5 text-sm">
          <span className="font-medium">{item.primary}</span>
          <span className="flex items-center gap-3">
            <span className="text-muted-foreground">{item.secondary}</span>
            <button
              type="button"
              onClick={() => remove(item.id)}
              disabled={deleting === item.id}
              className="text-muted-foreground transition-colors hover:text-red-500"
              aria-label={`${item.primary} sil`}
            >
              {deleting === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}
