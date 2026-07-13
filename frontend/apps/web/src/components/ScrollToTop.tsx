'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      onClick={() => {
        document.documentElement.style.scrollBehavior = 'smooth'
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => { document.documentElement.style.scrollBehavior = '' }, 100)
      }}
      className={`fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-black shadow-lg transition-all duration-300 hover:bg-brand-600 hover:-translate-y-1 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
      }`}
      aria-label="Yukarı çık"
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  )
}
