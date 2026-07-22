'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarCheck, Check, Zap, Star, Building2, ArrowRight, Sparkles, X, Send, CheckCircle, Loader2 } from 'lucide-react'
import { api, type ApiError } from '@/lib/api'

interface ApiPlan {
  name: string
  badgeLabel: string
  description: string
  price: number | null
  isCustomPricing: boolean
  buttonText: string
  features: string[]
  isHighlighted: boolean
  highlightLabel: string | null
  planKey: string | null
}

// Visuals aren't stored in the DB — cycle through a fixed style per card
// position, with the highlighted plan always getting the brand treatment.
const STYLE_BY_POSITION = [
  { icon: Zap, color: 'slate', accentBorder: 'border-slate-200', accentBg: 'bg-slate-50', badgeClass: 'bg-slate-100 text-slate-700', iconBg: 'bg-slate-100', iconColor: 'text-slate-600', btnClass: 'bg-slate-700 hover:bg-slate-800 text-white' },
  { icon: Building2, color: 'blue', accentBorder: 'border-blue-200', accentBg: 'bg-blue-50', badgeClass: 'bg-blue-100 text-blue-700', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', btnClass: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { icon: Sparkles, color: 'amber', accentBorder: 'border-amber-200', accentBg: 'bg-amber-50', badgeClass: 'bg-amber-100 text-amber-700', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', btnClass: 'bg-amber-500 hover:bg-amber-600 text-black' },
]
const HIGHLIGHT_STYLE = { icon: Star, color: 'brand', accentBorder: 'border-brand-300', accentBg: 'bg-brand-500', badgeClass: 'bg-white/20 text-white', iconBg: 'bg-white/20', iconColor: 'text-white', btnClass: 'bg-white text-brand-600 hover:bg-brand-50 font-bold' }

