'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, MapPin, ArrowRight, Sparkles, X, History, ChevronDown,
  Smartphone, Store, User, Users, Star, CheckCircle, MessageCircle, Bell, Calendar,
  MessageSquare, Share2, Clock, Shield, PlayCircle, MousePointerClick, Headphones,
  BarChart3, Plus, CheckCheck,
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
                aria-label="Hizmet veya işletme ara"
                className="flex-1 bg-transparent py-4 text-base text-white placeholder-gray-500 outline-none min-w-0"
              />
              {!query && <RotatingPlaceholder inputRef={inputRef} />}
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus() }}
                  aria-label="Aramayı temizle"
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

      <div className="hidden lg:relative lg:flex lg:w-[440px] lg:shrink-0 lg:items-center lg:justify-end lg:ml-auto">
        <div className="relative h-[460px] w-[380px]">
          {/* Decorative accent ring behind the photo */}
          <div aria-hidden className="absolute -right-6 -top-6 h-40 w-40 rounded-full border-[16px] border-brand-500/15" />
          <div aria-hidden className="absolute -bottom-8 -left-8 h-28 w-28 rounded-3xl border-2 border-white/10 rotate-12" />

          {/* Main portrait */}
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=700&q=80"
              alt="Kadın kuaför"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-5 left-5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-black">
                <Star className="h-3 w-3" /> 4.9 Puan
              </span>
              <p className="mt-2 text-lg font-bold text-white">Elif Studio</p>
              <p className="text-xs text-gray-300">Kuaför & Güzellik · İstanbul</p>
            </div>
          </div>

          {/* Floating booking chip */}
          <div className="absolute -left-8 top-10 animate-float rounded-2xl border border-white/10 bg-black/90 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15">
                <CheckCircle className="h-4 w-4 text-brand-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Randevu Onaylandı</p>
                <p className="text-[10px] text-gray-400">Bugün 14:30 · Saç Kesimi</p>
              </div>
            </div>
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
        <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-5xl">
          <span className="block mb-2">Mobil Uygulamamız</span>
          <span className="block text-brand-500">Her An Her Yerde</span>
        </h1>

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

      <div className="hidden lg:relative lg:flex lg:w-[490px] lg:shrink-0 lg:items-center lg:justify-center lg:ml-auto">
        <PhoneMockup />
      </div>
    </div>
  )
}

