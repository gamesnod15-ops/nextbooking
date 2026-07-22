'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { useSearchParams } from 'next/navigation'
import {
  Search, MapPin, ChevronLeft, ChevronRight,
  CalendarCheck, Phone, Building2, Loader2, ChevronDown, X,
} from 'lucide-react'
import { categoryIcons, categoryColor, initials } from '@/lib/categoryVisuals'

interface BusinessItem {
  id: string
  name: string
  categoryId: number
  categoryName: string
  city: string | null
  phone: string | null
  logoUrl: string | null
  website: string | null
  description: string | null
  isActive: boolean
  coverImageUrl: string | null
}

interface PaginatedResult<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

const PAGE_SIZE = 24

const ALL_CITIES = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin', 'Aydın',
  'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum',
  'Denizli', 'Diyarbakır', 'Düzce',
  'Edirne', 'Elazığ', 'Erzincan', 'Erzurum', 'Eskişehir',
  'Gaziantep', 'Giresun', 'Gümüşhane',
  'Hakkâri', 'Hatay',
  'Iğdır', 'Isparta', 'İstanbul', 'İzmir',
  'Kahramanmaraş', 'Karabük', 'Karaman', 'Kars', 'Kastamonu', 'Kayseri', 'Kilis',
  'Kırıkkale', 'Kırklareli', 'Kırşehir', 'Kocaeli', 'Konya', 'Kütahya',
  'Malatya', 'Manisa', 'Mardin', 'Mersin', 'Muğla', 'Muş',
  'Nevşehir', 'Niğde',
  'Ordu', 'Osmaniye',
  'Rize',
  'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas', 'Şanlıurfa', 'Şırnak',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli',
  'Uşak',
  'Van', 'Yalova', 'Yozgat',
  'Zonguldak'
]

