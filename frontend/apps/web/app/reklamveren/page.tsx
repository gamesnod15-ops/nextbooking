import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import CheckoutLink from '@/components/CheckoutLink'
import Link from 'next/link'
import { ArrowRight, Check, TrendingUp, Eye, Target, BarChart3, Users, Star, Zap, Shield } from 'lucide-react'

export const metadata = { title: 'Reklamveren Ol — NextBooking' }

const stats = [
  { value: '10M+', label: 'Aylık Gösterim' },
  { value: '%240', label: 'Ortalama ROI' },
  { value: '50K+', label: 'Tıklanma/Ay' },
  { value: '%98', label: 'Müşteri Memnuniyeti' },
]

const benefits = [
  {
    icon: Eye, title: 'Dev Görünürlük', desc: 'Ana sayfa, kategori sayfaları ve arama sonuçlarında işletmeniz en önde yer alsın.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: Target, title: 'Hedefli Erişim', desc: 'Konum, kategori ve kullanıcı davranışına göre reklamlarınızı optimize edin.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: TrendingUp, title: 'Gerçek Zamanlı ROI', desc: 'Her kampanyanın gösterim, tıklanma ve dönüşüm verilerini anlık izleyin.',
    gradient: 'from-emerald-500 to-green-500',
  },
  {
    icon: BarChart3, title: 'Detaylı Analitik', desc: 'Rakip analizi, pazar trendleri ve performans raporları ile veri odaklı kararlar alın.',
    gradient: 'from-violet-500 to-purple-500',
  },
]

const plans = [
  {
    name: 'Temel', price: '1.999', originalPrice: '2.999',
    badge: 'Başlangıç',
    features: ['Ana sayfa listeleme', 'Kategori sayfasında öne çıkarma', '10.000 aylık gösterim', 'Temel raporlama', 'E-posta desteği'],
  },
  {
    name: 'Standart', price: '4.999', originalPrice: '6.999',
    badge: 'Popüler', popular: true,
    features: ['Ana sayfa listeleme', 'Kategori sayfasında öne çıkarma', '50.000 aylık gösterim', 'Gelişmiş raporlama', 'Öncelikli destek', 'A/B test imkanı'],
  },
  {
    name: 'Premium', price: '9.999', originalPrice: '14.999',
    badge: 'Profesyonel',
    features: ['Ana sayfa listeleme', 'Kategori sayfasında öne çıkarma', 'Sınırsız gösterim', 'Özel raporlama & Danışmanlık', 'Öncelikli 7/24 destek', 'Adwords & Meta entegrasyonu'],
  },
]

const steps = [
  { num: '1', title: 'Hedef Belirle', desc: 'Kitle, bölge ve bütçenizi seçin.' },
  { num: '2', title: 'Reklam Oluştur', desc: 'Görsel, başlık ve açıklamanızı ekleyin.' },
  { num: '3', title: 'Yayına Al', desc: 'Kampanyanız anında başlasın.' },
  { num: '4', title: 'İzle & Optimize', desc: 'Performansı takip edin, iyileştirin.' },
]

const testimonials = [
  { name: 'Ayşe Yılmaz', business: 'Bella Kuaför', city: 'İstanbul', text: 'Reklam kampanyasına başladıktan sonra müşteri sayımız %70 arttı. Kesinlikle tavsiye ediyorum.', rating: 5 },
  { name: 'Mehmet Demir', business: 'Osmangazi Spor Salonu', city: 'Bursa', text: 'Rakip analizi ve hedefleme özellikleri sayesinde bütçemizi çok verimli kullanıyoruz.', rating: 5 },
  { name: 'Zeynep Kaya', business: 'Lavanta Terapi', city: 'İzmir', text: 'Aylık 5.000 TL\'lik bütçeyle 40.000\'den fazla potansiyel müşteriye ulaştık.', rating: 5 },
]

