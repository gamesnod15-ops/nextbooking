import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata = { title: 'Hakkımızda — JetRandevu' }

const milestones = [
  {
    year: '2023',
    title: 'Kuruluş',
    desc: 'İstanbul\'da 5 kişilik bir ekiple kurulduk. Basit bir soruna çözüm arıyorduk.',
    icon: '🚀',
  },
  {
    year: '2024',
    title: 'İlk 1.000 Müşteri',
    desc: '6 ayda 1.000 aktif işletmeye ulaştık. Güven inşa ettik.',
    icon: '🎯',
  },
  {
    year: '2024',
    title: 'Seri A Yatırım',
    desc: 'Ekibimizi 30 kişiye genişlettik. Teknoloji altyapımızı güçlendirdik.',
    icon: '💰',
  },
  {
    year: '2025',
    title: '10.000+ İşletme',
    desc: 'Türkiye genelinde 10.000+ işletme bize güvendi. Büyümeye devam ediyoruz.',
    icon: '🏆',
  },
]

const values = [
  {
    title: 'Müşteri Odaklılık',
    desc: 'Her kararımızda müşterilerimizin başarısını ön planda tutuyoruz.',
    icon: '👥',
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Hız & Basitlik',
    desc: 'Karmaşık yazılımlar yerine 5 dakikada kullanılabilir bir platform.',
    icon: '⚡',
    color: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Güvenilirlik',
    desc: '%99.9 uptime garantisi ve PCI DSS uyumlu altyapı.',
    icon: '🛡️',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    title: 'Empati',
    desc: 'İşletme sahiplerinin günlük zorluklarını anlıyoruz.',
    icon: '💙',
    color: 'from-violet-500 to-purple-600',
  },
]

const team = [
  {
    name: 'Mert Yıldız',
    role: 'Kurucu & CEO',
    img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
    quote: 'Teknoloji her işletmenin erişebileceği kadar basit olmalı.',
  },
  {
    name: 'Selin Kaya',
    role: 'CTO',
    img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80',
    quote: 'Mükemmel ürün, kullanıcıyı düşünerek başlar.',
  },
  {
    name: 'Emre Doğan',
    role: 'Ürün Direktörü',
    img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    quote: 'Her detay, kullanıcı deneyimini etkiler.',
  },
  {
    name: 'Ayşe Tekin',
    role: 'Müşteri Deneyimi',
    img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    quote: 'Müşterilerimizin sesi her zaman önceliğimiz.',
  },
  {
    name: 'Can Demir',
    role: 'Baş Geliştirici',
    img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    quote: 'Temiz kod, hızlı product demektir.',
  },
]

export default function HakkimizdaPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Story + Photo Grid */}
        <section className="bg-[#FAF8F5] py-24 md:py-32">
          <div className="mx-auto max-w-6xl px-5">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">Hikayemiz</p>
                <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-6">
                  Basit bir sorudan<br />büyük bir platforma
                </h2>
                <div className="space-y-4 text-gray-600 leading-relaxed">
                  <p>
                    Kurucumuz Mert, kardeşinin güzellik salonunu ziyaret ettiğinde telefon trafiğinin yarattığı kaosu gördü.
                    Müşteriler randevu almak için saat bekliyordu.
                  </p>
                  <p>
                    &ldquo;Bu sorunu çözmek için birkaç hafta yeter&rdquo; diye düşünerek başladığı yolculuk, bugün
                    10.000&apos;den fazla işletmenin güvendiği bir platforma dönüştü.
                  </p>
                  <p>
                    Ekibimiz SaaS, ödeme sistemleri ve kullanıcı deneyimi alanlarında deneyimli geliştiriciler,
                    tasarımcılar ve işletme uzmanlarından oluşuyor.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <img
                    src="https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80"
                    alt="Ekip çalışması"
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80"
                    alt="Toplantı"
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                </div>
                <div className="space-y-3 pt-8">
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&q=80"
                    alt="Workshop"
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=400&q=80"
                    alt="Ofis"
                    className="w-full h-48 object-cover rounded-2xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Horizontal Timeline */}
        <section className="bg-white py-24 overflow-hidden">
          <div className="mx-auto max-w-6xl px-5">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">Yolculuğumuz</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Zaman Çizelgemiz</h2>
            </div>

            {/* Horizontal scroll container */}
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent -translate-y-1/2 hidden md:block" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {milestones.map((m, i) => (
                  <div key={i} className="relative group">
                    {/* Card */}
                    <div className="relative bg-white border-2 border-gray-100 rounded-3xl p-6 text-center hover:border-brand-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                      {/* Icon circle */}
                      <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                        {m.icon}
                      </div>

                      {/* Year badge */}
                      <div className="mb-3 inline-flex items-center rounded-full bg-brand-50 px-3 py-1">
                        <span className="text-xs font-bold text-brand-600">{m.year}</span>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2">{m.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{m.desc}</p>

                      {/* Bottom accent line */}
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-brand-500 rounded-full group-hover:w-12 transition-all duration-300" />
                    </div>

                    {/* Connector dot (desktop) */}
                    {i < milestones.length - 1 && (
                      <div className="hidden md:block absolute top-1/2 -right-4 w-3 h-3 rounded-full bg-brand-500 border-4 border-white shadow -translate-y-1/2 z-10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24 overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />

          <div className="relative mx-auto max-w-5xl px-5">
            <div className="text-center mb-14">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Değerlerimiz</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">Bizi biz yapan ilkeler</h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map(({ title, desc, icon, color }) => (
                <div key={title} className="group relative rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:-translate-y-2">
                  {/* Gradient top bar */}
                  <div className={`absolute top-0 left-6 right-6 h-1 rounded-full bg-gradient-to-r ${color} opacity-0 group-hover:opacity-100 transition-opacity`} />

                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl group-hover:scale-110 transition-transform duration-300">
                    {icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-6xl px-5">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3">Ekibimiz</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Arkamızdaki insanlar</h2>
              <p className="mt-3 text-gray-500">Tutkulu ekibimizden bazı isimler</p>
            </div>
            <div className="grid grid-cols-2 gap-6 md:gap-8 lg:grid-cols-5">
              {team.map((member) => (
                <div key={member.name} className="group text-center">
                  <div className="relative mx-auto mb-4 w-28 h-28 md:w-32 md:h-32 overflow-hidden rounded-2xl">
                    <img
                      src={member.img}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{member.role}</p>
                  <p className="text-[11px] text-gray-400 mt-2 italic leading-relaxed hidden md:block">
                    &ldquo;{member.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1a1a1a] py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Bizimle Büyümek İster misiniz?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-8">
            14 gün ücretsiz deneme ile JetRandevu&apos;ı keşfedin.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-gray-900 hover:bg-gray-100 transition-all hover:-translate-y-0.5 shadow-lg"
          >
            Ücretsiz Başla <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}
