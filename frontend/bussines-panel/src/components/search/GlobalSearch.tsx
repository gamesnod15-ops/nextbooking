import { useEffect, useRef, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState, useAppDispatch } from '@/store'
import {
  openSearch,
  closeSearch,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '@/store/slices/searchSlice'
import { useGlobalSearch, type SearchResult } from '@/hooks/useGlobalSearch'
import { cn } from '@/lib/utils'
import {
  Search,
  X,
  Clock,
  ArrowRight,
  Loader2,
  Trash2,
  Keyboard,
  Command,
  CornerDownLeft,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

// ─── Search Trigger Button ───────────────────────────────────────────────────

export function SearchTrigger() {
  const dispatch = useAppDispatch()

  return (
    <button
      onClick={() => dispatch(openSearch())}
      className="group flex w-full max-w-xl items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-400 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm focus:outline-none"
    >
      <Search className="h-3.5 w-3.5 shrink-0 group-hover:text-primary transition-colors" />
      <span className="flex-1 text-left text-sm">Panel'de ara: randevu, müşteri, hizmet...</span>
      <kbd className="hidden items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] font-mono text-gray-400 sm:inline-flex">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </button>
  )
}

// ─── Main Search Modal ────────────────────────────────────────────────────────

export function GlobalSearch() {
  const dispatch = useAppDispatch()
  const { isOpen, recentSearches } = useSelector((s: RootState) => s.search)
  const { query, setQuery, groups, isLoading, totalCount, navigateTo } = useGlobalSearch()

  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Flatten all results for keyboard nav
  const allResults: SearchResult[] = groups.flatMap((g) => g.results)

  // Ctrl/Cmd + K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        dispatch(isOpen ? closeSearch() : openSearch())
      }
      if (e.key === 'Escape' && isOpen) {
        dispatch(closeSearch())
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [dispatch, isOpen])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setActiveIndex(-1)
    } else {
      setQuery('')
    }
  }, [isOpen, setQuery])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, allResults.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIndex >= 0 && allResults[activeIndex]) {
          handleSelect(allResults[activeIndex])
        }
      }
    },
    [allResults, activeIndex]
  )

  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (query.trim()) {
        dispatch(addRecentSearch({ query, resultCount: totalCount }))
      }
      navigateTo(result)
      dispatch(closeSearch())
    },
    [dispatch, navigateTo, query, totalCount]
  )

  const handleRecentClick = (q: string) => {
    setQuery(q)
    inputRef.current?.focus()
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const active = listRef.current.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      active?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeIndex])

  if (!isOpen) return null

  let flatIndex = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => dispatch(closeSearch())}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border bg-white shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          {isLoading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Panel içinde ara: randevu, müşteri, hizmet, ayar..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIndex(-1) }}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); inputRef.current?.focus() }}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={() => dispatch(closeSearch())}
            className="rounded-lg border px-2 py-1 text-[10px] font-mono text-gray-400 hover:bg-gray-50 transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
          {/* No query — show recent searches */}
          {!query && (
            <div className="p-4">
              {recentSearches.length > 0 ? (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      Son Aramalar
                    </p>
                    <button
                      onClick={() => dispatch(clearRecentSearches())}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Temizle
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((recent) => (
                      <div key={recent.id} className="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-gray-50">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-gray-400" />
                        <button
                          onClick={() => handleRecentClick(recent.query)}
                          className="flex-1 text-left text-sm text-gray-700"
                        >
                          {recent.query}
                        </button>
                        <div className="flex items-center gap-2">
                          {recent.resultCount !== undefined && (
                            <span className="text-[10px] text-gray-400">{recent.resultCount} sonuç</span>
                          )}
                          <span className="text-[10px] text-gray-300">
                            {formatDistanceToNow(new Date(recent.timestamp), { addSuffix: true, locale: tr })}
                          </span>
                          <button
                            onClick={() => dispatch(removeRecentSearch(recent.id))}
                            className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-gray-300 hover:text-red-500 transition-all"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Search className="mx-auto mb-3 h-8 w-8 text-gray-200" />
                  <p className="text-sm font-medium text-gray-500">Panel genelinde arama yapın</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Randevu, müşteri, hizmet, personel ve daha fazlasını arayın
                  </p>
                </div>
              )}

              {/* Quick links */}
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Hızlı Erişim
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: 'Randevular', to: '/appointments', icon: '📅' },
                    { label: 'Müşteriler', to: '/customers', icon: '👤' },
                    { label: 'Hizmetler', to: '/services', icon: '✂️' },
                    { label: 'Raporlar', to: '/reports', icon: '📊' },
                  ].map((item) => (
                    <button
                      key={item.to}
                      onClick={() => { navigateTo({ id: item.to, title: item.label, category: 'pages', icon: item.icon, to: item.to }); dispatch(closeSearch()) }}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors text-left"
                    >
                      <span>{item.icon}</span>
                      {item.label}
                      <ArrowRight className="ml-auto h-3 w-3 text-gray-300" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search results */}
          {query && !isLoading && groups.length === 0 && (
            <div className="py-12 text-center">
              <Search className="mx-auto mb-3 h-8 w-8 text-gray-200" />
              <p className="text-sm font-medium text-gray-500">"{query}" için sonuç bulunamadı</p>
              <p className="mt-1 text-xs text-gray-400">Farklı bir arama terimi deneyin</p>
            </div>
          )}

          {query && groups.length > 0 && (
            <div className="divide-y">
              {groups.map((group) => (
                <div key={group.category} className="py-2">
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <span className="text-sm">{group.icon}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                      {group.label}
                    </span>
                    <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {group.results.length}
                    </span>
                  </div>

                  {group.results.map((result) => {
                    flatIndex++
                    const idx = flatIndex
                    const isActive = activeIndex === idx

                    return (
                      <button
                        key={result.id}
                        data-index={idx}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isActive ? 'bg-primary/5' : 'hover:bg-gray-50'
                        )}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm">
                          {result.icon}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{result.title}</p>
                          {result.subtitle && (
                            <p className="text-xs text-gray-400 truncate">{result.subtitle}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {result.meta && (
                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                              {result.meta}
                            </span>
                          )}
                          {isActive && <CornerDownLeft className="h-3 w-3 text-gray-400" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-2">
          <div className="flex items-center gap-3 text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono shadow-sm">↑</kbd>
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono shadow-sm">↓</kbd>
              Seç
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono shadow-sm">↵</kbd>
              Git
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono shadow-sm">Esc</kbd>
              Kapat
            </span>
          </div>
          {query && totalCount > 0 && (
            <p className="text-[10px] text-gray-400">
              {totalCount} sonuç bulundu
            </p>
          )}
          {!query && (
            <p className="flex items-center gap-1 text-[10px] text-gray-400">
              <Keyboard className="h-3 w-3" />
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono shadow-sm">Ctrl</kbd>+
              <kbd className="rounded border bg-white px-1 py-0.5 font-mono shadow-sm">K</kbd>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
