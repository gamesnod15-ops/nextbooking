import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { SlideIn } from './motion/Reveal'

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-black py-24">
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(206,13,30,0.06),transparent_60%)]" />
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute -top-16 right-1/4 h-72 w-72 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
          <polygon points="100,0 200,200 0,200" className="fill-white" />
        </svg>
        <svg className="absolute bottom-10 left-10 h-52 w-52 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
          <rect x="15" y="15" width="170" height="170" rx="30" className="stroke-white stroke-[1.5]" fill="none" />
        </svg>
        <svg className="absolute top-1/2 left-1/3 h-36 w-36 opacity-[0.025]" viewBox="0 0 200 200" fill="none">
          <polygon points="100,10 190,190 10,190" className="stroke-white stroke-[1]" fill="none" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-screen-2xl px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <SlideIn direction="right">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-brand-500">Hemen Başlayın</span>
            </div>
            <h2 className="text-4xl font-extrabold text-white lg:text-5xl leading-tight">
              İşletmenizi<br />
              <span className="text-brand-500">Dijitalleştirin</span>
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-md">
              14 gün ücretsiz deneyin. Kurulum ücreti yok, sözleşme yok. İstediğiniz zaman iptal edin.
            </p>
            <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white hover:bg-brand-600 transition-all shadow-lg hover:-translate-y-0.5"
              >
                Hemen Başla <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-all"
              >
                <Sparkles className="h-4 w-4" /> Demo İste
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Aktif kullanıcı
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> 7/24 destek
              </span>
            </div>
          </SlideIn>

          <div className="hidden lg:block">
            <div className="relative">
              <div className="relative h-[400px] w-full overflow-hidden rounded-3xl shadow-2xl -rotate-2 transition-transform duration-500 hover:rotate-0">
                <img
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&q=80"
                  alt="Dijital işletme"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-2xl bg-brand-500 px-4 py-3 shadow-xl">
                <p className="text-sm font-bold text-white">14 Gün Ücretsiz</p>
                <p className="text-xs text-white/70">Kredi kartı gerekmez</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
