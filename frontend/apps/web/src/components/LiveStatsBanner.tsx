'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, CalendarCheck, TrendingUp, Zap } from 'lucide-react'

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(value)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const start = display
    const diff = value - start
    const duration = 800
    const startTime = performance.now()

    function animate(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [value])

  return <span>{display.toLocaleString('tr-TR')}{suffix}</span>
}

export function LiveStatsBanner() {
  const [activeUsers, setActiveUsers] = useState(28)
  const [todayBookings, setTodayBookings] = useState(247)
  const [weeklyGrowth, setWeeklyGrowth] = useState(12)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 4) - 1
        return Math.max(15, Math.min(80, prev + change))
      })
      setTodayBookings(prev => {
        const change = Math.floor(Math.random() * 8) + 2
        return prev + change
      })
      setWeeklyGrowth(prev => {
        const change = Math.floor(Math.random() * 3) - 1
        return Math.max(5, Math.min(30, prev + change))
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mt-8 flex flex-wrap items-center gap-5 sm:gap-8">
      <div className="flex items-center gap-2.5">
        <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
          <div className="absolute h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-40" />
          <Users className="h-4 w-4 text-emerald-400 relative" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            <AnimatedCounter value={activeUsers} />
          </p>
          <p className="text-[10px] text-gray-500 leading-tight">Anlık Kullanıcı</p>
        </div>
      </div>

      <div className="hidden sm:block h-8 w-px bg-white/10" />

      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/15">
          <CalendarCheck className="h-4 w-4 text-brand-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            <AnimatedCounter value={todayBookings} />
          </p>
          <p className="text-[10px] text-gray-500 leading-tight">Bugünkü Randevu</p>
        </div>
      </div>

      <div className="hidden sm:block h-8 w-px bg-white/10" />

      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500/15">
          <TrendingUp className="h-4 w-4 text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">
            <AnimatedCounter value={weeklyGrowth} suffix="%" />
          </p>
          <p className="text-[10px] text-gray-500 leading-tight">Haftalık Artış</p>
        </div>
      </div>
    </div>
  )
}
