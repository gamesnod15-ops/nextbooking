import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata = { title: 'Özellikler — JetRandevu', description: 'JetRandevu\'ýn tüm özelliklerini keþfedin.' }

const features = [
  {
    title: 'Online Randevu',
    subtitle: '7/24 Randevu Yönetimi',
    desc: 'Müþterileriniz web ve mobil üzerinden 7/24 randevu alabilir. Gerçek zamanlý müsaitlik takvimi sayesinde çifte randevu sorunu artýk yok. Randevular otomatik olarak personele atanýr.',
    bullets: ['Gerçek zamanlý müsaitlik takvimi', 'Çifte randevu korumasý', 'Mobil ve web uyumlu'],
    img: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
    bg: 'bg-blue-50',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-100',
    dotColor: '#3b82f6',
  },
  {
    title: 'Otomatik Hatýrlatma',
    subtitle: 'Hayýr-deme Oranýný %70 Azaltýn',
    desc: 'SMS ve e-posta ile otomatik hatýrlatmalar gönderin. Randevusuna gelmeyen müþteriler artýk tarih olmayacak. Hatýrlatma zamanlarýný ve içeriklerini tamamen özelleþtirin.',
    bullets: ['SMS ve e-posta hatýrlatma', 'Özelleþtirilebilir zamanlama', '%70 daha az hayýr-deme'],
    img: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&q=80',
    bg: 'bg-emerald-50',
    accent: 'text-emerald-600',
    accentBg: 'bg-emerald-100',
    dotColor: '#10b981',
  },
  {
    title: 'Gelir Analitiði',
    subtitle: 'Verilerle Yönetin',
    desc: 'Günlük, haftalýk, aylýk gelir raporlarý ve detaylý istatistikler. Ýþletmenizin performansýný gerçek zamanlý takip edin, veri odaklý kararlar alýn.',
    bullets: ['Gerçek zamanlý gelir raporlarý', 'Personel performans analizi', 'Trend grafikleri ve istatistikler'],
    img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
    bg: 'bg-violet-50',
    accent: 'text-violet-600',
    accentBg: 'bg-violet-100',
    dotColor: '#8b5cf6',
  },
  {
    title: 'Çoklu Personel',
    subtitle: 'Ekibinizi Kolayca Yönetin',
    desc: 'Birden fazla personel için ayrý takvimler, yetkilendirme seviyeleri ve performans takibi. Her personelin kendi randevularýný yönetmesini saðlayýn.',
    bullets: ['Bireysel personel takvimi', 'Rol bazlý yetkilendirme', 'Performans takibi'],
    img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
    bg: 'bg-amber-50',
    accent: 'text-amber-600',
    accentBg: 'bg-amber-100',
    dotColor: '#f59e0b',
  },
  {
    title: 'Güvenli Ödeme',
    subtitle: 'PCI DSS Uyumlu Altyapý',
    desc: 'Stripe ve Ýyzico entegrasyonu ile güvenli online ödeme alýn. Ön ödeme, depozito ve tam ödeme seçenekleri. Tüm iþlemler SSL ile þifrelenir.',
    bullets: ['Stripe & Ýyzico entegrasyonu', 'SSL þifreleme', 'Ön ödeme ve depozito desteði'],
    img: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80',
    bg: 'bg-rose-50',
    accent: 'text-rose-600',
    accentBg: 'bg-rose-100',
    dotColor: '#f43f5e',
  },
  {
    title: 'Sadakat Programý',
    subtitle: 'Müþteri Baðlýlýðýný Artýrýn',
    desc: 'Puan, kupa ve ödüllerle müþterilerinizi tekrar tekrar iþletmenize çekin. Sadakat programý ile müþteri yaþam boyu deðerini artýrýn.',
    bullets: ['Puan ve ödül sistemi', 'Kupa ve seviye takibi', 'Müþteri yaþam boyu deðer artýþý'],
    img: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=600&q=80',
    bg: 'bg-orange-50',
    accent: 'text-orange-600',
    accentBg: 'bg-orange-100',
    dotColor: '#f97316',
  },
  {
    title: 'Hýzlý Kurulum',
    subtitle: '5 Dakikada Hazýr Olun',
    desc: 'Karmaþýk kurulum adýmlarý yok. E-posta adresiniz ve iþletme bilgilerinizle hesabýnýzý oluþturun, hemen müþteri kabul etmeye baþlayýn.',
    bullets: ['2 dakikada hesap oluþturma', 'Kolay iþletme kurulumu', 'Teknik bilgi gerektirmez'],
    img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&q=80',
    bg: 'bg-teal-50',
    accent: 'text-teal-600',
    accentBg: 'bg-teal-100',
    dotColor: '#14b8a6',
  },
  {
    title: 'Mobil Uygulama',
    subtitle: 'Her An, Her Yerde',
    desc: 'iOS ve Android için optimize edilmiþ mobil deneyim. Randevularýnýzý telefonunuzdan yönetin, bildirimler anýnda cebinize gelsin.',
    bullets: ['iOS ve Android uygulama', 'Push bildirimleri', 'Çevrimdýþý eriþim'],
    img: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80',
    bg: 'bg-sky-50',
    accent: 'text-sky-600',
    accentBg: 'bg-sky-100',
    dotColor: '#0ea5e9',
  },
]

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Feature Sections */}
        {features.map((f, i) => {
          const isReversed = i % 2 === 1
          return (
            <section key={f.title} className={`relative ${f.bg} py-20 md:py-28 overflow-hidden`}>
              <div aria-hidden className="absolute inset-0 opacity-[0.03]"
                style={{ backgroundImage: `radial-gradient(circle at 1px 1px, ${f.dotColor} 1px, transparent 0)`, backgroundSize: '20px 20px' }} />

              <div className="relative mx-auto max-w-6xl px-5">
                <div className={`grid gap-12 lg:grid-cols-2 items-center ${isReversed ? 'lg:[direction:rtl]' : ''}`}>
                  {/* Text */}
                  <div className={isReversed ? 'lg:[direction:ltr]' : ''}>
                    <span className={`inline-flex items-center gap-1.5 rounded-full ${f.accentBg} px-3 py-1 text-xs font-semibold ${f.accent} mb-4`}>
                      {f.subtitle}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-5">
                      {f.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed mb-6">{f.desc}</p>
                    <ul className="space-y-3">
                      {f.bullets.map((b) => (
                        <li key={b} className="flex items-center gap-2.5 text-sm text-gray-700">
                          <CheckCircle className={`h-4 w-4 shrink-0 ${f.accent}`} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Image */}
                  <div className={`relative ${isReversed ? 'lg:[direction:ltr]' : ''}`}>
                    <div className="relative overflow-hidden rounded-3xl shadow-2xl">
                      <img src={f.img} alt={f.title} className="w-full h-72 md:h-96 object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    </div>
                    <div className={`absolute -bottom-4 ${isReversed ? '-left-4' : '-right-4'} rounded-2xl ${f.accentBg} px-5 py-3 shadow-lg`}>
                      <p className={`text-sm font-bold ${f.accent}`}>{f.title}</p>
                      <p className="text-xs text-gray-500">JetRandevu ile tanýþýn</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}

        {/* CTA */}
        <section className="bg-[#1a1a1a] py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Tüm Bu Özellikler Sizi Bekliyor
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            14 gün ücretsiz deneme ile JetRandevu&apos;ý keþfedin. Kredi kartý gerekmez.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-gray-900 hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Ücretsiz Baþla <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
