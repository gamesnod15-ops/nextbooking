const testimonials = [
  { name: 'Ahmet Yılmaz', role: 'Berber Salonu Sahibi, İstanbul', text: 'NextBooking ile müşterilerimiz artık telefon yerine online rezervasyon yapıyor. Hayır-deme oranım %60 düştü!' },
  { name: 'Selin Kaya',   role: 'Güzellik Uzmanı, Ankara',        text: 'Çok kullanışlı ve hızlı. 5 dakikada kurdum, aynı gün ilk rezervasyonum geldi. Kesinlikle tavsiye ederim.' },
  { name: 'Dr. Mehmet Er', role: 'Diş Hekimi, İzmir',             text: 'Hasta kayıt sistemimizi sıfırdan kurmamıza gerek kalmadı. Entegre randevu sistemi mükemmel çalışıyor.' },
]

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-brand-500 to-emerald-500',
  'from-amber-500 to-orange-500',
]

const stats = [
  { value: '10.000+', label: 'Aktif İşletme' },
  { value: '2M+',     label: 'Aylık Randevu' },
  { value: '%98',     label: 'Müşteri Memnuniyeti' },
  { value: '₺500M+',  label: 'İşlem Hacmi' },
]

function Stars() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

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

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="mb-16 text-center">
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
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="group relative rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:border-brand-300 hover:shadow-xl"
            >
              <div className="absolute -top-8 -right-8 h-16 w-16 rounded-full bg-brand-500/5 transition-colors group-hover:bg-brand-500/10" />

              <div className="relative">
                <Stars />
                <p className="mt-4 text-sm leading-relaxed text-gray-600">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3.5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColors[i]} text-sm font-bold text-white shadow-sm`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
