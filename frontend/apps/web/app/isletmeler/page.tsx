'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { useSearchParams } from 'next/navigation'
import {
  Search, MapPin, ChevronLeft, ChevronRight,
  CalendarCheck, Phone, Megaphone, Building2, Loader2, Star, ChevronDown, ArrowRight,
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

const PAGE_SIZE = 10

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
  const [categoryId, setCategoryId] = useState<number | null>(() => {
    const fromUrl = searchParams.get('categoryId')
    return fromUrl ? Number(fromUrl) : null
  })
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedResult<BusinessItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filterSource, setFilterSource] = useState<BusinessItem[]>([])

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (categoryId !== null) params.set('categoryId', String(categoryId))
  if (city) params.set('city', city)
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
  }, [search, categoryId, city, page])

  useEffect(() => {
    fetch('/api/v1/businesses?pageNumber=1&pageSize=200')
      .then((r) => (r.ok ? r.json() : null))
      .then((r: PaginatedResult<BusinessItem> | null) => { if (r) setFilterSource(r.items) })
      .catch(() => {})
  }, [])

  const allCategories = useMemo(() => {
    const byId = new Map<number, string>()
    for (const b of filterSource) byId.set(b.categoryId, b.categoryName)
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
  }, [filterSource])

  const allCities = useMemo(() => {
    return Array.from(new Set(filterSource.map((b) => b.city).filter(Boolean)))
      .sort((a, b) => (a as string).localeCompare(b as string, 'tr')) as string[]
  }, [filterSource])

  function onFilter() { setPage(1) }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero - Modern */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-3xl" />
            <svg className="absolute top-10 right-1/3 h-48 w-48 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
              <rect x="10" y="10" width="180" height="180" rx="30" className="stroke-white stroke-[1.5]" fill="none" />
              <circle cx="100" cy="100" r="70" className="stroke-white stroke-[1.5]" fill="none" />
            </svg>
            <svg className="absolute bottom-10 left-1/4 h-36 w-36 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
              <polygon points="100,0 200,200 0,200" className="fill-white" />
            </svg>
          </div>

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-white">İşletmeler</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl mb-4">
              İşletmeleri{' '}
              <span className="text-brand-500">Keşfedin</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
              Size en yakın, en iyi işletmeleri bulun ve hemen randevu alın
            </p>

            <div className="mx-auto mt-10 max-w-3xl">
              <div className="rounded-2xl bg-black/70 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-white/10">
                <div className="flex flex-col gap-1 rounded-xl bg-white/5 px-4 sm:flex-row sm:items-center sm:gap-2 sm:pr-2">
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <Search className="h-5 w-5 shrink-0 text-gray-500" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); onFilter() }}
                      placeholder="İşletme adı, kategori veya şehir ara..."
                      aria-label="İşletme adı, kategori veya şehir ara"
                      className="flex-1 bg-transparent py-4 text-base text-white placeholder-gray-500 outline-none min-w-0"
                    />
                  </div>

                  {allCategories.length > 0 && (
                    <div className="flex items-center gap-1.5 border-t border-white/10 pt-1 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                      <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
                      <select
                        value={categoryId ?? ''}
                        onChange={(e) => { setCategoryId(e.target.value === '' ? null : Number(e.target.value)); onFilter() }}
                        aria-label="Kategori filtrele"
                        className="max-w-[150px] appearance-none bg-transparent py-4 pr-1 text-sm text-gray-300 outline-none transition-colors cursor-pointer hover:text-white"
                      >
                        <option value="">Tüm Kategoriler</option>
                        {allCategories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {categoryIcons[c.name] ? `${categoryIcons[c.name]} ${c.name}` : c.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="h-3 w-3 shrink-0 text-gray-500 pointer-events-none" />
                    </div>
                  )}

                  {allCities.length > 0 && (
                    <div className="flex items-center gap-1.5 border-t border-white/10 pt-1 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
                      <MapPin className="h-4 w-4 shrink-0 text-gray-500" />
                      <select
                        value={city}
                        onChange={(e) => { setCity(e.target.value); onFilter() }}
                        aria-label="Şehir filtrele"
                        className="max-w-[110px] appearance-none bg-transparent py-4 pr-1 text-sm text-gray-300 outline-none transition-colors cursor-pointer hover:text-white"
                      >
                        <option value="">Tüm Şehirler</option>
                        {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="h-3 w-3 shrink-0 text-gray-500 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ad banner - Creative */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-brand-500/5 via-white to-violet-50 py-4">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 sm:flex-row sm:px-8 lg:px-10">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
                <Megaphone className="h-4 w-4 text-brand-600" />
              </div>
              <span className="text-gray-700 font-medium">İşletmenizi öne çıkarın! Aylık ₺299&apos;dan başlayan reklam paketleri.</span>
            </div>
            <Link href="/register"
              className="shrink-0 rounded-xl bg-brand-500 px-5 py-2 text-xs font-bold text-white hover:bg-brand-600 transition-all hover:-translate-y-0.5 shadow-sm">
              Reklam Ver <ArrowRight className="inline h-3 w-3 ml-1" />
            </Link>
          </div>
        </div>

        {/* Listing */}
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-10">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {loading ? 'Yükleniyor...' : `${data?.totalCount ?? 0} işletme bulundu`}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-red-100 bg-red-50 p-16 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              ) : !data || data.items.length === 0 ? (
                <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center">
                  <Building2 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">Aramanızla eşleşen işletme bulunamadı.</p>
                </div>
              ) : (
                data.items.map((biz) => (
                  <div
                    key={biz.id}
                    className="group relative overflow-hidden rounded-3xl border-2 border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl"
                  >
                    {/* Top gradient bar on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative flex items-start gap-5 p-6">
                      {biz.logoUrl ? (
                        <img src={biz.logoUrl} alt={biz.name} className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-gray-100 group-hover:ring-brand-200 transition-all" />
                      ) : (
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ring-2 ring-gray-100 group-hover:ring-brand-200 transition-all ${categoryColor(biz.categoryName)}`}>
                          {initials(biz.name)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link href={`/isletmeler/${biz.id}`} className="text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                              {biz.name}
                            </Link>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-semibold ${categoryColor(biz.categoryName)}`}>
                                {categoryIcons[biz.categoryName] && <span>{categoryIcons[biz.categoryName]}</span>}
                                {biz.categoryName}
                              </span>
                              {biz.city && (
                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                  <MapPin className="h-3 w-3" /> {biz.city}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {biz.description && (
                          <p className="mt-2.5 text-xs text-gray-500 leading-relaxed line-clamp-2">{biz.description}</p>
                        )}

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            {biz.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" /> {biz.phone}
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/isletmeler/${biz.id}`}
                            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-all hover:-translate-y-0.5 shadow-sm"
                          >
                            <CalendarCheck className="h-3.5 w-3.5" /> Randevu Al
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                  >
                    <ChevronLeft className="h-4 w-4" /> Önceki
                  </button>
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-10 w-10 rounded-xl text-sm font-medium transition-all ${
                        n === page
                          ? 'bg-brand-500 text-white shadow-md'
                          : 'border border-gray-200 bg-white text-gray-700 hover:border-brand-300 hover:-translate-y-0.5'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                  >
                    Sonraki <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col gap-5">
              <div className="rounded-3xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-violet-50 p-6 hover:shadow-lg transition-shadow">
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 text-lg shadow-md">
                  <Megaphone className="h-6 w-6 text-white" />
                </div>
                <p className="mt-4 text-sm font-bold text-gray-900">İşletmenizi Platforma Ekleyin</p>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                  Binlerce müşteriye ulaşın. Ücretsiz listeleme veya öne çıkan paketi seçin.
                </p>
                <Link href="/register"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-brand-500 px-4 py-3 text-xs font-bold text-white hover:bg-brand-600 transition-all hover:-translate-y-0.5 shadow-sm">
                  Ücretsiz Ekle <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-3xl border-2 border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <Star className="h-6 w-6 text-amber-600" />
                </div>
                <p className="mt-4 text-sm font-bold text-gray-900">Öne Çıkan İşletme Ol</p>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  Arama sonuçlarında üst sıralarda yer alın, daha fazla müşteriye ulaşın.
                </p>
                <Link href="/register"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border-2 border-brand-200 px-4 py-3 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-all hover:-translate-y-0.5">
                  Detayları Görüntüle <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-3xl border-2 border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 p-6">
                <p className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-wider">Platform İstatistikleri</p>
                <div className="space-y-4">
                  <div>
                    <p className="text-3xl font-extrabold text-gray-900">{data?.totalCount ?? '10.000+'}</p>
                    <p className="text-xs text-gray-500">Kayıtlı İşletme</p>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div>
                    <p className="text-3xl font-extrabold text-gray-900">2M+</p>
                    <p className="text-xs text-gray-500">Aylık Randevu</p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
