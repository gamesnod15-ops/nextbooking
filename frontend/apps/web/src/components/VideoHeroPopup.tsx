'use client'

import { useEffect, useRef, useState } from 'react'
import { Tag, X, ArrowRight } from 'lucide-react'

const SHOW_DELAY_MS = 3000
const EXIT_DURATION_MS = 300

// Shows a "go to packages" nudge, but only while the video hero section is
// on screen — scrolling past it (or dismissing) hides it for good.
export function VideoHeroPopup({ targetId }: { targetId: string }) {
  const [mounted, setMounted] = useState(false)
  const [shown, setShown] = useState(false)
  const dismissedRef = useRef(false)
  const visibleRef = useRef(false)

  useEffect(() => {
    const target = document.getElementById(targetId)
    if (!target) return

    let showTimer: ReturnType<typeof setTimeout> | null = null

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (dismissedRef.current || visibleRef.current || showTimer) return
          showTimer = setTimeout(() => {
            showTimer = null
            visibleRef.current = true
            setMounted(true)
            requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)))
          }, SHOW_DELAY_MS)
        } else {
          if (showTimer) {
            clearTimeout(showTimer)
            showTimer = null
          }
          if (visibleRef.current) {
            visibleRef.current = false
            setShown(false)
            setTimeout(() => setMounted(false), EXIT_DURATION_MS)
          }
        }
      },
      { threshold: 0.6 }
    )
    observer.observe(target)

    return () => {
      observer.disconnect()
      if (showTimer) clearTimeout(showTimer)
    }
  }, [targetId])

  function close() {
    dismissedRef.current = true
    visibleRef.current = false
    setShown(false)
    setTimeout(() => setMounted(false), EXIT_DURATION_MS)
  }

  if (!mounted) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center px-4">
      <div
        className={`pointer-events-auto relative flex max-w-sm flex-col items-center gap-3 rounded-3xl bg-white/95 px-8 py-7 text-center shadow-2xl ring-1 ring-black/5 backdrop-blur-md transition-all duration-300 ease-out ${
          shown ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-90 opacity-0'
        }`}
      >
        <button
          onClick={close}
          aria-label="Kapat"
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
          <Tag className="h-6 w-6 text-brand-500" />
        </div>

        <p className="text-base font-bold text-gray-900">Size Uygun Paketi Bulun</p>
        <p className="text-sm text-gray-500">14 gün ücretsiz deneyin, kredi kartı gerekmez.</p>

        <a
          href="#pricing"
          onClick={close}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          Paketlerimize Git <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}
