'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, MapPin, ArrowRight, ChevronDown, X, History, Sparkles,
  Star, PlayCircle, CheckCircle, Store,
} from 'lucide-react'
import { DemoBookingModal } from './DemoBookingModal'
import { LiveStatsBanner } from './LiveStatsBanner'

const TRENDING = ['Saç Kesimi', 'Manikür', 'Diş Beyazlatma', 'Masaj', 'Cilt Bakımı', 'Spor']

const CATEGORY_TILES = [
  { label: 'Kuaför', emoji: '✂️' },
  { label: 'Güzellik', emoji: '💅' },
  { label: 'Diş Kliniği', emoji: '🦷' },
  { label: 'Spor Salonu', emoji: '💪' },
  { label: 'Spa & Masaj', emoji: '🧖' },
  { label: 'Veteriner', emoji: '🐾' },
]

const SUGGESTIONS = [
  { label: 'Saç Kesimi ve Şekillendirme', category: 'Kuaför' },
  { label: 'Kalıcı Oje', category: 'Tırnak Salonu' },
  { label: 'Diş Beyazlatma', category: 'Diş Kliniği' },
  { label: 'Masaj Terapi', category: 'Spa & Masaj' },
  { label: 'Kişisel Antrenör', category: 'Kişisel Antrenör' },
  { label: 'Cilt Bakımı', category: 'Güzellik Salonu' },
]

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
  'Zonguldak',
]

const LS_KEY = 'recent-searches-web'

const AVATARS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=160&q=80',
  'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=200&q=80',
  'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=160&q=80',
]

// ─── Card 1: Search ───────────────────────────────────────────────────────────