// Angled phone mockup — tilted in 3D, facing left. Pure CSS/SVG, no images.
function PhoneMockup() {
  return (
    <div className="relative flex h-[540px] w-[480px] items-center justify-center" style={{ perspective: '1600px' }}>
      {/* Glow */}
      <div aria-hidden className="absolute h-80 w-80 rounded-full bg-brand-500/15 blur-3xl" />

      {/* Background scenery — rings, dots, orbits filling the negative space */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -right-4 top-2 h-40 w-40 rounded-full border-[14px] border-brand-500/10" />
        <div className="absolute left-2 top-6 h-24 w-24 rounded-full border-2 border-dashed border-white/10" />
        <div className="absolute -left-6 bottom-10 h-32 w-32 rounded-3xl border border-white/10 rotate-12" />
        <div className="absolute right-6 bottom-2 h-20 w-20 rounded-full border-[8px] border-white/5" />
        <div
          className="absolute left-0 top-1/3 h-40 w-28 opacity-40"
          style={{ backgroundImage: 'radial-gradient(rgba(207,242,30,0.35) 1.5px, transparent 0)', backgroundSize: '14px 14px' }}
        />
        <div
          className="absolute right-0 bottom-1/4 h-36 w-24 opacity-30"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1.5px, transparent 0)', backgroundSize: '14px 14px' }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 480 540" fill="none">
          <ellipse cx="240" cy="270" rx="225" ry="150" className="stroke-brand-500" strokeWidth="1" strokeDasharray="3 7" transform="rotate(-18 240 270)" />
        </svg>
      </div>

      {/* Floating decorations (upright, independent bob) */}
      <div className="absolute right-0 top-10 z-20 animate-float rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '0s' }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15">
            <CheckCircle className="h-4 w-4 text-brand-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white">Randevu Onaylandı</p>
            <p className="text-[9px] text-gray-400">14:30 · Saç Kesimi</p>
          </div>
        </div>
      </div>

      <div className="absolute left-2 top-24 z-20 animate-float rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '1.2s' }}>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <div>
            <p className="text-[13px] font-extrabold leading-none text-white">4.9</p>
            <p className="text-[8px] text-gray-400">2.400+ yorum</p>
          </div>
        </div>
      </div>

      {/* Mini calendar chip — fills mid-left gap */}
      <div className="absolute left-0 top-1/2 z-20 animate-float rounded-2xl border border-white/10 bg-black/90 p-3 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '0.6s' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-col items-center justify-center overflow-hidden rounded-lg border border-white/10">
            <span className="w-full bg-brand-500 text-center text-[6px] font-bold uppercase text-black">May</span>
            <span className="flex-1 pt-0.5 text-[13px] font-extrabold leading-none text-white">12</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">3 randevu</p>
            <p className="text-[8px] text-gray-400">bugün planlandı</p>
          </div>
        </div>
      </div>

      {/* Avatar stack — fills bottom-left gap */}
      <div className="absolute bottom-10 left-8 z-20 animate-float rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '2s' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex -space-x-2">
            {['bg-violet-500', 'bg-brand-500', 'bg-amber-500'].map((c, i) => (
              <span key={c} className={`flex h-6 w-6 items-center justify-center rounded-full border-2 border-black ${c} text-[8px] font-bold text-black`}>
                {['A', 'S', 'M'][i]}
              </span>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">10.000+ işletme</p>
            <p className="text-[8px] text-gray-400">NextBooking kullanıyor</p>
          </div>
        </div>
      </div>

      {/* Bell chip — fills bottom-right gap */}
      <div className="absolute bottom-4 right-10 z-20 flex animate-float items-center gap-1.5 rounded-full border border-white/10 bg-black/90 px-3 py-1.5 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '1.6s' }}>
        <Bell className="h-3.5 w-3.5 text-brand-500" />
        <span className="text-[10px] font-semibold text-white">Yeni bildirim</span>
      </div>

      {/* Growth chip — fills mid-right gap */}
      <div className="absolute right-2 top-[58%] z-20 animate-float rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '2.6s' }}>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-brand-500" />
          <div>
            <p className="text-[12px] font-extrabold leading-none text-white">+%35</p>
            <p className="text-[8px] text-gray-400">doluluk artışı</p>
          </div>
        </div>
      </div>

      {/* Float wrapper (translateY only) → tilt child (3D rotation) */}
      <div className="animate-float">
        <div style={{ transform: 'rotateY(-22deg) rotateZ(4deg)' }}>
        {/* Phone body */}
        <div className="h-[460px] w-[228px] rounded-[2.6rem] border-[3px] border-white/15 bg-neutral-900 p-2.5 shadow-2xl">
          {/* Screen */}
          <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-gray-50">
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

            {/* Status bar */}
            <div className="flex items-center justify-between px-5 pt-3 text-[10px] font-semibold text-gray-900">
              <span>9:41</span>
              <span className="flex items-center gap-1 text-gray-500">
                <span className="h-2 w-3 rounded-sm bg-gray-400" />
                <span className="h-2 w-2 rounded-full bg-brand-500" />
              </span>
            </div>

            {/* App header */}
            <div className="px-4 pt-5">
              <p className="text-[10px] text-gray-400">Merhaba 👋</p>
              <p className="text-base font-extrabold text-gray-900">Ayşe Yılmaz</p>
            </div>

            {/* Next appointment hero card */}
            <div className="mx-4 mt-4 rounded-2xl bg-brand-500 p-3.5 shadow-sm">
              <p className="text-[9px] font-bold uppercase tracking-wide text-black/60">Sıradaki Randevu</p>
              <p className="mt-1 text-sm font-extrabold text-black">Saç Kesimi & Fön</p>
              <div className="mt-2 flex items-center gap-3 text-[10px] font-semibold text-black/80">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Bugün</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> 14:30</span>
              </div>
            </div>

            {/* List */}
            <div className="mx-4 mt-4 space-y-2.5">
              {[
                { name: 'Elif Studio', svc: 'Manikür', time: 'Yarın · 11:00' },
                { name: 'GlowUp Spa', svc: 'Cilt Bakımı', time: 'Cuma · 16:30' },
                { name: 'Dr. Mehmet', svc: 'Diş Kontrol', time: 'Pzt · 09:00' },
              ].map((a) => (
                <div key={a.name} className="flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-[11px] font-bold text-brand-600">
                    {a.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold text-gray-900">{a.name}</p>
                    <p className="truncate text-[9px] text-gray-400">{a.svc}</p>
                  </div>
                  <span className="shrink-0 text-[8px] font-semibold text-gray-400">{a.time}</span>
                </div>
              ))}
            </div>

            {/* Bottom nav */}
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around border-t border-gray-100 bg-white px-4 py-3">
              <Calendar className="h-4 w-4 text-brand-500" />
              <Search className="h-4 w-4 text-gray-300" />
              <Bell className="h-4 w-4 text-gray-300" />
              <User className="h-4 w-4 text-gray-300" />
            </div>
          </div>
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
        <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-5xl">
          <span className="block mb-2">WhatsApp ile</span>
          <span className="block text-brand-500">Randevu Yönetimi</span>
        </h1>

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

      <div className="hidden lg:relative lg:flex lg:w-[490px] lg:shrink-0 lg:items-center lg:justify-center lg:ml-auto">
        <WhatsAppMockup />
      </div>
    </div>
  )
}

// WhatsApp conversation mockup inside an angled phone. Pure CSS/SVG, no images.
function WhatsAppMockup() {
  return (
    <div className="relative flex h-[540px] w-[480px] items-center justify-center" style={{ perspective: '1600px' }}>
      <div aria-hidden className="absolute h-80 w-80 rounded-full bg-brand-500/15 blur-3xl" />

      {/* Background scenery — rings, dots, orbits filling the negative space */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -right-4 top-4 h-36 w-36 rounded-full border-[12px] border-[#25D366]/10" />
        <div className="absolute left-4 top-8 h-24 w-24 rounded-full border-2 border-dashed border-white/10" />
        <div className="absolute -left-4 bottom-12 h-28 w-28 rounded-3xl border border-white/10 -rotate-6" />
        <div className="absolute right-8 bottom-4 h-16 w-16 rounded-full border-[6px] border-white/5" />
        <div
          className="absolute left-0 top-[55%] h-36 w-24 opacity-40"
          style={{ backgroundImage: 'radial-gradient(rgba(37,211,102,0.4) 1.5px, transparent 0)', backgroundSize: '14px 14px' }}
        />
        <div
          className="absolute right-2 top-1/3 h-32 w-20 opacity-30"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1.5px, transparent 0)', backgroundSize: '14px 14px' }}
        />
        <svg className="absolute inset-0 h-full w-full opacity-[0.12]" viewBox="0 0 480 540" fill="none">
          <ellipse cx="240" cy="270" rx="225" ry="150" className="stroke-[#25D366]" strokeWidth="1" strokeDasharray="3 7" transform="rotate(-18 240 270)" />
        </svg>
      </div>

      {/* Floating chat decorations (upright, independent bob) */}
      <div className="absolute right-2 top-8 z-20 animate-float rounded-2xl rounded-tr-none border border-white/10 bg-white px-3 py-2 shadow-2xl" style={{ animationDelay: '0s' }}>
        <p className="text-[11px] font-semibold text-gray-800">🔔 Hatırlatma gönderildi</p>
        <p className="mt-0.5 text-right text-[8px] text-gray-400">şimdi</p>
      </div>

      {/* Extra incoming bubble — fills upper-left gap */}
      <div className="absolute left-4 top-20 z-20 animate-float rounded-2xl rounded-tl-none bg-[#DCF8C6] px-3 py-2 shadow-2xl" style={{ animationDelay: '0.5s' }}>
        <p className="text-[11px] font-semibold text-gray-800">Teşekkürler! 🙏</p>
        <p className="mt-0.5 flex items-center justify-end gap-0.5 text-[8px] text-gray-500">
          09:16 <CheckCircle className="h-2.5 w-2.5 text-sky-500" />
        </p>
      </div>

      <div className="absolute left-0 top-[45%] z-20 animate-float rounded-2xl border border-white/10 bg-[#25D366] px-3.5 py-2 shadow-2xl" style={{ animationDelay: '1.1s' }}>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-white" />
          <div>
            <p className="text-[11px] font-bold leading-none text-white">%98</p>
            <p className="text-[8px] text-emerald-50/90">okunma oranı</p>
          </div>
        </div>
      </div>

      {/* Campaign card — fills bottom-left gap */}
      <div className="absolute bottom-14 left-6 z-20 animate-float rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '1.7s' }}>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#25D366]/15">
            <Share2 className="h-4 w-4 text-[#25D366]" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-white">Kampanya gönderildi</p>
            <p className="text-[8px] text-gray-400">1.240 müşteriye ulaştı</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-2 z-20 flex animate-float items-center gap-1.5 rounded-full border border-white/10 bg-black/90 px-3 py-1.5 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '2.4s' }}>
        <CheckCircle className="h-3.5 w-3.5 text-sky-400" />
        <span className="text-[10px] font-semibold text-white">Okundu</span>
      </div>

      {/* Timer chip — fills mid-right gap */}
      <div className="absolute right-0 top-[55%] z-20 animate-float rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '2.9s' }}>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-500" />
          <div>
            <p className="text-[11px] font-bold leading-none text-white">24 saat önce</p>
            <p className="text-[8px] text-gray-400">otomatik hatırlatma</p>
          </div>
        </div>
      </div>

      {/* Typing indicator — fills bottom-right gap */}
      <div className="absolute bottom-3 right-14 z-20 flex animate-float items-center gap-1 rounded-full bg-white px-3 py-2 shadow-2xl" style={{ animationDelay: '0.9s' }}>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: '0s' }} />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: '0.2s' }} />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gray-400" style={{ animationDelay: '0.4s' }} />
      </div>

      {/* Float wrapper (translateY only) → tilt child (3D rotation) */}
      <div className="animate-float">
        <div style={{ transform: 'rotateY(-22deg) rotateZ(4deg)' }}>
        <div className="h-[460px] w-[228px] rounded-[2.6rem] border-[3px] border-white/15 bg-neutral-900 p-2.5 shadow-2xl">
          <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[2rem] bg-[#ECE5DD]">
            {/* WhatsApp header */}
            <div className="flex items-center gap-2.5 bg-[#075E54] px-3.5 pb-2.5 pt-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-black">N</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold text-white">NextBooking</p>
                <p className="text-[8px] text-emerald-100/80">çevrimiçi</p>
              </div>
              <MessageCircle className="h-3.5 w-3.5 text-emerald-100" />
            </div>

            {/* Chat area */}
            <div
              className="flex flex-1 flex-col gap-2 px-3 py-3"
              style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 0)', backgroundSize: '14px 14px' }}
            >
              {/* Incoming */}
              <div className="max-w-[80%] self-start rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-sm">
                <p className="text-[9.5px] leading-snug text-gray-800">Merhaba! 🗓️ Yarınki randevunuzu hatırlatmak isteriz.</p>
                <p className="mt-0.5 text-right text-[7px] text-gray-400">09:12</p>
              </div>
              <div className="max-w-[85%] self-start rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-sm">
                <p className="text-[9.5px] font-semibold leading-snug text-gray-800">Saç Kesimi & Fön</p>
                <p className="text-[9px] leading-snug text-gray-600">Yarın · 14:30 · Elif Studio</p>
                <p className="mt-0.5 text-right text-[7px] text-gray-400">09:12</p>
              </div>

              {/* Outgoing */}
              <div className="max-w-[75%] self-end rounded-lg rounded-tr-none bg-[#DCF8C6] px-2.5 py-1.5 shadow-sm">
                <p className="text-[9.5px] leading-snug text-gray-800">Onaylıyorum ✅</p>
                <p className="mt-0.5 flex items-center justify-end gap-0.5 text-[7px] text-gray-500">
                  09:15
                  <CheckCircle className="h-2 w-2 text-sky-500" />
                </p>
              </div>

              {/* Incoming confirmation */}
              <div className="max-w-[85%] self-start rounded-lg rounded-tl-none bg-white px-2.5 py-1.5 shadow-sm">
                <p className="text-[9.5px] leading-snug text-gray-800">Harika! Randevunuz onaylandı. Görüşmek üzere 💚</p>
                <p className="mt-0.5 text-right text-[7px] text-gray-400">09:15</p>
              </div>
            </div>

            {/* Input bar */}
            <div className="flex items-center gap-2 bg-[#ECE5DD] px-3 pb-4 pt-1">
              <div className="flex-1 rounded-full bg-white px-3 py-1.5 text-[9px] text-gray-400 shadow-sm">Mesaj yazın…</div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#075E54]">
                <ArrowRight className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slide 4: Dashboard Showcase ──────────────────────────────────────────────

const DASHBOARD_BADGES = [
  { icon: MousePointerClick, label: 'Kolay Kullanım' },
  { icon: Shield,            label: 'Güvenli Altyapı' },
  { icon: Headphones,        label: '7/24 Destek' },
  { icon: BarChart3,         label: 'Raporlama' },
]

// Static illustrative grid — a decorative calendar mockup, not a real date engine.
const CALENDAR_WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const CALENDAR_DAYS = [
  { n: 30, muted: true }, { n: 31, muted: true }, { n: 1 }, { n: 2 }, { n: 2, busy: true }, { n: 3 }, { n: 4 },
  { n: 5 }, { n: 6 }, { n: 7, busy: true }, { n: 8 }, { n: 9 }, { n: 10 }, { n: 11 },
  { n: 12 }, { n: 13, busy: true }, { n: 14 }, { n: 15 }, { n: 16 }, { n: 17, today: true }, { n: 18 },
  { n: 19 }, { n: 20 }, { n: 21 }, { n: 22 }, { n: 23 }, { n: 24 }, { n: 25, busy: true },
]

function CalendarMockup() {
  return (
    <div className="relative h-[440px] w-[580px]">
      {/* Background scenery — fills the left negative space */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-4 top-2 h-32 w-32 rounded-full border-[12px] border-brand-500/10" />
        <div className="absolute left-10 bottom-4 h-24 w-24 rounded-full border-2 border-dashed border-white/10" />
        <div className="absolute left-0 top-1/2 h-36 w-24 -translate-y-1/2 opacity-40"
          style={{ backgroundImage: 'radial-gradient(rgba(207,242,30,0.35) 1.5px, transparent 0)', backgroundSize: '14px 14px' }} />
        <div className="absolute left-24 top-6 h-20 w-14 opacity-30"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.35) 1.5px, transparent 0)', backgroundSize: '14px 14px' }} />
      </div>

      {/* Left floating cards */}
      <div className="absolute left-0 top-6 z-20 animate-float rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15">
            <BarChart3 className="h-4 w-4 text-brand-500" />
          </div>
          <div>
            <p className="text-[13px] font-extrabold leading-none text-white">₺12.450</p>
            <p className="mt-0.5 text-[9px] text-gray-400">bugünkü ciro</p>
          </div>
        </div>
      </div>

      <div className="absolute left-2 top-[45%] z-20 animate-float rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '1.3s' }}>
        <p className="text-[10px] font-bold text-white">%92 doluluk</p>
        <div className="mt-1.5 h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-[92%] rounded-full bg-brand-500" />
        </div>
        <p className="mt-1 text-[8px] text-gray-400">bu hafta</p>
      </div>

      <div className="absolute bottom-8 left-6 z-20 flex animate-float items-center gap-2 rounded-2xl border border-white/10 bg-black/90 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl" style={{ animationDelay: '2.1s' }}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15">
          <Bell className="h-4 w-4 text-brand-500" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-white">5 hatırlatma gönderildi</p>
          <p className="text-[8px] text-gray-400">SMS & WhatsApp</p>
        </div>
      </div>

      {/* Calendar card — anchored right */}
      <div className="absolute right-0 top-1/2 h-[400px] w-[440px] -translate-y-1/2 overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Calendar className="h-4 w-4 text-brand-600" />
            Ocak
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-600">
              <Plus className="h-3 w-3" /> Randevu
            </span>
            <span className="rounded-lg bg-brand-500 px-2 py-1 text-[10px] font-bold text-black">Bugün</span>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-gray-400">
          {CALENDAR_WEEKDAYS.map((d) => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {CALENDAR_DAYS.map((d, i) => (
            <div
              key={i}
              className={`flex h-9 items-center justify-center rounded-lg text-[11px] transition-colors ${
                d.today
                  ? 'bg-brand-500 font-bold text-black'
                  : d.busy
                  ? 'bg-brand-50 font-semibold text-brand-600'
                  : d.muted
                  ? 'text-gray-300'
                  : 'text-gray-600'
              }`}
            >
              {d.n}
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
          {[
            { time: '09:30', name: 'Zeynep Aksoy', service: 'Saç Kesimi' },
            { time: '11:00', name: 'Can Yıldız', service: 'Sakal Tıraşı' },
          ].map((row) => (
            <div key={row.time} className="flex items-center gap-2.5 rounded-lg bg-gray-50 px-2.5 py-2">
              <span className="text-[10px] font-semibold text-brand-600">{row.time}</span>
              <span className="h-1 w-1 rounded-full bg-gray-300" />
              <span className="text-[11px] text-gray-700">{row.name}</span>
              <span className="ml-auto text-[10px] text-gray-400">{row.service}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating "new booking" card */}
      <div className="absolute -bottom-7 -right-7 w-52 animate-float rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl">
        <p className="mb-2.5 text-sm font-bold text-gray-900">Yeni Rezervasyon</p>
        <div className="space-y-1.5 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <User className="h-3 w-3 shrink-0 text-brand-600" /> Ayşe Yılmaz
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0 text-brand-600" /> 12 Mayıs 2026
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0 text-brand-600" /> 12:00 - 13:00
          </div>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold text-brand-600">
          <CheckCircle className="h-3 w-3" /> Oluşturuldu
        </span>
      </div>
    </div>
  )
}

function SlideDashboard() {
  return (
    <div className="mx-auto flex w-full max-w-7xl items-center gap-10 px-5 sm:px-8 lg:px-10">
      <div className="w-full max-w-2xl py-16 lg:py-20">
        <h1 className="text-3xl font-extrabold leading-[1.2] tracking-tight text-white sm:text-4xl lg:text-5xl">
          <span className="block">Randevu yönetimi artık</span>
          <span className="block">çok daha <span className="text-brand-500">kolay.</span></span>
        </h1>
        <p className="mt-5 max-w-lg text-sm leading-relaxed text-gray-400 sm:text-base">
          NextBooking ile rezervasyon süreçlerinizi yönetin, müşteri memnuniyetini artırın,
          işinizi büyütün.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href="/register"
            className="flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-black shadow-lg hover:bg-brand-600 transition-all hover:-translate-y-0.5"
          >
            Hemen Başlayın
          </Link>
          <Link
            href="/demo"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-base font-semibold text-gray-300 hover:bg-white/10 transition-all"
          >
            <PlayCircle className="h-4 w-4" /> Demo İzle
          </Link>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-5 border-t border-white/10 pt-8">
          {DASHBOARD_BADGES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-start gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Icon className="h-5 w-5 text-brand-500" />
              </div>
              <span className="text-xs font-medium text-gray-300">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:relative lg:flex lg:w-[580px] lg:shrink-0 lg:items-center lg:justify-end lg:ml-auto">
        <CalendarMockup />
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

  const SLIDE_COUNT = 4

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDE_COUNT)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + SLIDE_COUNT - 1) % SLIDE_COUNT)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return
    autoPlayRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDE_COUNT)
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
    { id: 'dashboard', label: 'Panel' },
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
            <div className="w-full flex-shrink-0">
              <SlideDashboard />
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
              aria-label={`${slide.label} slaytına git`}
              aria-current={currentSlide === i}
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
