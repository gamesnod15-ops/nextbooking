'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, MapPin, ArrowRight, Sparkles, X, History, ChevronDown,
  Smartphone, Store, User, Users, Star, CheckCircle, MessageCircle, Bell, Calendar,
  MessageSquare, Share2, Clock, Shield, PlayCircle,
} from 'lucide-react'
import { DemoBookingModal } from './DemoBookingModal'
import { LiveStatsBanner } from './LiveStatsBanner'

// ─── Slide 1: Constants ───────────────────────────────────────────────────────

const CATEGORIES = [
  { label: 'Kuaför', emoji: '✂️' },
  { label: 'Güzellik Salonu', emoji: '💅' },
  { label: 'Diş Kliniği', emoji: '🦷' },
  { label: 'Fizyoterapi', emoji: '🏃' },
  { label: 'Spor Salonu', emoji: '💪' },
  { label: 'Spa & Masaj', emoji: '🧖' },
  { label: 'Tırnak Salonu', emoji: '💎' },
  { label: 'Dövme Stüdyosu', emoji: '🎨' },
  { label: 'Veteriner', emoji: '🐾' },
  { label: 'Klinik', emoji: '🏥' },
  { label: 'Yoga & Pilates', emoji: '🧘' },
  { label: 'Kişisel Antrenör', emoji: '🏋️' },
  { label: 'Beslenme Uzmanı', emoji: '🥗' },
  { label: 'Psikolog', emoji: '🧠' },
  { label: 'Fotoğrafçı', emoji: '📷' },
  { label: 'Oto Servis', emoji: '🔧' },
  { label: 'Danışmanlık', emoji: '💼' },
  { label: 'Özel Ders', emoji: '📚' },
]

const TRENDING = ['Saç Kesimi', 'Manikür', 'Spor', 'Diş Beyazlatma', 'Masaj', 'Cilt Bakımı', 'Epilasyon', 'Saç Boyama']

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

const SUGGESTIONS = [
  { label: 'Saç Kesimi ve Şekillendirme', category: 'Kuaför' },
  { label: 'Kalıcı Oje', category: 'Tırnak Salonu' },
  { label: 'Diş Beyazlatma', category: 'Diş Kliniği' },
  { label: 'Masaj Terapi', category: 'Spa & Masaj' },
  { label: 'Kişisel Antrenör', category: 'Kişisel Antrenör' },
  { label: 'Cilt Bakımı', category: 'Güzellik Salonu' },
]

