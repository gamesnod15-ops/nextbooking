'use client'

import { useEffect, useRef, useState } from 'react'
import { Tag, X, ArrowRight } from 'lucide-react'

const SHOW_DELAY_MS = 600
const EXIT_DURATION_MS = 300
const SCROLL_DURATION_MS = 1000

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

// A slow eased scroll reads as deliberate/"soft" — the browser's native
// smooth-scroll (from `scroll-behavior: smooth` in globals.css) is too
// short and abrupt for a cross-page jump like this.
function softScrollTo(targetId: string) {
  const target = document.getElementById(targetId)
  if (!target) return
  const startY = window.scrollY
  const endY = startY + target.getBoundingClientRect().top
  const startTime = performance.now()

  const step = (now: number) => {
    const t = Math.min((now - startTime) / SCROLL_DURATION_MS, 1)
    window.scrollTo(0, startY + (endY - startY) * easeInOutCubic(t))
    if (t < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

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
    <div className="pointer-events-none fixed inset-y-0 left-0 z-40 flex items-center pl-4 sm:pl-6">
      <div
        className={`pointer-events-auto relative w-72 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-500 ease-out ${
          shown ? 'translate-x-0 opacity-100' : '-translate-x-[140%] opacity-0'
        }`}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-brand-500 to-amber-400" />

        <button
          onClick={close}
          aria-label="Kapat"
          className="absolute right-3 top-4 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30">
            <Tag className="h-6 w-6 text-white" />
          </div>

          <p className="text-lg font-extrabold leading-snug text-gray-900">Size Uygun Paketi Bulun</p>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-500">14 gün ücretsiz deneyin, kredi kartı gerekmez.</p>

          <a
            href="#pricing"
            onClick={(e) => {
              e.preventDefault()
              close()
              softScrollTo('pricing')
            }}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg"
          >
            Paketlerimize Git <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