const faq = [
  { q: 'Reklam kampanyası ne zaman başlar?', a: 'Kampanyanız ödeme onaylandıktan sonra en geç 24 saat içinde yayına girer.' },
  { q: 'Bütçemi sonradan değiştirebilir miyim?', a: 'Evet, dilediğiniz zaman kampanya bütçenizi artırabilir veya azaltabilirsiniz.' },
  { q: 'Hangi ödeme yöntemlerini kabul ediyorsunuz?', a: 'Kredi kartı, banka kartı ve EFT/havale ile ödeme yapabilirsiniz.' },
  { q: 'Reklam performansımı nasıl takip ederim?', a: 'Panelinizden anlık gösterim, tıklanma ve dönüşüm verilerinizi görüntüleyebilirsiniz.' },
]

export default function ReklamverenPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-28 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-brand-500/5 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-violet-500/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-5xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-brand-500 mb-6">
              <Zap className="h-3 w-3" /> Yeni Nesil Reklam Platformu
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] mb-6">
              İşletmenizi<br />
              <span className="bg-gradient-to-r from-brand-500 to-yellow-400 bg-clip-text text-transparent">büyütmeye</span> hazır mısınız?
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-300 mb-10">
              NextBooking reklam ağı ile işletmenizi hedef kitlenize ulaştırın, müşteri sayınızı katlayın. 
              Üstelik sadece sonuç alacağınız reklam modeliyle.
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

        {/* Benefits */}
        <section className="py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Neden Reklam Verilmeli?</p>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">İşletmenize Değer Katan Çözümler</h2>
              <p className="mx-auto max-w-2xl text-gray-500">Veri odaklı reklam çözümlerimizle doğru kitleye, doğru zamanda, doğru mesajla ulaşın.</p>
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

        {/* How it works */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Nasıl Çalışır?</p>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">4 Adımda Reklam Yayınlayın</h2>
              <p className="mx-auto max-w-2xl text-gray-500">Karmaşık süreçlere son. Birkaç tıklamayla reklam kampanyanızı başlatın.</p>
            </div>
            <div className="relative grid gap-8 md:grid-cols-4 max-w-5xl mx-auto">
              <div className="absolute top-12 left-[15%] right-[15%] h-px bg-gradient-to-r from-brand-500/0 via-brand-500/30 to-brand-500/0 hidden md:block" />
              {steps.map((s, i) => (
                <div key={s.num} className="relative text-center">
                  <div className="relative z-10 mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white border-2 border-brand-500 shadow-xl">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-yellow-400">
                      <span className="text-2xl font-extrabold text-white">{s.num}</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5">{s.title}</h3>
                  <p className="text-sm text-gray-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section id="packages" className="py-28">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Fiyatlandırma</p>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-4">Size Uygun Paketi Seçin</h2>
              <p className="mx-auto max-w-2xl text-gray-500">Tüm paketlerde 14 gün para iade garantisi. İstediğiniz zaman yükseltebilirsiniz.</p>
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
                      <span className="text-4xl font-extrabold text-gray-900">{p.price} ₺</span>
                      <span className="text-sm text-gray-400">/ay</span>
                      {p.originalPrice && (
                        <span className="text-sm text-gray-300 line-through">{p.originalPrice} ₺</span>
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
                  <CheckoutLink type="ad" plan={p.name}
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
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-16 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Müşteri Yorumları</p>
              <h2 className="text-4xl font-extrabold text-white mb-4">Reklamverenler Ne Diyor?</h2>
              <p className="mx-auto max-w-2xl text-gray-400">Binlerce işletme NextBooking ile büyüyor. Onların başarı hikayelerini keşfedin.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
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
            <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Reklamveren Olmaya Hazır Mısınız?</h2>
            <p className="text-gray-300 text-lg mb-8">İlk kampanyanızı oluşturun, işletmenizi binlerce potansiyel müşteriye tanıtın.</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/register"
                className="group rounded-xl bg-brand-500 px-10 py-4 text-base font-bold text-white hover:bg-brand-600 transition-all flex items-center gap-2 shadow-lg shadow-brand-500/25">
                Ücretsiz Hesap Oluştur <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