function RotatingPlaceholder({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((p) => (p + 1) % TRENDING.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <span
      onClick={() => inputRef.current?.focus()}
      className={`absolute left-11 top-1/2 -translate-y-1/2 text-base text-gray-500 cursor-text transition-opacity duration-300 select-none pointer-events-none ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {TRENDING[index]}
    </span>
  )
}

// ─── Slide 1: Search Hero ─────────────────────────────────────────────────────

function SlideSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('')
  const [demoOpen, setDemoOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (!showSuggestions) return
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((p) => Math.min(p + 1, filteredSuggestions.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((p) => Math.max(p - 1, -1))
      }
      if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault()
        const item = filteredSuggestions[selectedIndex]
        if (item) {
          setQuery(item.label)
          handleSearch(item.label)
        }
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showSuggestions, selectedIndex, handleSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredSuggestions = query.trim()
    ? SUGGESTIONS.filter(
        (s) =>
          s.label.toLowerCase().includes(query.toLowerCase()) ||
          s.category.toLowerCase().includes(query.toLowerCase())
      )
    : []

  useEffect(() => {
    setSelectedIndex(-1)
  }, [query])

  const clearRecent = () => {
    setRecentSearches([])
    try { localStorage.removeItem(LS_KEY) } catch {}
  }

  const handleCategoryClick = (label: string) => {
    saveSearch(label)
    router.push(`/isletmeler?search=${encodeURIComponent(label)}`)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:px-10">
      <div className="w-full max-w-2xl py-16 lg:py-20">
        <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-5xl">
          <span className="block">En Yenilikçi</span>
          <span className="block text-brand-500">Randevu Platformu</span>
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-gray-400 sm:text-base">
          Hizmet arıyorsan en uygun işletmeyi bul, anında randevu al.
          İşletme sahibiysen 5 dakikada sisteme geç, müşterilerini 7/24 kazan.
        </p>

        <div ref={containerRef} className="mt-10 relative">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSearch() }}
            className={`relative flex items-center rounded-xl border-2 bg-black/70 backdrop-blur-xl transition-all duration-300 ${
              isFocused
                ? 'border-brand-500 shadow-[0_0_50px_-10px_rgba(207,242,30,0.35)]'
                : 'border-white/20 hover:border-white/40'
            }`}
          >
            <div className="flex flex-1 items-center gap-2 pl-4">
              <Search className={`h-5 w-5 shrink-0 transition-colors duration-300 ${isFocused ? 'text-brand-500' : 'text-gray-500'}`} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { setIsFocused(true); setShowSuggestions(true) }}
                onBlur={() => setIsFocused(false)}
                placeholder=""
                className="flex-1 bg-transparent py-4 text-base text-white placeholder-gray-500 outline-none min-w-0"
              />
              {!query && <RotatingPlaceholder inputRef={inputRef} />}
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus() }}
                  className="mr-1 rounded-full p-1 text-gray-500 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="hidden items-center gap-1.5 border-l border-white/10 pl-3 pr-2 sm:flex">
              <MapPin className="h-4 w-4 text-gray-500 shrink-0" />
              <div className="relative inline-flex">
                <button
                  type="button"
                  onClick={() => setCityOpen(!cityOpen)}
                  className="flex items-center gap-1.5 py-4 pr-5 text-sm text-gray-300 outline-none cursor-pointer hover:text-white transition-colors"
                >
                  <span className="truncate max-w-[110px]">{city || 'Tüm Şehirler'}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${cityOpen ? 'rotate-180' : ''}`} />
                </button>
                {cityOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCityOpen(false)} />
                    <div className="absolute right-0 bottom-full z-50 mb-2 w-48 origin-bottom-right overflow-hidden rounded-xl border border-gray-200 bg-white/95 backdrop-blur-2xl shadow-2xl animate-fade-in">
                      <div className="max-h-60 overflow-y-auto">
                        {['', ...ALL_CITIES].map((c) => (
                          <button
                            key={c || ''}
                            type="button"
                            onClick={() => { setCity(c); setCityOpen(false) }}
                            className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
                              (city || '') === c
                                ? 'text-gray-900 bg-gray-100'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            {city === c && <MapPin className="mr-2 h-3.5 w-3.5 text-brand-500" />}
                            <span>{c || 'Tüm Şehirler'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="mr-1.5 flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-3 text-sm font-bold text-black hover:bg-brand-600 transition-all hover:-translate-y-0.5 active:translate-y-0 shrink-0"
            >
              Ara
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {showSuggestions && (query.trim() ? filteredSuggestions.length > 0 : recentSearches.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/90 backdrop-blur-2xl shadow-2xl animate-fade-in">
              {query.trim() ? (
                <div>
                  <p className="px-4 pt-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Öneriler
                  </p>
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={s.label}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setQuery(s.label); handleSearch(s.label) }}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        selectedIndex === i ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                      <span>{s.label}</span>
                      <span className="ml-auto text-[11px] text-gray-600">{s.category}</span>
                    </button>
                  ))}
                </div>
              ) : recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <History className="mr-1.5 inline-block h-3 w-3" /> Son Aramalar
                    </p>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[11px] text-gray-600 hover:text-white transition-colors"
                    >
                      Temizle
                    </button>
                  </div>
                  {recentSearches.map((term, i) => (
                    <button
                      key={`${term}-${i}`}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); setQuery(term); handleSearch(term) }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <History className="h-3.5 w-3.5 shrink-0 text-gray-600" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Hemen Dene CTA */}
        <div className="mt-6 flex items-center gap-4">
          <button
            onClick={() => setDemoOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-black hover:bg-brand-600 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-brand-500/25"
          >
            <PlayCircle className="h-5 w-5" />
            Hemen Dene
          </button>
          <p className="text-xs text-gray-500 max-w-[200px] sm:max-w-none">
            <span className="hidden sm:inline">Üye olmadan </span>demo randevu almayı dene
          </p>
        </div>

        <div className="mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]">
          <div className="flex w-max animate-marquee gap-3">
            {[...CATEGORIES, ...CATEGORIES].map((cat, i) => (
              <button
                key={i}
                onClick={() => handleCategoryClick(cat.label)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all shadow-sm cursor-pointer"
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <LiveStatsBanner />

        <p className="mt-6 text-xs text-gray-600">
          <kbd className="mx-1 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[11px] font-mono">/</kbd>
          {' '}tuşuna basarak hızlı arama yapabilirsin
        </p>

        <DemoBookingModal open={demoOpen} onClose={() => setDemoOpen(false)} />
      </div>

      <div className="hidden lg:relative lg:flex lg:w-[420px] lg:shrink-0 lg:items-center lg:justify-end lg:ml-auto">
        <div className="relative h-[430px] w-[400px]">
          <div className="absolute left-0 top-4 h-[260px] w-[240px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl -rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80"
              alt="Güzellik Salonu"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">Güzellik Salonu</span>
          </div>
          <div className="absolute right-4 top-0 h-[190px] w-[180px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl rotate-2 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=400&q=80"
              alt="Diş Kliniği"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">Diş Kliniği</span>
          </div>
          <div className="absolute bottom-4 right-8 h-[210px] w-[220px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl -rotate-2 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=400&q=80"
              alt="Masaj & Spa"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">Spa & Masaj</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slide 2: Mobile App ──────────────────────────────────────────────────────

const MOBILE_FEATURES_BUSINESS = [
  { icon: Bell, text: 'Anında randevu bildirimleri' },
  { icon: Calendar, text: 'Takvim & randevu yönetimi' },
  { icon: Users, text: 'Müşteri takibi & geçmişi' },
  { icon: Share2, text: 'WhatsApp ile otomatik hatırlatma' },
]

const MOBILE_FEATURES_CUSTOMER = [
  { icon: Search, text: 'Kolay işletme & hizmet arama' },
  { icon: Clock, text: 'Tek tıkla randevu alma' },
  { icon: Star, text: 'Puan & yorum görüntüleme' },
  { icon: MessageSquare, text: 'İşletmeyle anlık iletişim' },
]

function SlideMobileApp() {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:px-10">
      <div className="w-full max-w-2xl py-16 lg:py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-sm">
          <Smartphone className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-xs font-semibold text-brand-500">iOS & Android</span>
        </div>

        <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-5xl">
          <span className="block mb-2">Mobil Uygulamamız</span>
          <span className="block text-brand-500">Her An Her Yerde</span>
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-gray-400 sm:text-base">
          İşletme sahipleri ve müşteriler için özel olarak tasarlanmış mobil uygulamalarımızla
          randevu yönetimi artık çok daha kolay. İster işletmenizi yönetin, ister randevu alın —
          hepsi cebinizde.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Store className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-semibold text-white">İşletmeler İçin</span>
            </div>
            <ul className="space-y-3">
              {MOBILE_FEATURES_BUSINESS.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <span className="text-sm text-gray-400">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-brand-500" />
              <span className="text-sm font-semibold text-white">Müşteriler İçin</span>
            </div>
            <ul className="space-y-3">
              {MOBILE_FEATURES_CUSTOMER.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <span className="text-sm text-gray-400">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-black shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5"
          >
            <Smartphone className="h-5 w-5" /> Uygulamayı İndir
          </Link>
          <Link
            href="/features"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-gray-300 hover:bg-white/10 transition-all"
          >
            Detaylı Bilgi <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="hidden lg:relative lg:flex lg:w-[420px] lg:shrink-0 lg:items-center lg:justify-end lg:ml-auto">
        <div className="relative h-[430px] w-[400px]">
          <div className="absolute left-0 top-4 h-[300px] w-[200px] overflow-hidden rounded-3xl border-2 border-white/20 shadow-2xl -rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80"
              alt="Mobil uygulama ekranı"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
          <div className="absolute right-4 top-0 h-[250px] w-[170px] overflow-hidden rounded-3xl border-2 border-white/20 shadow-2xl rotate-2 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80"
              alt="Uygulama arayüzü"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-4 right-8 h-[180px] w-[220px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl -rotate-2 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&q=80"
              alt="Dijital dönüşüm"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">Dijital Dönüşüm</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slide 3: WhatsApp Integration ────────────────────────────────────────────

const WHATSAPP_FEATURES = [
  { icon: Bell, text: 'Otomatik randevu hatırlatmaları', desc: 'Randevudan 24 saat önce WhatsApp üzerinden otomatik hatırlatma' },
  { icon: MessageCircle, text: 'Anında bildirimler', desc: 'Randevu onayı, iptal ve değişiklik bildirimleri anında iletilir' },
  { icon: MessageSquare, text: 'Müşteri destek iletişimi', desc: 'Müşterilerinizle WhatsApp üzerinden birebir iletişim kurun' },
  { icon: Share2, text: 'Toplu mesaj & kampanya', desc: 'Tüm müşterilerinize WhatsApp üzerinden kampanya ve duyuru gönderin' },
]

function SlideWhatsApp() {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:px-10">
      <div className="w-full max-w-2xl py-16 lg:py-20">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 shadow-sm">
          <MessageCircle className="h-3.5 w-3.5 text-brand-500" />
          <span className="text-xs font-semibold text-brand-500">WhatsApp API Entegrasyonu</span>
        </div>

        <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-5xl">
          <span className="block mb-2">WhatsApp ile</span>
          <span className="block text-brand-500">Randevu Yönetimi</span>
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-gray-400 sm:text-base">
          Müşterilerinizle en etkili iletişim kanalı olan WhatsApp üzerinden randevu
          hatırlatmaları, bildirimler ve kampanya mesajları gönderin. Tüm süreçler
          otomatikleşsin, siz işinize odaklanın.
        </p>

        <div className="mt-8 space-y-4">
          {WHATSAPP_FEATURES.map((f) => (
            <div key={f.text} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10">
                <f.icon className="h-5 w-5 text-brand-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{f.text}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-black shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5"
          >
            <MessageCircle className="h-5 w-5" /> Hemen Başla
          </Link>
          <Link
            href="/features"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-gray-300 hover:bg-white/10 transition-all"
          >
            Entegrasyonu İncele <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="hidden lg:relative lg:flex lg:w-[420px] lg:shrink-0 lg:items-center lg:justify-end lg:ml-auto">
        <div className="relative h-[430px] w-[400px]">
          <div className="absolute left-0 top-4 h-[260px] w-[230px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl -rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1611746872915-6e3e9009b3b6?w=400&q=80"
              alt="WhatsApp mesajlaşma"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">WhatsApp İletişim</span>
          </div>
          <div className="absolute right-4 top-0 h-[190px] w-[180px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl rotate-2 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=400&q=80"
              alt="Anlık mesajlaşma"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">Anlık Mesaj</span>
          </div>
          <div className="absolute bottom-4 right-8 h-[210px] w-[220px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl -rotate-2 transition-transform duration-500 hover:rotate-0 hover:scale-105 hover:z-20">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80"
              alt="Müşteri iletişim"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <span className="absolute bottom-3 left-3 text-xs font-semibold text-white">Müşteri Memnuniyeti</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Hero Slider ─────────────────────────────────────────────────────────

export function SearchHeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 6000)
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % 3)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 2) % 3)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3)
    }, 8000)
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isAutoPlaying])

  const pauseAutoPlay = useCallback(() => setIsAutoPlaying(false), [])
  const resumeAutoPlay = useCallback(() => setIsAutoPlaying(true), [])

  const slides = [
    { id: 'search', label: 'Hizmet Ara' },
    { id: 'mobile', label: 'Mobil Uygulama' },
    { id: 'whatsapp', label: 'WhatsApp' },
  ]

  return (
    <section
      className="relative min-h-[90vh] flex items-center overflow-hidden bg-black"
      onMouseEnter={pauseAutoPlay}
      onMouseLeave={resumeAutoPlay}
    >
      <div aria-hidden className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-brand-500/8 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full bg-violet-500/5 blur-3xl" />
        <div className="absolute top-1/3 right-1/3 h-[400px] w-[400px] rounded-full bg-brand-500/3 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <svg className="absolute -top-20 -right-20 h-80 w-80 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
          <polygon points="100,0 200,100 100,200 0,100" className="fill-white" />
        </svg>
        <svg className="absolute bottom-10 -left-20 h-60 w-60 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
          <rect x="20" y="20" width="160" height="160" rx="20" className="stroke-white stroke-[2]" fill="none" />
          <circle cx="100" cy="100" r="60" className="stroke-white stroke-[2]" fill="none" />
        </svg>
        <svg className="absolute top-1/2 left-1/3 h-40 w-40 opacity-[0.02]" viewBox="0 0 200 200" fill="none">
          <polygon points="100,10 190,190 10,190" className="fill-white" />
        </svg>
      </div>

      <div className="relative z-10 w-full">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            <div className="w-full flex-shrink-0">
              <SlideSearch />
            </div>
            <div className="w-full flex-shrink-0">
              <SlideMobileApp />
            </div>
            <div className="w-full flex-shrink-0">
              <SlideWhatsApp />
            </div>
          </div>
        </div>

        {/* Slider Controls */}
        <div className="absolute left-5 right-5 top-1/2 hidden -translate-y-1/2 justify-between lg:flex">
          <button
            onClick={prevSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/60 backdrop-blur-sm hover:bg-white/10 hover:text-white transition-all"
            aria-label="Önceki slayt"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
          </button>
          <button
            onClick={nextSlide}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/60 backdrop-blur-sm hover:bg-white/10 hover:text-white transition-all"
            aria-label="Sonraki slayt"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(i)}
              className={`group relative flex items-center gap-2 transition-all ${
                currentSlide === i ? 'scale-100' : 'scale-90'
              }`}
            >
              <span
                className={`block rounded-full transition-all duration-300 ${
                  currentSlide === i
                    ? 'h-2.5 w-8 bg-brand-500'
                    : 'h-2.5 w-2.5 bg-white/30 hover:bg-white/50'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Slide Labels (mobile) */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3 lg:hidden">
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(i)}
              className={`text-[11px] font-medium transition-all ${
                currentSlide === i ? 'text-brand-500' : 'text-gray-600'
              }`}
            >
              {slide.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
