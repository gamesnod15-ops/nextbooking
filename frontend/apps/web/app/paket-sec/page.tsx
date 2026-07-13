'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarCheck, Check, Zap, Star, Building2, ArrowRight, Sparkles } from 'lucide-react'

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Başlangıç',
    price: '₺299',
    period: '/ay',
    desc: 'Temel operasyonları hızlıca başlatın.',
    icon: Zap,
    color: 'slate',
    features: [
      'Temel randevu ve takvim yönetimi',
      'Müşteri yönetimi',
      'Ödeme takibi ve temel raporlar',
      'Formlar ve paket satışı',
      'Tek şube',
      '14 gün ücretsiz deneme',
    ],
    popular: false,
    accentBorder: 'border-slate-200',
    accentBg: 'bg-slate-50',
    badgeClass: 'bg-slate-100 text-slate-700',
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    btnClass: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'En Popüler',
    price: '₺599',
    period: '/ay',
    desc: 'Pazarlama ve çoklu şube operasyonları.',
    icon: Star,
    color: 'brand',
    features: [
      'Tüm Starter özellikleri',
      'Kampanya, kupon ve indirim yönetimi',
      'Online rezervasyon ve bekleme listesi',
      'Sadakat programı ve yorum toplama',
      'Çoklu şube yönetimi',
      'SMS & e-posta hatırlatma',
    ],
    popular: true,
    accentBorder: 'border-brand-300',
    accentBg: 'bg-brand-500',
    badgeClass: 'bg-white/20 text-black',
    iconBg: 'bg-white/20',
    iconColor: 'text-black',
    btnClass: 'bg-white text-brand-600 hover:bg-brand-50 font-bold',
  },
  {
    id: 'professional',
    name: 'Professional',
    badge: 'Otomasyon',
    price: '₺999',
    period: '/ay',
    desc: 'Stok, finans ve ekip performansı.',
    icon: Building2,
    color: 'blue',
    features: [
      'Tüm Business özellikleri',
      'Ürün satışı ve stok yönetimi',
      'Cari alacak ve taksit takibi',
      'Personel performans takibi',
      'Prim, hak ediş ve borç takibi',
      'Gelişmiş analitik & raporlar',
    ],
    popular: false,
    accentBorder: 'border-blue-200',
    accentBg: 'bg-blue-50',
    badgeClass: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-black',
  },
  {
    id: 'custom',
    name: 'Custom',
    badge: 'Kurumsal',
    price: 'Özel',
    period: ' fiyat',
    desc: 'Kuruma özel akışlar ve SLA garantisi.',
    icon: Sparkles,
    color: 'amber',
    features: [
      'Tüm Professional özellikleri',
      'Canlı chatbot ve walk-in sıra yönetimi',
      'Özel entegrasyon ve onboarding',
      'Kuruma özel modül kurgusu',
      'SLA garantisi',
      '7/24 öncelikli destek',
    ],
    popular: false,
    accentBorder: 'border-amber-200',
    accentBg: 'bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-700',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    btnClass: 'bg-amber-500 hover:bg-amber-600 text-black',
  },
]

function PaketSecContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const planFromUrl = searchParams.get('plan')
    const planFromStorage = localStorage.getItem('selectedPlan')
    const plan = planFromUrl || planFromStorage
    if (plan && plans.some((p) => p.id === plan)) {
      setSelected(plan)
    }

    const tokenFromUrl = searchParams.get('_token')
    if (tokenFromUrl) {
      localStorage.setItem('accessToken', tokenFromUrl)
    }
  }, [])

  function handleContinue() {
    if (!selected) return
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
              <CalendarCheck className="h-4 w-4 text-black" />
            </div>
            <span className="text-base font-bold text-gray-900">NextBooking</span>
          </Link>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✓</span>
            <span className="text-gray-400">Hesap</span>
            <span className="text-gray-300">›</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-black text-xs font-bold">2</span>
            <span className="font-semibold text-gray-800">Paket</span>
            <span className="text-gray-300">›</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-gray-400 text-xs font-bold">3</span>
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
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isSelected = selected === plan.id
            const isPopular = plan.popular

            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelected(plan.id)}
                className={[
                  'relative flex flex-col rounded-2xl border-2 text-left transition-all focus:outline-none',
                  isPopular
                    ? `${plan.accentBg} text-black shadow-2xl scale-[1.03]`
                    : `bg-white ${isSelected ? 'border-brand-400 shadow-lg ring-2 ring-brand-400/30' : `${plan.accentBorder} shadow-sm hover:shadow-md`}`,
                  isSelected && !isPopular ? 'scale-[1.02]' : '',
                ].join(' ')}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900 shadow">
                    ⭐ En Popüler
                  </div>
                )}

                {/* Selected indicator */}
                {isSelected && !isPopular && (
                  <div className="absolute -top-3 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-black text-xs">
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
                      {plan.badge}
                    </span>
                  </div>

                  {/* Name + desc */}
                  <h3 className={`text-lg font-extrabold ${isPopular ? 'text-black' : 'text-gray-900'}`}>{plan.name}</h3>
                  <p className={`mt-1 text-xs leading-relaxed ${isPopular ? 'text-black/75' : 'text-gray-500'}`}>{plan.desc}</p>

                  {/* Price */}
                  <div className="mt-4 mb-5">
                    <span className={`text-3xl font-extrabold ${isPopular ? 'text-black' : 'text-gray-900'}`}>{plan.price}</span>
                    <span className={`text-sm ${isPopular ? 'text-black/70' : 'text-gray-500'}`}>{plan.period}</span>
                    {plan.id !== 'custom' && (
                      <p className={`text-xs mt-0.5 ${isPopular ? 'text-black/60' : 'text-gray-400'}`}>+ KDV • 14 gün ücretsiz</p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className={`flex items-start gap-2 text-xs ${isPopular ? 'text-black/90' : 'text-gray-700'}`}>
                        <Check className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isPopular ? 'text-black' : 'text-emerald-500'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Select button */}
                  <div className={`mt-6 w-full rounded-xl py-2.5 text-center text-sm font-semibold transition-all ${
                    plan.id === 'custom'
                      ? plan.btnClass
                      : isSelected
                        ? isPopular
                          ? plan.btnClass
                          : 'bg-brand-500 text-black'
                        : isPopular
                          ? plan.btnClass
                          : `border-2 ${plan.accentBorder} text-gray-700 hover:border-brand-300`
                  }`}>
                    {plan.id === 'custom' ? 'Satış Ekibiyle Görüş' : isSelected ? '✓ Seçildi' : 'Seç'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

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
            className="flex items-center gap-2 rounded-2xl bg-brand-500 px-10 py-4 text-base font-bold text-black shadow-lg hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-xl"
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
