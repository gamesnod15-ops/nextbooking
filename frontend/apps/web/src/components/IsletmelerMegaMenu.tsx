'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, MapPin, ArrowRight, Loader2, Store as StoreIcon } from 'lucide-react'
import { categoryColor, categoryLucideIcon, initials } from '@/lib/categoryVisuals'

interface BusinessItem {
  id: string
  name: string
  categoryId: number
  categoryName: string
  city: string | null
  logoUrl: string | null
}

const CLOSE_DELAY_MS = 150

// Trendyol-style category hover menu: categories on the left, businesses of
// whichever category is hovered on the right. Data is fetched once, on
// first open, then hovering just filters what's already in memory.
export function IsletmelerMegaMenu({ linkClassName, isActive }: { linkClassName: string; isActive: boolean }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [businesses, setBusinesses] = useState<BusinessItem[] | null>(null)
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS)
  }

  function handleOpen() {
    cancelClose()
    setOpen(true)
    if (businesses !== null || loading) return
    setLoading(true)
    fetch('/api/v1/businesses?pageNumber=1&pageSize=200')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { items: BusinessItem[] } | null) => {
        const items = data?.items ?? []
        setBusinesses(items)
        if (items.length > 0) setActiveCategoryId(items[0].categoryId)
      })
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false))
  }

  const categories = useMemo(() => {
    if (!businesses) return []
    const byId = new Map<number, string>()
    for (const b of businesses) byId.set(b.categoryId, b.categoryName)
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  }, [businesses])

  const activeBusinesses = useMemo(() => {
    if (!businesses || activeCategoryId === null) return []
    return businesses.filter((b) => b.categoryId === activeCategoryId).slice(0, 6)
  }, [businesses, activeCategoryId])

  return (
    <div className="relative" onMouseEnter={handleOpen} onMouseLeave={scheduleClose}>
      <Link href="/isletmeler" className={linkClassName}>
        {isActive && <StoreIcon className="h-4 w-4" />}
        İşletmeler
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Link>

      {open && (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute left-1/2 top-full z-30 mt-3 w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-fade-in"
        >
          {loading || !businesses ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <StoreIcon className="h-6 w-6 text-gray-300" />
              <p className="text-sm text-gray-400">Henüz listelenen işletme yok.</p>
            </div>
          ) : (
            <div className="flex">
              {/* Categories */}
              <div className="max-h-96 w-48 shrink-0 overflow-y-auto border-r border-gray-100 bg-gray-50/60 py-3">
                {categories.map((c) => {
                  const Icon = categoryLucideIcon(c.name)
                  const active = activeCategoryId === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onMouseEnter={() => setActiveCategoryId(c.id)}
                      className={`flex w-full items-center gap-3 border-l-2 px-4 py-2.5 text-left text-sm transition-all ${
                        active
                          ? 'border-brand-500 bg-brand-50 font-semibold text-brand-600'
                          : 'border-transparent text-gray-600 hover:border-brand-100 hover:bg-white hover:text-gray-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-brand-500' : 'text-gray-400'}`} />
                      <span className="truncate">{c.name}</span>
                    </button>
                  )
                })}
              </div>

              {/* Businesses in the hovered category */}
              <div className="flex flex-1 flex-col p-3">
                <div className="max-h-80 flex-1 space-y-0.5 overflow-y-auto">
                  {activeBusinesses.length === 0 ? (
                    <div className="flex h-full items-center justify-center py-12 text-sm text-gray-400">
                      Bu kategoride işletme yok.
                    </div>
                  ) : (
                    activeBusinesses.map((b) => (
                      <Link
                        key={b.id}
                        href={`/isletmeler/${b.id}`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                      >
                        {b.logoUrl ? (
                          <img src={b.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
                        ) : (
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${categoryColor(b.categoryName)}`}>
                            {initials(b.name)}
                          </span>
                        )}
                        <span className="flex-1 truncate font-medium text-gray-800">{b.name}</span>
                        {b.city && (
                          <span className="flex shrink-0 items-center gap-1 text-xs text-gray-400">
                            <MapPin className="h-3 w-3" /> {b.city}
                          </span>
                        )}
                      </Link>
                    ))
                  )}
                </div>

                <Link
                  href={activeCategoryId !== null ? `/isletmeler?categoryId=${activeCategoryId}` : '/isletmeler'}
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border-t border-gray-100 pt-3 text-xs font-semibold text-brand-600 transition-colors hover:text-brand-700"
                >
                  Tümünü Gör <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
