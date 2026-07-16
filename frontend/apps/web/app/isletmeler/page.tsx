'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import {
  Search, MapPin, ChevronLeft, ChevronRight,
  CalendarCheck, Phone, Megaphone, Building2, Loader2, Star, ChevronDown, ArrowRight,
} from 'lucide-react'

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

const categoryIcons: Record<string, string> = {
  'Kuaför': '✂️',
  'Güzellik Salonu': '💅',
  'Diş Kliniği': '🦷',
  'Fizyoterapi': '🏃',
  'Spor Salonu': '💪',
  'Spa & Masaj': '🧖',
  'Tırnak Salonu': '💎',
  'Dövme Stüdyosu': '🎨',
  'Veteriner': '🐾',
  'Klinik': '🏥',
  'Yoga & Pilates': '🧘',
}

const categoryColor = (name: string) => {
  const colors = [
    'bg-violet-100 text-violet-700', 'bg-pink-100 text-pink-700', 'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-teal-100 text-teal-700',
    'bg-rose-100 text-rose-700', 'bg-orange-100 text-orange-700', 'bg-lime-100 text-lime-700',
    'bg-sky-100 text-sky-700', 'bg-purple-100 text-purple-700', 'bg-cyan-100 text-cyan-700',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const initials = (name: string) => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

export default function BusinessListPage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [city, setCity] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PaginatedResult<BusinessItem> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const allCategories = useMemo(() => {
    if (!data) return []
    return Array.from(new Set(data.items.map((b) => b.categoryName))).sort()
  }, [data])

  const allCities = useMemo(() => {
    if (!data) return []
    return Array.from(new Set(data.items.map((b) => b.city).filter(Boolean))).sort() as string[]
  }, [data])

  function onFilter() { setPage(1) }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-black py-20">
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-brand-500">Keşfet</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              İşletmeleri{' '}
              <span className="text-brand-500">Keşfedin</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
              Size en yakın, en iyi işletmeleri bulun ve hemen randevu alın
            </p>

            <div className="mx-auto mt-10 max-w-2xl">
              <div className="rounded-2xl bg-black/70 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-white/10">
                <div className="flex items-center gap-2 rounded-xl bg-white/5 pl-4 pr-2">
                  <Search className="h-5 w-5 shrink-0 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); onFilter() }}
                    placeholder="İşletme adı, kategori veya şehir ara..."
                    aria-label="İşletme adı, kategori veya şehir ara"
                    className="flex-1 bg-transparent py-4 text-base text-white placeholder-gray-500 outline-none min-w-0"
                  />
                  {allCities.length > 0 && (
                    <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                      <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
                      <select
                        value={city}
                        onChange={(e) => { setCity(e.target.value); onFilter() }}
                        aria-label="Şehir filtrele"
                        className="bg-transparent py-4 pr-1 text-sm text-gray-300 outline-none cursor-pointer hover:text-white transition-colors max-w-[110px] appearance-none"
                      >
                        <option value="">Tüm Şehirler</option>
                        {allCities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="h-3 w-3 text-gray-500 pointer-events-none" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {allCategories.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => { setCategoryId(null); onFilter() }}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    categoryId === null
                      ? 'bg-brand-500 text-black'
                      : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  Tümü
                </button>
                {allCategories.slice(0, 8).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setCategoryId(data?.items.find(b => b.categoryName === cat)?.categoryId ?? null); onFilter() }}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                      categoryId === (data?.items.find(b => b.categoryName === cat)?.categoryId ?? -1)
                        ? 'bg-brand-500 text-black'
                        : 'border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {categoryIcons[cat] && <span className="mr-1">{categoryIcons[cat]}</span>}
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Ad banner */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-brand-500/5 via-white to-violet-50 py-3">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 sm:flex-row sm:px-8 lg:px-10">
            <div className="flex items-center gap-2 text-sm">
              <Megaphone className="h-4 w-4 shrink-0 text-brand-500" />
              <span className="text-gray-600">İşletmenizi öne çıkarın! Aylık ₺299&apos;dan başlayan reklam paketleri.</span>
            </div>
            <Link href="/register"
              className="shrink-0 rounded-lg bg-brand-500 px-4 py-1.5 text-xs font-bold text-black hover:bg-brand-600 transition-colors">
              Reklam Ver
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
                <div className="rounded-2xl border border-red-100 bg-red-50 p-16 text-center">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              ) : !data || data.items.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
                  <Building2 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400">Aramanızla eşleşen işletme bulunamadı.</p>
                </div>
              ) : (
                data.items.map((biz) => (
                  <div
                    key={biz.id}
                    className="group relative overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
                  >
                    <div className="absolute -top-10 -right-10 h-20 w-20 rounded-full bg-brand-500/5 transition-colors group-hover:bg-brand-500/10" />

                    <div className="relative flex items-start gap-5 p-5">
                      {biz.logoUrl ? (
                        <img src={biz.logoUrl} alt={biz.name} className="h-16 w-16 shrink-0 rounded-xl object-cover ring-2 ring-gray-100" />
                      ) : (
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-lg font-bold ring-2 ring-gray-100 ${categoryColor(biz.categoryName)}`}>
                          {initials(biz.name)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link href={`/isletmeler/${biz.id}`} className="text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
                              {biz.name}
                            </Link>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${categoryColor(biz.categoryName)}`}>
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
                          <p className="mt-2 text-xs text-gray-500 leading-relaxed line-clamp-2">{biz.description}</p>
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
                            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-xs font-bold text-black hover:bg-brand-600 transition-all hover:-translate-y-0.5"
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
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Önceki
                  </button>
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                        n === page
                          ? 'bg-brand-500 text-black'
                          : 'border border-gray-200 bg-white text-gray-700 hover:border-brand-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page === data.totalPages}
                    className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:border-brand-300 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Sonraki <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col gap-5">
              <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-violet-50 p-6">
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg">
                  <Megaphone className="h-5 w-5 text-black" />
                </div>
                <p className="mt-4 text-sm font-bold text-gray-900">İşletmenizi Platforma Ekleyin</p>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                  Binlerce müşteriye ulaşın. Ücretsiz listeleme veya öne çıkan paketi seçin.
                </p>
                <Link href="/register"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2.5 text-xs font-bold text-black hover:bg-brand-600 transition-colors">
                  Ücretsiz Ekle <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
                <p className="mt-4 text-sm font-bold text-gray-900">Öne Çıkan İşletme Ol</p>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  Arama sonuçlarında üst sıralarda yer alın, daha fazla müşteriye ulaşın.
                </p>
                <Link href="/register"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border-2 border-brand-200 px-3 py-2.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 transition-colors">
                  Detayları Görüntüle <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-6">
                <p className="text-xs font-semibold text-gray-500 mb-4">Platform İstatistikleri</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900">{data?.totalCount ?? '10.000+'}</p>
                    <p className="text-xs text-gray-500">Kayıtlı İşletme</p>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div>
                    <p className="text-2xl font-extrabold text-gray-900">2M+</p>
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
