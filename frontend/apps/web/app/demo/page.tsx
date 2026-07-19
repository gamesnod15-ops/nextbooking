import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight, Play, CalendarCheck, Users, BarChart3 } from 'lucide-react'

export const metadata = { title: 'Demo — BookingAi', description: 'BookingAi demosunu deneyin.' }

export default function DemoPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-28 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Demo</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">BookingAi&apos;i Keşfedin</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300 mb-8">Canlı bir demo talep edin, ekibimiz size özel bir tur düzenlesin.</p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register" className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/25">
                <Play className="h-4 w-4" /> Hemen Başla
              </Link>
              <Link href="/iletisim" className="flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-base font-semibold text-gray-300 hover:bg-white/5 transition-all">
                Demo Talep Et <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8 sm:grid-cols-3">
              {[
                { icon: CalendarCheck, title: 'Online Randevu', desc: 'Müşterileriniz 7/24 rezervasyon yapabilir.' },
                { icon: Users, title: 'Müşteri Yönetimi', desc: 'Tüm müşteri verileriniz tek panelde.' },
                { icon: BarChart3, title: 'Raporlama', desc: 'Gerçek zamanlı gelir ve performans analitiği.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-gray-200 p-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
                    <item.icon className="h-6 w-6 text-brand-500" />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
