import { Navbar }  from '@/components/Navbar'
import { Footer }  from '@/components/Footer'
import { CtaSection } from '@/components/CtaSection'
import { Users, Target, Rocket, Heart, Globe, Shield, BarChart3, Calendar } from 'lucide-react'

export const metadata = { title: 'Hakkımızda — NextBooking' }

const milestones = [
  { year: '2023', title: 'Kuruluş', desc: 'İstanbul\'da 5 kişilik bir ekiple kurulduk. Küçük işletmelerin dijitalleşme sorununu çözmeye odaklandık.' },
  { year: '2024 Q1', title: 'İlk 1.000 Müşteri', desc: 'Lansmandan yalnızca 6 ay sonra 1.000 aktif işletmeye ulaştık.' },
  { year: '2024 Q3', title: 'Seri A Yatırım', desc: 'Büyümemizi hızlandırmak için yatırım aldık ve ekibimizi 30 kişiye genişlettik.' },
  { year: '2025', title: '10.000+ İşletme', desc: 'Türkiye\'nin her şehrinden 10.000\'den fazla işletme NextBooking\'ı kullanıyor.' },
]

const values = [
  { icon: Target,   title: 'Müşteri Odaklılık',  desc: 'Her kararımızda müşterilerimizin başarısını ön planda tutuyoruz.' },
  { icon: Rocket,   title: 'Hız & Basitlik',     desc: 'Karmaşık yazılımlar yerine 5 dakikada kullanılabilir bir platform.' },
  { icon: Shield,   title: 'Güvenilirlik',        desc: '%99.9 uptime garantisi ve PCI DSS uyumlu güvenli altyapı.' },
  { icon: Heart,    title: 'Empati',              desc: 'İşletme sahiplerinin günlük zorluklarını anlıyor, çözümlerimizi gerçek ihtiyaçlara göre şekillendiriyoruz.' },
]

const stats = [
  { value: '10.000+', label: 'Aktif İşletme', icon: Users },
  { value: '2M+',     label: 'Aylık Randevu',  icon: Calendar },
  { value: '%99.9',   label: 'Uptime',         icon: BarChart3 },
  { value: '81',      label: 'Şehirde Aktif',  icon: Globe },
]

const team = [
  { name: 'Mert Yıldız',    role: 'Kurucu & CEO',       initials: 'MY', bg: 'bg-brand-500' },
  { name: 'Selin Kaya',     role: 'CTO',                initials: 'SK', bg: 'bg-violet-500' },
  { name: 'Emre Doğan',     role: 'Ürün Direktörü',     initials: 'ED', bg: 'bg-emerald-500' },
  { name: 'Ayşe Tekin',     role: 'Müşteri Deneyimi',   initials: 'AT', bg: 'bg-amber-500' },
]

export default function HakkimizdaPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-28 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-blue-500/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-4">Hakkımızda</p>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              İşletmeleri<br />
              <span className="bg-gradient-to-r from-brand-500 to-yellow-400 bg-clip-text text-transparent">dijitalleştirme</span> misyonuyla yola çıktık
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              NextBooking, 2023 yılında İstanbul&apos;da küçük işletmelerin dijitalleşme sürecini hızlandırmak amacıyla kuruldu.
              Misyonumuz: Her işletme sahibinin teknolojiden faydalanabileceği bir dünya yaratmak.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white py-16 border-b border-gray-100">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map(({ value, label, icon: Icon }) => (
                <div key={label} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
                    <Icon className="h-6 w-6 text-brand-500" />
                  </div>
                  <p className="text-3xl font-extrabold bg-gradient-to-br from-brand-500 to-violet-500 bg-clip-text text-transparent">{value}</p>
                  <p className="mt-1 text-sm font-medium text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-brand-500 mb-2">Hikayemiz</p>
                <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                  Basit bir sorudan<br />büyük bir platforma
                </h2>
                <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Kurucumuz Mert, kardeşinin güzellik salonunu ziyaret ettiğinde telefon trafiğinin yarattığı kaosu gördü.
                    Müşteriler randevu almak için saat bekliyordu, defterler karmaşıktı, iptal haberleri son anda geliyordu.
                  </p>
                  <p>
                    &ldquo;Bu sorunu çözmek için birkaç hafta yeter&rdquo; diye düşünerek başladığı yolculuk, bugün
                    Türkiye genelinde 10.000&apos;den fazla işletmenin güvendiği bir platforma dönüştü.
                  </p>
                  <p>
                    Ekibimiz SaaS, ödeme sistemleri ve kullanıcı deneyimi alanlarında deneyimli geliştiriciler,
                    tasarımcılar ve işletme uzmanlarından oluşuyor. Her ay 2 milyonun üzerinde randevu yönetilmesine yardımcı oluyoruz.
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {milestones.map((m, i) => (
                  <div key={m.year} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${i === milestones.length - 1 ? 'bg-brand-500' : 'bg-gray-300'}`}>
                        {i + 1}
                      </div>
                      {i < milestones.length - 1 && <div className="mt-1 w-0.5 flex-1 bg-gray-200" />}
                    </div>
                    <div className={`pb-6 ${i < milestones.length - 1 ? '' : ''}`}>
                      <span className="text-xs font-bold text-brand-500 uppercase tracking-wide">{m.year}</span>
                      <h3 className="mt-0.5 text-sm font-bold text-gray-900">{m.title}</h3>
                      <p className="mt-1 text-xs text-gray-600 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-gradient-to-br from-brand-50/40 to-violet-50/40 py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-500 mb-2">Değerlerimiz</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Bizi biz yapan ilkeler</h2>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {values.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-2xl border border-white bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
                    <Icon className="h-6 w-6 text-brand-500" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-500 mb-2">Ekibimiz</p>
              <h2 className="text-3xl font-extrabold text-gray-900">Arkamızdaki insanlar</h2>
              <p className="mt-3 text-gray-600">30+ kişilik tutkulu ekibimizden bazı isimler</p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {team.map(({ name, role, initials, bg }) => (
                <div key={name} className="text-center">
                  <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl ${bg} text-2xl font-extrabold text-white shadow-md`}>
                    {initials}
                  </div>
                  <p className="text-sm font-bold text-gray-900">{name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
