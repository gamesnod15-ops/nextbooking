import { useEffect, useRef, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MobileHeaderAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
}

/**
 * Right-aligned "..." button that reveals a dropdown of header actions.
 * Mobile-only (hidden at lg+) — pair with the page's existing desktop
 * buttons wrapped in a `hidden lg:flex` sibling.
 */
export function MobileHeaderActions({ actions, className }: { actions: MobileHeaderAction[]; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  return (
    <div ref={ref} className={cn('relative shrink-0 lg:hidden', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => { a.onClick(); setOpen(false) }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