function usePlans() {
  const [plans, setPlans] = useState<(ApiPlan & typeof HIGHLIGHT_STYLE & { key: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get<ApiPlan[]>('/api/v1/pricing-plans')
      .then((data) => {
        if (cancelled) return
        let styleIdx = 0
        setPlans(data.map((p, i) => ({
          ...p,
          ...(p.isHighlighted ? HIGHLIGHT_STYLE : STYLE_BY_POSITION[styleIdx++ % STYLE_BY_POSITION.length]),
          key: p.planKey || `plan-${i}`,
        })))
      })
      .catch(() => { if (!cancelled) setPlans([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { plans, loading }
}

function PaketSecContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { plans, loading: plansLoading } = usePlans()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [leadModalOpen, setLeadModalOpen] = useState(false)

  useEffect(() => {
    if (plans.length === 0) return
    const planFromUrl = searchParams.get('plan')
    const planFromStorage = localStorage.getItem('selectedPlan')
    const plan = planFromUrl || planFromStorage
    if (plan && plans.some((p) => p.key === plan)) {
      setSelected(plan)
    }

    const tokenFromUrl = searchParams.get('_token')
    if (tokenFromUrl) {
      localStorage.setItem('accessToken', tokenFromUrl)
    }
  }, [plans])

  function handleContinue() {
    if (!selected) return

    // The Kurumsal (custom) plan has no fixed price — there's nothing to
    // charge a card for. Collect the lead instead of routing to checkout.
    if (selected === 'custom') {
      setLeadModalOpen(true)
      return
    }

    setLoading(true)
    // Store selection and navigate to payment
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedPlan', selected)
    }
    router.push(`/odeme?plan=${selected}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <CalendarCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">JetRandevu</span>
          </Link>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✓</span>
            <span className="text-gray-400">Hesap</span>
            <span className="text-gray-300">›</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold">2</span>
            <span className="font-semibold text-gray-800">Paket</span>
            <span className="text-gray-300">›</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs font-bold">3</span>
            <span className="text-gray-400">Ödeme</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500 mb-2">Adım 2/3</p>
          <h1 className="text-4xl font-extrabold text-gray-900">İşletmenize Uygun Planı Seçin</h1>
          <p className="mt-3 text-lg text-gray-600 max-w-xl mx-auto">
            14 gün boyunca ücretsiz kullanın. İstediğiniz zaman planınızı değiştirin ya da iptal edin.
          </p>
        </div>

        {/* Plan cards */}
        {plansLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-brand-500" /></div>
        ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isSelected = selected === plan.key
            const isPopular = plan.isHighlighted
            const isCustom = plan.key === 'custom'

            return (
              <button
                key={plan.key}
                type="button"
                onClick={() => isCustom ? setLeadModalOpen(true) : setSelected(plan.key)}
                className={[
                  'relative flex flex-col rounded-2xl border-2 text-left transition-all focus:outline-none',
                  isPopular
                    ? `${plan.accentBg} text-white shadow-2xl scale-[1.03]`
                    : `bg-white ${isSelected ? 'border-brand-400 shadow-lg ring-2 ring-brand-400/30' : `${plan.accentBorder} shadow-sm hover:shadow-md`}`,
                  isSelected && !isPopular ? 'scale-[1.02]' : '',
                ].join(' ')}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900 shadow">
                    ⭐ {plan.highlightLabel || 'En Popüler'}
                  </div>
                )}

                {/* Selected indicator */}
                {isSelected && !isPopular && (
                  <div className="absolute -top-3 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-xs">
                    ✓
                  </div>
                )}

                <div className={`p-6 flex flex-col flex-1 ${isPopular ? 'pt-8' : ''}`}>
                  {/* Icon + badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${plan.iconBg}`}>
                      <Icon className={`h-5 w-5 ${plan.iconColor}`} />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${plan.badgeClass}`}>
                      {plan.badgeLabel}
                    </span>
                  </div>

                  {/* Name + desc */}
                  <h3 className={`text-lg font-extrabold ${isPopular ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`mt-1 text-xs leading-relaxed ${isPopular ? 'text-white/75' : 'text-gray-500'}`}>{plan.description}</p>

                  {/* Price */}
                  <div className="mt-4 mb-5">
                    {plan.isCustomPricing ? (
                      <>
                        <span className={`text-3xl font-extrabold ${isPopular ? 'text-white' : 'text-gray-900'}`}>Özel</span>
                        <span className={`text-sm ${isPopular ? 'text-white/70' : 'text-gray-500'}`}> fiyat</span>
                      </>
                    ) : (
                      <>
                        <span className={`text-3xl font-extrabold ${isPopular ? 'text-white' : 'text-gray-900'}`}>₺{plan.price}</span>
                        <span className={`text-sm ${isPopular ? 'text-white/70' : 'text-gray-500'}`}>/ay</span>
                      </>
                    )}
                    {!isCustom && (
                      <p className={`text-xs mt-0.5 ${isPopular ? 'text-white/60' : 'text-gray-400'}`}>+ KDV • 14 gün ücretsiz</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2 text-xs ${isPopular ? 'text-white/90' : 'text-gray-700'}`}>
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? 'text-white' : 'text-emerald-500'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Select button */}
                  <div className={`mt-6 w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
                    isCustom
                      ? plan.btnClass
                      : isSelected
                        ? isPopular
                          ? plan.btnClass
                          : 'bg-brand-500 text-white'
                        : isPopular
                          ? plan.btnClass
                          : `border-2 ${plan.accentBorder} text-gray-700 hover:border-brand-300`
                  }`}>
                    {isCustom ? plan.buttonText : isSelected ? '✓ Seçildi' : 'Seç'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
        )}

        {/* Money-back note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            🔒 30 gün para-iade garantisi · Kredi kartı gerekmez · İstediğiniz zaman iptal
          </p>
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={handleContinue}
            disabled={!selected || loading}
            className="flex items-center gap-2 rounded-2xl bg-brand-500 px-10 py-4 text-base font-bold text-white shadow-lg hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            {loading ? 'Yönlendiriliyor…' : 'Devam Et — Ödeme'}
            <ArrowRight className="h-5 w-5" />
          </button>
          {!selected && (
            <p className="text-xs text-gray-400">Devam etmek için bir plan seçin</p>
          )}
        </div>

        {/* FAQ strip */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-3xl mx-auto">
          {[
            { q: 'Deneme süresi sonunda ne olur?', a: 'Seçtiğiniz plan ücretlendirilmeye başlanır. İstediğiniz zaman iptal edebilirsiniz.' },
            { q: 'Plan değiştirebilir miyim?', a: 'Evet, dilediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz.' },
            { q: 'Fatura kesilecek mi?', a: 'Evet, her ay e-fatura otomatik olarak gönderilir.' },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-gray-900 mb-1">{q}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </main>

      {leadModalOpen && <SalesLeadModal onClose={() => setLeadModalOpen(false)} />}
    </div>
  )
}

// ─── Sales lead modal (Kurumsal / custom plan) ───────────────────────────────

// Same +90 formatting used on /register — keeps phone input consistent site-wide.
function formatPhoneDisplay(raw: string) {
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
  const d = local.slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
}

function SalesLeadModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ companyName: '', firstName: '', lastName: '', phone: '', email: '', branchCount: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [generalError, setGeneralError] = useState('')

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm((prev) => ({ ...prev, phone: digits ? `+90${digits}` : '' }))
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.companyName.trim()) errs.companyName = 'İşletme adı gereklidir.'
    if (!form.firstName.trim()) errs.firstName = 'Ad gereklidir.'
    if (!form.lastName.trim()) errs.lastName = 'Soyad gereklidir.'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 12) errs.phone = 'Geçerli bir telefon numarası girin.'
    if (!form.email.trim()) errs.email = 'E-posta gereklidir.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli bir e-posta girin.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGeneralError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await api.post('/api/v1/sales-leads', {
        companyName: form.companyName.trim(),
        contactName: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        phone: form.phone,
        email: form.email.trim(),
        branchCount: form.branchCount ? parseInt(form.branchCount, 10) : null,
        message: form.message.trim() || null,
      })
      setSent(true)
    } catch (err) {
      const apiErr = err as ApiError
      setGeneralError(apiErr.message || 'Talebiniz gönderilirken bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = (err?: string) => [
    'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors',
    err
      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-gray-200 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
  ].join(' ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Kapat"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        {sent ? (
          <div className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Talebiniz Alındı!</h3>
            <p className="max-w-sm text-sm text-gray-600">
              Satış ekibimiz talebinizi inceleyip en kısa sürede <strong>+90 {formatPhoneDisplay(form.phone)}</strong> numarasından
              veya <strong>{form.email}</strong> adresinden sizinle iletişime geçecek.
            </p>
            <button onClick={onClose} className="mt-2 text-sm font-medium text-brand-600 hover:underline">
              Kapat
            </button>
          </div>
        ) : (
          <div className="p-8">
            <div className="mb-1 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-500" />
              <h2 className="text-xl font-bold text-gray-900">Kurumsal Plan — Satış Ekibiyle Görüş</h2>
            </div>
            <p className="mb-6 text-sm text-gray-500">
              İhtiyaçlarınızı bize iletin, size özel fiyat teklifiyle en kısa sürede dönelim.
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-firstname" className="mb-1.5 block text-sm font-medium text-gray-700">Ad *</label>
                  <input id="lead-firstname" value={form.firstName} onChange={set('firstName')} placeholder="Ahmet" autoComplete="given-name" className={inputCls(errors.firstName)} />
                  {errors.firstName && <p className="mt-1 text-xs text-red-500">{errors.firstName}</p>}
                </div>
                <div>
                  <label htmlFor="lead-lastname" className="mb-1.5 block text-sm font-medium text-gray-700">Soyad *</label>
                  <input id="lead-lastname" value={form.lastName} onChange={set('lastName')} placeholder="Yılmaz" autoComplete="family-name" className={inputCls(errors.lastName)} />
                  {errors.lastName && <p className="mt-1 text-xs text-red-500">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="lead-company" className="mb-1.5 block text-sm font-medium text-gray-700">İşletme Adı *</label>
                <input id="lead-company" value={form.companyName} onChange={set('companyName')} placeholder="Örn. Elit Güzellik Merkezi" autoComplete="organization" className={inputCls(errors.companyName)} />
                {errors.companyName && <p className="mt-1 text-xs text-red-500">{errors.companyName}</p>}
              </div>
              <div>
                <label htmlFor="lead-email" className="mb-1.5 block text-sm font-medium text-gray-700">E-posta Adresi *</label>
                <input id="lead-email" value={form.email} onChange={set('email')} type="email" placeholder="ornek@email.com" autoComplete="email" className={inputCls(errors.email)} />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="lead-phone" className="mb-1.5 block text-sm font-medium text-gray-700">Telefon Numarası *</label>
                  <div className={`flex w-full overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-brand-500/40 transition-shadow ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}>
                    <span className="flex shrink-0 select-none items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                      🇹🇷 +90
                    </span>
                    <input
                      id="lead-phone"
                      type="tel"
                      value={formatPhoneDisplay(form.phone)}
                      onChange={handlePhoneChange}
                      placeholder="555 000 00 00"
                      autoComplete="tel"
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
                <div>
                  <label htmlFor="lead-branchcount" className="mb-1.5 block text-sm font-medium text-gray-700">Şube Sayısı</label>
                  <input id="lead-branchcount" value={form.branchCount} onChange={set('branchCount')} type="number" min={1} placeholder="Örn. 5" className={inputCls()} />
                </div>
              </div>
              <div>
                <label htmlFor="lead-message" className="mb-1.5 block text-sm font-medium text-gray-700">İhtiyaçlarınız (isteğe bağlı)</label>
                <textarea id="lead-message" value={form.message} onChange={set('message')} rows={3} placeholder="Kaç personel, hangi entegrasyonlar, özel akışlar…" className={`${inputCls()} resize-none`} />
              </div>

              {generalError && <p className="text-sm text-red-500">{generalError}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Gönderiliyor…' : 'Talebi Gönder'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaketSecPage() {
  return (
    <Suspense>
      <PaketSecContent />
    </Suspense>
  )
}
