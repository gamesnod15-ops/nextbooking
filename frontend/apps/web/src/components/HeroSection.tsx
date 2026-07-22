import Link from 'next/link'
import { ArrowRight, Play } from 'lucide-react'

const CATEGORIES = [
  { label: 'Kuaför',          emoji: '✂️' },
  { label: 'Güzellik Salonu', emoji: '💄' },
  { label: 'Diş Kliniği',     emoji: '🦷' },
  { label: 'Fizyoterapi',     emoji: '🏃' },
  { label: 'Spor Salonu',     emoji: '💪' },
  { label: 'Spa & Masaj',     emoji: '🧘' },
  { label: 'Tırnak Salonu',   emoji: '💅' },
  { label: 'Dövme Stüdyosu',  emoji: '🎨' },
  { label: 'Veteriner',       emoji: '🐾' },
  { label: 'Klinik',          emoji: '🏥' },
  { label: 'Yoga & Pilates',  emoji: '🧘' },
  { label: 'Kişisel Antrenör',emoji: '💪' },
  { label: 'Beslenme Uzmanı', emoji: '🥗' },
  { label: 'Psikolog',        emoji: '🧠' },
  { label: 'Fotoğrafçı',      emoji: '📸' },
  { label: 'Oto Servis',      emoji: '🔧' },
  { label: 'Danışmanlık',     emoji: '💼' },
  { label: 'Özel Ders',       emoji: '📚' },
]

// Duplicate for seamless loop
const DOUBLED = [...CATEGORIES, ...CATEGORIES]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-black py-24 lg:py-32">
      {/* Background blur blobs */}
      <div aria-hidden className="absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />
      <div aria-hidden className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-brand-500/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
          <span className="text-xs font-semibold text-brand-500">Türkiye&apos;nin En Hızlı Randevu Sistemi</span>
        </div>

        {/* Category marquee — appears BEFORE h1 for visual flow */}
        <div className="mb-8 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-marquee gap-3">
            {DOUBLED.map((cat, i) => (
              <span
                key={i}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-gray-300 shadow-sm"
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </span>
            ))}
          </div>
        </div>

        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-tight tracking-tight text-white lg:text-6xl">
          Her İşletmeye Uygun{' '}
          <span className="text-brand-500">
            Online Randevu
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          Kuaför, güzellik salonu, diş kliniği ve daha fazlası için tasarlanmış güçlü online randevu sistemi.
          Müşterileriniz 7/24 rezervasyon yapsın, siz işinize odaklanın.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-white shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            14 Gün Ücretsiz Dene <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/isletmeler"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-gray-300 hover:bg-white/10 transition-all"
          >
            <Play className="h-4 w-4 fill-brand-500 text-brand-500" /> İşletmeleri Keşfet
          </Link>
        </div>

        <p className="mt-5 text-xs text-gray-500">Kredi kartı gerekmez · 5 dakikada kurulum · İptal kolaylığı</p>

        {/* Mockup browser frame */}
        <div className="mt-16 mx-auto max-w-4xl rounded-2xl border border-white/10 bg-black shadow-2xl overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/5 px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <span className="ml-3 flex-1 rounded-md bg-white/10 border border-white/10 py-0.5 text-center text-xs text-gray-500">
              jetrandevu.com/booking/isletmeniz
            </span>
          </div>
          <div className="h-72 bg-white/5 flex flex-col items-center justify-center gap-4 p-6">
            <div className="flex gap-3">
              {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].map((day, i) => (
                <div
                  key={day}
                  className={`rounded-lg px-3 py-2 text-center text-xs font-medium border ${i === 2 ? 'bg-brand-500 text-white border-brand-500' : 'bg-white/10 text-gray-300 border-white/10'}`}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((t, i) => (
                <span
                  key={t}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border ${i % 3 === 0 ? 'bg-white/5 text-gray-600 border-transparent line-through' : 'bg-white/10 text-brand-500 border-white/10'}`}
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500">Gerçek zamanlı müsaitlik gösterimi</p>
          </div>
        </div>
      </div>
    </section>
  )
}