function SearchCard() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [cityOpen, setCityOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) setRecentSearches(JSON.parse(stored))
    } catch {}
  }, [])

  const saveSearch = useCallback((term: string) => {
    if (!term.trim()) return
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((s) => s !== term)].slice(0, 5)
      try { localStorage.setItem(LS_KEY, JSON.stringify(updated)) } catch {}
      return updated
    })
  }, [])

  const handleSearch = useCallback((term?: string) => {
    const searchTerm = term ?? query.trim()
    if (!searchTerm) {
      router.push('/isletmeler')
      return
    }
    saveSearch(searchTerm)
    const params = new URLSearchParams()
    params.set('search', searchTerm)
    if (city) params.set('city', city)
    router.push(`/isletmeler?${params.toString()}`)
    setShowSuggestions(false)
  }, [query, city, router, saveSearch])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = query.trim()
    ? SUGGESTIONS.filter(
        (s) =>
          s.label.toLowerCase().includes(query.toLowerCase()) ||
          s.category.toLowerCase().includes(query.toLowerCase())
      )
    : []

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md sm:p-9">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-50" />

      <div className="relative">
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          <span className="block text-brand-500">Hizmetini ara,</span>
          <span className="block text-gray-900">anında randevu al</span>
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-gray-500">
          Binlerce işletme arasından sana en yakınını bul, uygun saati seç, saniyeler içinde randevunu oluştur.
        </p>

        <div ref={containerRef} className="relative mt-7">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch() }}
            className="flex flex-col gap-2 rounded-2xl border border-gray-200 bg-gray-50/80 p-2 transition-colors focus-within:border-brand-200 focus-within:bg-white sm:flex-row sm:items-center"
          >
            <div className="flex flex-1 items-center gap-2 px-2 min-w-0">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Hizmet veya işletme ara…"
                aria-label="Hizmet veya işletme ara"
                className="w-full flex-1 bg-transparent py-3 text-sm text-gray-900 placeholder-gray-400 outline-none min-w-0"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus() }}
                  aria-label="Aramayı temizle"
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative flex items-center gap-1.5 border-t border-gray-200 px-2 pt-1 sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0">
              <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
              <button
                type="button"
                onClick={() => setCityOpen(!cityOpen)}
                className="flex items-center gap-1.5 py-3 pr-2 text-sm text-gray-600 outline-none transition-colors hover:text-gray-900"
              >
                <span className="max-w-[110px] truncate">{city || 'Tüm Şehirler'}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${cityOpen ? 'rotate-180' : ''}`} />
              </button>
              {cityOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCityOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                    <div className="max-h-60 overflow-y-auto">
                      {['', ...ALL_CITIES].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => { setCity(c); setCityOpen(false) }}
                          className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                            (city || '') === c ? 'bg-brand-50 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {c || 'Tüm Şehirler'}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-600"
            >
              Ara
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {showSuggestions && (query.trim() ? filtered.length > 0 : recentSearches.length > 0) && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              {query.trim() ? (
                filtered.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setQuery(s.label); handleSearch(s.label) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                    <span>{s.label}</span>
                    <span className="ml-auto text-[11px] text-gray-400">{s.category}</span>
                  </button>
                ))
              ) : (
                recentSearches.map((term, i) => (
                  <button
                    key={`${term}-${i}`}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setQuery(term); handleSearch(term) }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <History className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span>{term}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {TRENDING.map((t) => (
            <button
              key={t}
              onClick={() => handleSearch(t)}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setDemoOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-gray-800"
          >
            <PlayCircle className="h-4 w-4" />
            Hemen Dene
          </button>
          <p className="text-xs text-gray-400">Üye olmadan demo randevu al</p>
        </div>
      </div>

      <DemoBookingModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </div>
  )
}

// ─── Card 2: Categories ───────────────────────────────────────────────────────

function CategoriesCard() {
  return (
    <Link
      href="/isletmeler"
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md sm:p-9"
    >
      <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-brand-50" />

      <div className="relative mb-6 grid grid-cols-3 gap-2.5">
        {CATEGORY_TILES.map((c) => (
          <div
            key={c.label}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-gray-100 bg-gray-50/80 px-2 py-3 transition-colors group-hover:border-brand-100 group-hover:bg-brand-50/60"
          >
            <span className="text-xl">{c.emoji}</span>
            <span className="text-center text-[10px] font-medium leading-tight text-gray-500">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="relative">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          <span className="block text-brand-500">Her kategoride</span>
          <span className="block text-gray-900">binlerce işletme</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Kuaförden diş kliniğine, spordan veterinere — aradığın hizmet Türkiye&apos;nin her şehrinde.
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600">
          İşletmeleri keşfet
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

// ─── Card 3: Trust / reviews ──────────────────────────────────────────────────

function TrustCard() {
  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md sm:p-9">
      <div aria-hidden className="pointer-events-none absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-brand-50" />

      <div className="relative mb-6 flex items-center justify-center">
        <div className="flex -space-x-4">
          {AVATARS.map((src, i) => (
            <div
              key={src}
              className={`relative overflow-hidden rounded-full border-4 border-white shadow-md ${
                i === 1 ? 'h-20 w-20 z-10' : 'h-14 w-14'
              }`}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        <span className="absolute bottom-0 right-1/4 h-4 w-4 rounded-full border-[3px] border-white bg-emerald-500" />
      </div>

      <div className="relative">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          <span className="block text-brand-500">Gerçek yorumlar,</span>
          <span className="block text-gray-900">güvenilir işletmeler</span>
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Sadece randevusunu tamamlayan müşteriler puan verebilir. Gördüğün her yorum gerçek.
        </p>
        <div className="mt-4 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="text-sm font-bold text-gray-900">4.9</span>
          <span className="text-xs text-gray-400">/ 2.400+ yorum</span>
        </div>
      </div>
    </div>
  )
}

// ─── Card 4: Online booking ───────────────────────────────────────────────────

function OnlineCard() {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      <div aria-hidden className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-brand-50" />

      <div className="relative flex-1 p-7 sm:p-9">
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight">
          <span className="block text-brand-500">%100 online</span>
          <span className="block text-gray-900">randevu deneyimi</span>
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
          Telefonla uğraşma, sıra bekleme. Gece yarısı bile randevunu al, hatırlatmanı WhatsApp&apos;tan gönderelim.
        </p>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
          {['7/24 randevu', 'Anında onay', 'Ücretsiz iptal'].map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
              {t}
            </span>
          ))}
        </div>

        <Link
          href="/register"
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        >
          <Store className="h-4 w-4" />
          İşletmeni ücretsiz ekle
        </Link>
      </div>

      <div className="relative h-52 w-full shrink-0 self-stretch sm:h-auto sm:w-[46%]">
        <img
          src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80"
          alt="Telefonuyla randevu alan kişi"
          className="h-full w-full object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent sm:from-white sm:via-white/40" />
      </div>
    </div>
  )
}

// ─── Bento Hero ───────────────────────────────────────────────────────────────

export function BentoHeroSection() {
  return (
    <section className="bg-gray-50/60 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7"><SearchCard /></div>
          <div className="lg:col-span-5"><CategoriesCard /></div>
          <div className="lg:col-span-5"><TrustCard /></div>
          <div className="lg:col-span-7"><OnlineCard /></div>
        </div>

        <LiveStatsBanner />
      </div>
    </section>
  )
}
