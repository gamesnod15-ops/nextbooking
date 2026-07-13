import { Navbar } from '@/components/Navbar'
import { FeaturesSection } from '@/components/FeaturesSection'
import { CtaSection } from '@/components/CtaSection'
import { Footer } from '@/components/Footer'
import { Zap, Sparkles, Shield } from 'lucide-react'

export const metadata = { title: 'Özellikler — NextBooking', description: 'NextBooking\'ın tüm özelliklerini keşfedin.' }

export default function FeaturesPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-28 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-blue-500/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-brand-500 mb-6">
              <Sparkles className="h-3 w-3" /> Güçlü Özellikler, Basit Kullanım
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              İşletmenizi büyütmek için<br />
              <span className="bg-gradient-to-r from-brand-500 to-yellow-400 bg-clip-text text-transparent">ihtiyacınız olan her şey</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Randevu yönetiminden ödeme altyapısına, müşteri iletişiminden gelir analitiğine kadar 
              tek bir platformda birleşmiş 20+ güçlü özellik.
            </p>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-brand-500" /> 5 dk kurulum</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-brand-500" /> PCI DSS uyumlu</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-brand-500" /> 14 gün ücretsiz</span>
            </div>
          </div>
        </section>
        <FeaturesSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
