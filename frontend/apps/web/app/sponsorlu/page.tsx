import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import CheckoutLink from '@/components/CheckoutLink'
import Link from 'next/link'
import { ArrowRight, Check, Star, TrendingUp, Search, Zap, Award, Users, Sparkles, Shield } from 'lucide-react'

export const metadata = { title: 'Sponsorlu Öne Çıkan — JetRandevu' }

const stats = [
  { value: '%320', label: 'Ortalama Tıklanma Artışı' },
  { value: '2.5x', label: 'Daha Fazla Müşteri' },
  { value: '15K+', label: 'Sponsorlu İşletme' },
  { value: '81', label: 'Şehirde Aktif' },
]

const benefits = [
  {
    icon: Star, title: 'Ön Sıralarda Yer Alın', desc: 'Kategorinizde ve aramalarda sponsorlu olarak en üst sıralarda görünün.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: TrendingUp, title: 'Tıklanma Oranınızı Artırın', desc: 'Sponsorlu etiketiyle organik sonuçlardan sıyrılın, rakiplerinizin önüne geçin.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Search, title: 'Doğru Kitleye Ulaşın', desc: 'Sadece sizin sektörünüzde ve bölgenizde arama yapan kullanıcılara öne çıkın.',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: Zap, title: 'Anında Yayına Girin', desc: 'Sponsorlu öne çıkma kampanyanız ödeme sonrası dakikalar içinde aktif olur.',
    gradient: 'from-violet-500 to-purple-500',
  },
]

const plans = [
  {
    name: 'Gümüş', price: '799', originalPrice: '1.199',
    badge: 'Ekonomik',
    features: ['Kategori sayfasında öne çıkma', 'Sponsorlu etiketi', '5.000 aylık gösterim', 'Temel istatistikler', 'E-posta desteği'],
  },
  {
    name: 'Altın', price: '1.999', originalPrice: '2.999',
    badge: 'En Popüler', popular: true,
    features: ['Kategori sayfasında öne çıkma', 'Sponsorlu etiketi', '20.000 aylık gösterim', 'Gelişmiş istatistikler', 'Ana sayfada listeleme', 'Öncelikli destek'],
  },
  {
    name: 'Platin', price: '4.999', originalPrice: '7.499',
    badge: 'Premium',
    features: ['Kategori sayfasında öne çıkma', 'Sponsorlu etiketi', 'Sınırsız gösterim', 'Özel raporlama', 'Ana sayfada listeleme', '7/24 öncelikli destek', 'SEO danışmanlığı'],
  },
]

const showcase = [
  { name: 'Bella Kuaför', city: 'İstanbul', rating: 4.8, category: 'Güzellik', color: 'from-pink-500 to-rose-500' },
  { name: 'Diş Hekimi Murat Yılmaz', city: 'Ankara', rating: 4.9, category: 'Sağlık', color: 'from-blue-500 to-cyan-500' },
  { name: 'Osmangazi Spor Salonu', city: 'Bursa', rating: 4.7, category: 'Fitness', color: 'from-emerald-500 to-green-500' },
  { name: 'Lavanta Terapi', city: 'İzmir', rating: 4.9, category: 'Masaj & Spa', color: 'from-violet-500 to-purple-500' },
]

const testimonials = [
  { name: 'Can Öztürk', business: 'Diş Hekimi Murat Yılmaz', city: 'Ankara', text: 'Sponsorlu öne çıkan olduktan sonra randevu taleplerimiz %150 arttı. Harika bir sistem.', rating: 5 },
  { name: 'Selin Aydın', business: 'Bella Kuaför', city: 'İstanbul', text: 'Rakiplerimin önüne geçmek için mükemmel bir fırsat. Aylık müşteri sayım ikiye katlandı.', rating: 5 },
]

const faq = [
  { q: 'Sponsorlu öne çıkan nedir?', a: 'İşletmenizin belirli anahtar kelime ve kategorilerde, normal sonuçların üzerinde öne çıkarılmasıdır.' },
  { q: 'Ne kadar sürede aktif olur?', a: 'Ödeme sonrası ortalama 15 dakika içinde sponsorlu öne çıkan listenizde yer almaya başlarsınız.' },
  { q: 'Faturalandırma nasıl yapılır?', a: 'Aylık olarak faturalandırılır. İstediğiniz zaman iptal edebilir, bir sonraki dönem yenilenmez.' },
  { q: 'Performansımı görebilir miyim?', a: 'Evet, panelinizden gösterim, tıklanma ve müşteri dönüşüm verilerinizi anlık takip edebilirsiniz.' },
]

