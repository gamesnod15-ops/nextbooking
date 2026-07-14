import { Reveal, StaggerGroup, StaggerItem } from './motion/Reveal'
import { TestimonialSpotlight } from './TestimonialSpotlight'

const stats = [
  { value: '10.000+', label: 'Aktif İşletme' },
  { value: '2M+',     label: 'Aylık Randevu' },
  { value: '%98',     label: 'Müşteri Memnuniyeti' },
  { value: '₺500M+',  label: 'İşlem Hacmi' },
]

export function SocialProofSection() {
  return (
    <section className="relative bg-white py-24 overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full border-[40px] border-brand-500/5" />
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full border-[40px] border-brand-500/5" />
        <svg className="absolute top-20 left-1/4 h-48 w-48 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
          <rect x="10" y="10" width="180" height="180" rx="30" className="stroke-gray-900 stroke-[1.5]" fill="none" />
          <circle cx="100" cy="100" r="70" className="stroke-gray-900 stroke-[1.5]" fill="none" />
        </svg>
        <svg className="absolute bottom-20 right-1/4 h-36 w-36 opacity-[0.025]" viewBox="0 0 200 200" fill="none">
          <polygon points="100,0 200,200 0,200" className="fill-gray-900" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 lg:px-10">
        <Reveal className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-brand-500" />
            <span className="text-xs font-semibold text-gray-900">Müşteri Yorumları</span>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900">
            İşletme Sahipleri{' '}
            <span className="text-brand-500">Ne Diyor?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Türkiye&apos;nin dört bir yanından binlerce işletme randevu yönetimini NextBooking ile dönüştürüyor
          </p>
        </Reveal>

        <StaggerGroup className="mx-auto mb-14 grid max-w-3xl grid-cols-2 divide-x divide-y divide-gray-200/80 rounded-2xl border border-gray-200 bg-gray-50/60 sm:grid-cols-4 sm:divide-y-0">
          {stats.map((stat) => (
            <StaggerItem key={stat.label} className="px-5 py-5 text-center">
              <p className="text-xl font-extrabold text-gray-900 sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
            </StaggerItem>
          ))}
        </StaggerGroup>

        <Reveal delay={0.1}>
          <TestimonialSpotlight />
        </Reveal>
      </div>
    </section>
  )
}
