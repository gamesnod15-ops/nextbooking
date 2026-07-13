import Link from 'next/link'
import { Check } from 'lucide-react'

const plans = [
  {
    id: 'starter',
    name: 'Başlangıç',
    badge: 'Başlangıç',
    price: '₺299',
    period: '/ay',
    desc: 'Temel operasyonları hızlıca başlatın.',
    features: [
      'Temel randevu, takvim ve müşteri yönetimi',
      'Ödeme takibi ve temel raporlar',
      'Formlar ve paket satışı',
      'Tek şube ile hızlı başlangıç',
      '14 gün ücretsiz deneme',
    ],
    cta: 'Ücretsiz Başla',
    popular: false,
    accentClass: 'border-slate-200',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'business',
    name: 'Büyüme',
    badge: 'Büyüme',
    price: '₺599',
    period: '/ay',
    desc: 'Pazarlama akışlarını ve çoklu şube operasyonlarını yönetin.',
    features: [
      'Kampanya, kupon ve indirim yönetimi',
      'Online rezervasyon ve bekleme listesi',
      'Sadakat programı ve yorum toplama',
      'Çoklu şube yönetimi',
      'SMS & e-posta hatırlatma',
    ],
    cta: 'Ücretsiz Başla',
    popular: true,
    accentClass: 'border-brand-300',
    badgeClass: 'bg-cyan-50 text-cyan-700',
  },
  {
    id: 'professional',
    name: 'Profesyonel',
    badge: 'Otomasyon',
    price: '₺999',
    period: '/ay',
    desc: 'Stok, finans ve ekip performansını tek yerden yönetin.',
    features: [
      'Ürün satışı ve stok yönetimi',
      'Cari alacak ve taksit takibi',
      'Personel performans takibi',
      'Prim, hak ediş, borç ve ödeme takibi',
      'Gelişmiş analitik & raporlar',
    ],
    cta: 'Ücretsiz Başla',
    popular: false,
    accentClass: 'border-blue-200',
    badgeClass: 'bg-blue-50 text-blue-700',
  },
  {
    id: 'custom',
    name: 'Kurumsal',
    badge: 'Kurumsal',
    price: 'Özel',
    period: ' fiyat',
    desc: 'Kuruma özel kurgu, özel akışlar ve genişleme paketi.',
    features: [
      'Tüm Professional özellikleri',
      'Canlı chatbot ve walk-in sıra yönetimi',
      'Özel entegrasyon ve onboarding',
      'Kuruma özel modül kurgusu',
      'SLA garantisi & 7/24 destek',
    ],
    cta: 'Satış Ekibiyle Görüş',
    popular: false,
    accentClass: 'border-amber-200',
    badgeClass: 'bg-amber-50 text-amber-700',
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-extrabold text-gray-900">İşletmenize Uygun Plan</h2>
          <p className="mt-4 text-lg text-gray-600">14 gün ücretsiz deneyin. Kredi kartı gerekmez.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border-2 p-6 ${
                plan.popular
                  ? 'bg-brand-500 text-black border-brand-300 shadow-2xl scale-[1.03]'
                  : `bg-white ${plan.accentClass} shadow-sm`
              }`}
            >
                {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-black px-3 py-1 text-xs font-bold text-brand-500 shadow">
                    En Popüler
                  </span>
                </div>
              )}

              {/* Badge */}
              <div className="mb-3">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${plan.popular ? 'bg-white/20 text-black' : plan.badgeClass}`}>
                  {plan.badge}
                </span>
              </div>

              <h3 className={`text-xl font-bold ${plan.popular ? 'text-black' : 'text-gray-900'}`}>{plan.name}</h3>
              <p className={`mt-1 text-xs leading-relaxed ${plan.popular ? 'text-black/70' : 'text-gray-500'}`}>{plan.desc}</p>

              <div className="mt-5 flex items-baseline gap-0.5">
                <span className={`text-4xl font-extrabold ${plan.popular ? 'text-black' : 'text-gray-900'}`}>{plan.price}</span>
                <span className={`text-sm font-medium ${plan.popular ? 'text-black/70' : 'text-gray-500'}`}>{plan.period}</span>
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${plan.popular ? 'text-black/60' : 'text-gray-900'}`} />
                    <span className={plan.popular ? 'text-black/80' : 'text-gray-700'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.id === 'custom' ? '/iletisim' : '/register'}
                className={`mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                  plan.popular
                    ? 'bg-black text-brand-500 hover:bg-gray-900 shadow'
                    : 'bg-brand-500 text-black hover:bg-brand-600'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Tüm planlar 14 gün ücretsiz deneme ile başlar. İstediğiniz zaman plan değiştirin veya iptal edin.
        </p>
      </div>
    </section>
  )
}