export default function SponsorluPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-28 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-5xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-brand-500 mb-6">
              <Sparkles className="h-3 w-3" /> Öne Çıkmanın En Akıllı Yolu
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6">
              İşletmenizi öne çıkarın,<br />
              <span className="bg-gradient-to-r from-brand-500 to-yellow-400 bg-clip-text text-transparent">rakiplerinizi</span> geride bırakın
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-300 mb-10">
              Sponsorlu öne çıkan olarak işletmenizi binlerce kullanıcının karşısına çıkarın, 
              sektörünüzde fark edilin ve müşteri sayınızı katlayın.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register"
                className="group rounded-xl bg-brand-500 px-8 py-3.5 text-base font-bold text-white hover:bg-brand-600 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/25">
                Hemen Başla <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="#packages"
                className="rounded-xl border border-white/20 px-8 py-3.5 text-base font-medium text-gray-300 hover:bg-white/5 transition-all">
                Paketleri İncele
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="relative -mt-12">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-gray-100 bg-gray-100 shadow-xl">
              {stats.map((s) => (
                <div key={s.label} className="bg-white py-8 px-4 text-center">
                  <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Showcase */}
        <section className="py-28">
          <div className="mx-auto max-w-screen-2xl px-4">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Öne Çıkan İşletmeler</p>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Sponsorlu İşletmeler Daha Çok Tercih Ediliyor</h2>
              <p className="mx-auto max-w-2xl text-gray-500">Türkiye&apos;nin dört bir yanından binlerce işletme sponsorlu öne çıkan olarak büyüyor.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
              {showcase.map((s) => (
                <div key={s.name} className="group relative rounded-3xl border border-gray-100 bg-white p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <div className="flex items-start justify-between mb-4">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} shadow-lg`}>
                      <span className="text-lg font-bold text-white">{s.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</span>
                    </div>
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">
                      <Star className="h-3 w-3 fill-amber-500" /> {s.rating}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{s.name}</h3>
                  <p className="text-xs text-gray-500 mb-3">{s.category}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {s.city}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-28">
          <div className="mx-auto max-w-screen-2xl px-4">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Avantajlar</p>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Sponsorlu Öne Çıkmanın Gücü</h2>
              <p className="mx-auto max-w-2xl text-gray-500">Rakiplerinizin bir adım önünde olmak için ihtiyacınız olan her şey.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((b) => (
                <div key={b.title} className="group relative rounded-2xl border border-gray-100 bg-white p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${b.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${b.gradient} mb-5 shadow-lg`}>
                    <b.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="packages" className="py-28">
          <div className="mx-auto max-w-screen-2xl px-4">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Fiyatlandırma</p>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Size Uygun Paketi Seçin</h2>
              <p className="mx-auto max-w-2xl text-gray-500">Her bütçeye uygun paketler. 14 gün içinde memnun kalmazsanız paranız iade.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {plans.map((p) => (
                <div key={p.name} className={`relative rounded-3xl border-2 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${p.popular ? 'border-brand-500 shadow-xl shadow-brand-500/10 scale-105 md:scale-110' : 'border-gray-100 hover:border-gray-200'}`}>
                  {p.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-yellow-400 px-5 py-1 text-xs font-bold text-white shadow-lg">
                        <Star className="h-3 w-3 fill-black" /> En Çok Tercih Edilen
                      </div>
                    </div>
                  )}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                      <span className="rounded-full bg-gray-100 px-3 py-0.5 text-xs font-semibold text-gray-600">{p.badge}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-gray-900">{p.price} ?</span>
                      <span className="text-sm text-gray-400">/ay</span>
                      {p.originalPrice && (
                        <span className="text-sm text-gray-300 line-through">{p.originalPrice} ?</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-gray-600">
                        <Check className="h-4 w-4 text-brand-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <CheckoutLink type="sponsored" plan={p.name}
                    className={`block rounded-xl py-3 text-center text-sm font-bold transition-all ${p.popular ? 'bg-gradient-to-r from-brand-500 to-yellow-400 text-white hover:from-brand-600 hover:to-yellow-500 shadow-lg' : 'border-2 border-gray-200 text-gray-700 hover:border-brand-500 hover:text-brand-600'}`}>
                    {p.popular ? 'Hemen Başla' : 'Paketi Seç'}
                  </CheckoutLink>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-gray-900 py-28">
          <div className="mx-auto max-w-screen-2xl px-4">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Başarı Hikayeleri</p>
              <h2 className="text-4xl font-extrabold text-white mb-4">Sponsorlu İşletmeler Ne Diyor?</h2>
              <p className="mx-auto max-w-2xl text-gray-400">Sponsorlu öne çıkan ile büyüyen işletmelerin başarı hikayeleri.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 max-w-3xl mx-auto">
              {testimonials.map((t) => (
                <div key={t.name} className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-colors">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < t.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/20 text-sm font-bold text-brand-500">
                      {t.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.business}, {t.city}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-28">
          <div className="mx-auto max-w-3xl px-4">
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Sık Sorulan Sorular</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Merak Edilenler</h2>
            </div>
            <div className="space-y-4">
              {faq.map((item) => (
                <details key={item.q} className="group rounded-2xl border border-gray-100 bg-white p-5 [&[open]]:border-brand-200 [&[open]]:bg-brand-50/30 transition-all">
                  <summary className="flex items-center justify-between cursor-pointer list-none">
                    <span className="text-sm font-semibold text-gray-900 group-open:text-brand-600">{item.q}</span>
                    <div className="h-6 w-6 rounded-full bg-gray-100 group-open:bg-brand-500 flex items-center justify-center shrink-0 transition-colors">
                      <svg className="h-3 w-3 text-gray-500 group-open:text-white transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-24">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Öne Çıkmaya Hazır Mısınız?</h2>
            <p className="text-gray-300 text-lg mb-8">Hemen kaydolun, işletmenizi sponsorlu öne çıkan yaparak rakiplerinizin önüne geçin.</p>
            <Link href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-brand-500 px-10 py-4 text-base font-bold text-white hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25">
              Ücretsiz Hesap Oluştur <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
