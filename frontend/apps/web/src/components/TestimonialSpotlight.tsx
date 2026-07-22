'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const testimonials = [
  { name: 'Ahmet Yılmaz', role: 'Berber Salonu Sahibi, İstanbul', text: 'JetRandevu ile müşterilerimiz artık telefon yerine online rezervasyon yapıyor. Hayır-deme oranım %60 düştü!' },
  { name: 'Selin Kaya',   role: 'Güzellik Uzmanı, Ankara',        text: 'Çok kullanışlı ve hızlı. 5 dakikada kurdum, aynı gün ilk rezervasyonum geldi. Kesinlikle tavsiye ederim.' },
  { name: 'Dr. Mehmet Er', role: 'Diş Hekimi, İzmir',             text: 'Hasta kayıt sistemimizi sıfırdan kurmamıza gerek kalmadı. Entegre randevu sistemi mükemmel çalışıyor.' },
]

const avatarColors = [
  'from-violet-500 to-purple-600',
  'from-brand-500 to-emerald-500',
  'from-amber-500 to-orange-500',
]

function Stars() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg key={i} className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function TestimonialSpotlight() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    if (paused || shouldReduceMotion) return
    const id = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 6000)
    return () => clearInterval(id)
  }, [paused, shouldReduceMotion])

  const t = testimonials[index]

  return (
    <div
      className="relative mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-gray-200 bg-white p-8 shadow-xl sm:p-12">
        <span aria-hidden className="pointer-events-none absolute -top-6 left-6 select-none font-serif text-[9rem] leading-none text-brand-500/10">
          &ldquo;
        </span>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative"
          >
            <Stars />
            <p className="mt-6 text-lg font-medium leading-relaxed text-gray-800 sm:text-xl">
              &ldquo;{t.text}&rdquo;
            </p>
            <div className="mt-8 flex items-center gap-3.5">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${avatarColors[index]} text-sm font-bold text-white shadow-sm`}>
                {t.name[0]}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2">
        {testimonials.map((item, i) => (
          <button
            key={item.name}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`${item.name} yorumunu göster`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? 'w-8 bg-brand-500' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
