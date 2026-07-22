'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setVisible(y > 400)
      setProgress(docHeight > 0 ? y / docHeight : 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const smoothScrollUp = useCallback(() => {
    const duration = 1200
    const startY = window.scrollY
    const startTime = performance.now()

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

    const step = (now: number) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1)
      const eased = easeInOutCubic(t)
      window.scrollTo(0, startY * (1 - eased))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [])

  return (
    <button
      onClick={smoothScrollUp}
      aria-label="Yukarı çık"
      className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-500 hover:shadow-xl hover:-translate-y-1 ${
        visible
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-75 pointer-events-none'
      }`}
      style={{
        background: `conic-gradient(rgb(1, 84, 240) ${progress * 360}deg, #f3f4f6 ${progress * 360}deg)`,
      }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
        <ChevronUp className="h-5 w-5 text-brand-500" />
      </span>
    </button>
  )
}