export default function BusinessListPage() {
  const searchParams = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<number[]>(() => {
    const fromUrl = searchParams.get('categoryId')
    return fromUrl ? [Number(fromUrl)] : []
  })
  const [selectedCities, setSelectedCities] = useState<string[]>(() => {
    const fromUrl = searchParams.get('city')
    return fromUrl ? [fromUrl] : []
  })
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedResult<BusinessItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterSource, setFilterSource] = useState<BusinessItem[]>([])
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState(true)
  const [expandedCities, setExpandedCities] = useState(true)
  const [citySearch, setCitySearch] = useState('')

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (selectedCategories.length > 0) params.set('categoryIds', selectedCategories.join(','))
  if (selectedCities.length > 0) params.set('cities', selectedCities.join(','))
  params.set('pageNumber', String(page))
  params.set('pageSize', String(PAGE_SIZE))

  useEffect(() => {
    setLoading(true)
    setError('')
    fetch(`/api/v1/businesses?${params.toString()}`)
      .then((r) => { if (!r.ok) throw new Error('Veri alınamadı'); return r.json() })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [search, selectedCategories, selectedCities, page])

  useEffect(() => {
    fetch('/api/v1/businesses?pageNumber=1&pageSize=200')
      .then((r) => (r.ok ? r.json() : null))
      .then((r: PaginatedResult<BusinessItem> | null) => { if (r) setFilterSource(r.items) })
      .catch(() => {})
  }, [])

  const allCategories = useMemo(() => {
    const byId = new Map<number, { name: string; count: number }>()
    for (const b of filterSource) {
      const existing = byId.get(b.categoryId)
      if (existing) {
        existing.count++
      } else {
        byId.set(b.categoryId, { name: b.categoryName, count: 1 })
      }
    }
    return [...byId.entries()]
      .map(([id, { name, count }]) => ({ id, name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  }, [filterSource])

  const allCities = useMemo(() => {
    const cityMap = new Map<string, number>()
    for (const b of filterSource) {
      if (b.city) {
        cityMap.set(b.city, (cityMap.get(b.city) || 0) + 1)
      }
    }
    return [...cityMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  }, [filterSource])

  const filteredCities = useMemo(() => {
    if (!citySearch) return allCities
    return allCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
  }, [allCities, citySearch])

  const activeFilterCount = selectedCategories.length + selectedCities.length

  function toggleCategory(id: number) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
    setPage(1)
  }

  function toggleCity(cityName: string) {
    setSelectedCities(prev =>
      prev.includes(cityName) ? prev.filter(c => c !== cityName) : [...prev, cityName]
    )
    setPage(1)
  }

  function clearAllFilters() {
    setSelectedCategories([])
    setSelectedCities([])
    setSearch('')
    setPage(1)
  }

  function removeFilter(type: 'category' | 'city', value: number | string) {
    if (type === 'category') {
      setSelectedCategories(prev => prev.filter(c => c !== value))
    } else {
      setSelectedCities(prev => prev.filter(c => c !== value))
    }
    setPage(1)
  }

  const FilterPanel = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? '' : 'w-[280px] shrink-0'}`}>
      <div className={`${mobile ? '' : 'sticky top-24'} space-y-1 pointer-events-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-900">Filtreler</h3>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-brand-600 hover:text-brand-700 font-medium"
            >
              Temizle ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <button
            onClick={() => setExpandedCategories(!expandedCategories)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-semibold text-gray-800">Kategoriler</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expandedCategories ? 'rotate-180' : ''}`} />
          </button>
          {expandedCategories && (
            <div className="border-t border-gray-100 px-4 pb-4 max-h-[280px] overflow-y-auto">
              {allCategories.map((cat) => (
                <div
                  key={cat.id}
                  role="checkbox"
                  aria-checked={selectedCategories.includes(cat.id)}
                  tabIndex={0}
                  onClick={() => toggleCategory(cat.id)}
                  onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleCategory(cat.id) } }}
                  className="flex cursor-pointer items-center gap-3 py-2 group select-none"
                >
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                    selectedCategories.includes(cat.id)
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-gray-300 group-hover:border-brand-400'
                  }`}>
                    {selectedCategories.includes(cat.id) && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">
                    {categoryIcons[cat.name] && <span className="mr-1">{categoryIcons[cat.name]}</span>}
                    {cat.name}
                  </span>
                  <span className="text-xs text-gray-400">{cat.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cities */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <button
            onClick={() => setExpandedCities(!expandedCities)}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <span className="text-sm font-semibold text-gray-800">Şehirler</span>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expandedCities ? 'rotate-180' : ''}`} />
          </button>
          {expandedCities && (
            <div className="border-t border-gray-100 px-4 pb-4">
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  placeholder="Şehir ara..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-xs text-gray-700 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-400"
                />
              </div>
              <div className="max-h-[280px] overflow-y-auto">
                {filteredCities.map((cityItem) => (
                  <div
                    key={cityItem.name}
                    role="checkbox"
                    aria-checked={selectedCities.includes(cityItem.name)}
                    tabIndex={0}
                    onClick={() => toggleCity(cityItem.name)}
                    onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggleCity(cityItem.name) } }}
                    className="flex cursor-pointer items-center gap-3 py-2 group select-none"
                  >
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                      selectedCities.includes(cityItem.name)
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-gray-300 group-hover:border-brand-400'
                    }`}>
                      {selectedCities.includes(cityItem.name) && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className="flex-1 text-sm text-gray-700 group-hover:text-gray-900">{cityItem.name}</span>
                    <span className="text-xs text-gray-400">{cityItem.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">
        {/* Top search bar */}
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-5">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="İşletme adı, kategori veya şehir ara..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
                />
              </div>
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-brand-300 transition-all"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="8" y2="18" />
                </svg>
                Filtrele
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Active filters chips */}
        {activeFilterCount > 0 && (
          <div className="border-b border-gray-100 bg-white">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 mr-1">Aktif filtreler:</span>
              {selectedCategories.map(catId => {
                const cat = allCategories.find(c => c.id === catId)
                return cat ? (
                  <button
                    key={`cat-${catId}`}
                    onClick={() => removeFilter('category', catId)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 border border-brand-200 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100 transition-colors"
                  >
                    {categoryIcons[cat.name] && <span>{categoryIcons[cat.name]}</span>}
                    {cat.name}
                    <X className="h-3 w-3" />
                  </button>
                ) : null
              })}
              {selectedCities.map(cityName => (
                <button
                  key={`city-${cityName}`}
                  onClick={() => removeFilter('city', cityName)}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <MapPin className="h-3 w-3" />
                  {cityName}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-8">
          <div className="flex gap-8">
            {/* Desktop sidebar */}
            <div className="hidden lg:block">
              <FilterPanel />
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {loading ? 'Yükleniyor...' : `${data?.totalCount ?? 0} işletme bulundu`}
                </p>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : error ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-16 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              ) : !data || data.items.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center">
                  <Building2 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">Aramanızla eşleşen işletme bulunamadı.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                  {data.items.map((biz) => (
                    <div
                      key={biz.id}
                      className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-brand-200 flex flex-col"
                    >
                      {/* Large photo */}
                      {biz.coverImageUrl ? (
                        <div className="relative h-44 overflow-hidden">
                          <img src={biz.coverImageUrl} alt={biz.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        </div>
                      ) : (
                        <div className={`relative h-44 flex items-center justify-center ${categoryColor(biz.categoryName)}`}>
                          {biz.logoUrl ? (
                            <img src={biz.logoUrl} alt={biz.name} className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/30" />
                          ) : (
                            <span className="text-4xl font-extrabold text-white/80">{initials(biz.name)}</span>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        </div>
                      )}

                      <div className="p-5 flex flex-col flex-1">
                        {/* İşletme adı */}
                        <Link href={`/isletmeler/${biz.id}`} className="text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                          {biz.name}
                        </Link>

                        {/* Kategori */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${categoryColor(biz.categoryName)}`}>
                            {categoryIcons[biz.categoryName] && <span className="text-[10px]">{categoryIcons[biz.categoryName]}</span>}
                            {biz.categoryName}
                          </span>
                        </div>

                        {/* Açıklama */}
                        {biz.description && (
                          <p className="mt-3 text-xs text-gray-500 leading-relaxed line-clamp-2">{biz.description}</p>
                        )}

                        {/* Diğer bilgiler */}
                        <div className="mt-auto pt-3 border-t border-gray-100 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {biz.city && (
                              <span className="flex items-center gap-0.5">
                                <MapPin className="h-3 w-3" /> {biz.city}
                              </span>
                            )}
                            {biz.phone && (
                              <span className="flex items-center gap-0.5">
                                <Phone className="h-3 w-3" /> {biz.phone}
                              </span>
                            )}
                          </div>

                          {/* Randevu Al butonu */}
                          <Link
                            href={`/isletmeler/${biz.id}`}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-all hover:-translate-y-0.5 shadow-sm"
                          >
                            <CalendarCheck className="h-3.5 w-3.5" /> Randevu Al
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-9 w-9 rounded-xl text-sm font-medium transition-all ${
                        n === page
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'border border-gray-200 bg-white text-gray-700 hover:border-brand-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filter drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute inset-y-0 left-0 w-[320px] max-w-[85vw] bg-gray-50 shadow-2xl overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900">Filtreler</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel mobile />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-3">
              <button
                onClick={clearAllFilters}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Temizle
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-white hover:bg-brand-600 transition-all"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
