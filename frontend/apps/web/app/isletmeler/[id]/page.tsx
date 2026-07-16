'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { RandevuModal } from '@/components/RandevuModal'
import { ShareModal } from '@/components/ShareModal'
import {
  MapPin, Phone, CalendarCheck,
  Share2, Heart, ChevronRight, Clock, Loader2,
  Globe, Building2, Image, Star, Check,
} from 'lucide-react'

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false })

const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

interface ServiceDto {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number
  imageUrl: string | null
}

interface EmployeeDto {
  id: string
  name: string
  title: string | null
  avatarUrl: string | null
}

interface ReviewItem {
  id: string
  authorName: string
  rating: number
  comment: string | null
  createdAt: string
}

interface BusinessDetail {
  id: string
  name: string
  categoryId: number
  categoryName: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  website: string | null
  logoUrl: string | null
  coverImageUrl: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  workingHours: string | null
  galleryImages: string[]
  services: ServiceDto[]
  employees: EmployeeDto[]
}

const Stars = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) => {
  const cls = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <Star key={s} className={`${cls} ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
      ))}
    </div>
  )
}

export default function BusinessDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [biz, setBiz] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [randevuOpen, setRandevuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('rk_favorites') || '[]')
      setFavoriteIds(Array.isArray(stored) ? stored : [])
    } catch { setFavoriteIds([]) }
  }, [])

  function toggleFavorite() {
    const updated = favoriteIds.includes(id) ? favoriteIds.filter(x => x !== id) : [...favoriteIds, id]
    setFavoriteIds(updated)
    localStorage.setItem('rk_favorites', JSON.stringify(updated))
  }
  const [authorName, setAuthorName] = useState('')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/v1/reviews/${id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setReviews)
      .catch(() => {})
      .finally(() => setReviewsLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError('')
    fetch(`/api/v1/businesses/${id}`)
      .then((r) => {
        if (r.status === 404) throw new Error('İşletme bulunamadı')
        if (!r.ok) throw new Error('Veri alınamadı')
        return r.json()
      })
      .then(setBiz)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </main>
        <Footer />
      </>
    )
  }

  if (error || !biz) {
    return (
      <>
        <Navbar />
        <main className="flex flex-col items-center justify-center py-32">
          <Building2 className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500">{error || 'İşletme bulunamadı'}</p>
          <Link href="/isletmeler" className="mt-4 text-sm text-brand-500 hover:underline">
            Tüm işletmelere dön
          </Link>
        </main>
        <Footer />
      </>
    )
  }

  const initials = biz.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0

  return (
    <>
      <Navbar />
      <main>
        {/* Breadcrumb */}
        <div className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-3">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Link href="/" className="hover:text-brand-500 transition-colors">Ana Sayfa</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/isletmeler" className="hover:text-brand-500 transition-colors">İşletmeler</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-gray-900 font-medium">{biz.name}</span>
            </div>
          </div>
        </div>

        {/* Hero */}
        <section className="relative overflow-hidden bg-black pb-6">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 left-1/3 h-[500px] w-[500px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 right-1/4 h-[400px] w-[400px] rounded-full bg-violet-500/8 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 pt-6">
            {biz.galleryImages.length > 0 && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2">
                {biz.galleryImages.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square cursor-pointer overflow-hidden rounded-xl group"
                    onClick={() => setSelectedImage(i)}
                  >
                    <img
                      src={img}
                      alt={`${biz.name} ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    {i === 3 && biz.galleryImages.length > 4 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-medium">
                        <Image className="h-4 w-4 mr-1" /> +{biz.galleryImages.length - 4}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-start gap-5">
              {biz.logoUrl ? (
                <img src={biz.logoUrl} alt={biz.name} className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-white/20" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-xl font-bold text-black">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-white">{biz.name}</h1>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-0.5 text-xs font-semibold text-gray-200">
                    {biz.categoryName}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                  {biz.city && (
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {biz.city}</span>
                  )}
                  {biz.phone && (
                    <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {biz.phone}</span>
                  )}
                  {reviews.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      {avgRating.toFixed(1)} ({reviews.length})
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setShareOpen(true)}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Paylaş
                </button>
                <button onClick={toggleFavorite}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-all flex items-center gap-2"
                  style={{ color: favoriteIds.includes(id) ? '#ef4444' : undefined, borderColor: favoriteIds.includes(id) ? 'rgba(239,68,68,0.3)' : undefined }}>
                  <Heart className="h-4 w-4" fill={favoriteIds.includes(id) ? '#ef4444' : 'none'} /> Favori
                </button>
                <button
                  onClick={() => setRandevuOpen(true)}
                  className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold text-black shadow-lg hover:bg-brand-600 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  <CalendarCheck className="h-4 w-4" /> Randevu Al
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {biz.description && (
                <section className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Hakkında</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">{biz.description}</p>
                </section>
              )}

              {biz.services.length > 0 && (
                <section className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Hizmetler</h2>
                  <div className="divide-y divide-gray-100">
                    {biz.services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                          {s.description && (
                            <p className="text-xs text-gray-500 mt-0.5">{s.description}</p>
                          )}
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400 mt-1">
                            <Clock className="h-3 w-3" /> {s.durationMinutes} dk
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900 shrink-0 ml-4">
                          ₺{s.price.toLocaleString('tr-TR')}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {biz.employees.length > 0 && (
                <section className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">Çalışanlar</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {biz.employees.map((e) => (
                      <div key={e.id} className="flex items-center gap-3 rounded-xl border-2 border-gray-100 bg-gray-50/50 p-3">
                        {e.avatarUrl ? (
                          <img src={e.avatarUrl} alt={e.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-500 text-sm font-bold text-black">
                            {e.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{e.name}</p>
                          {e.title && <p className="text-xs text-gray-500">{e.title}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">İletişim Bilgileri</h2>
                <div className="space-y-4">
                  {biz.address && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                        <MapPin className="h-4 w-4 text-brand-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Adres</p>
                        <p className="text-gray-500">{biz.address}</p>
                      </div>
                    </div>
                  )}
                  {biz.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                        <Phone className="h-4 w-4 text-brand-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Telefon</p>
                        <p className="text-gray-500">{biz.phone}</p>
                      </div>
                    </div>
                  )}
                  {biz.website && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 shrink-0">
                        <Globe className="h-4 w-4 text-brand-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Web Sitesi</p>
                        <a href={`https://${biz.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                          className="text-brand-500 hover:underline">{biz.website}</a>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <section className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Değerlendirmeler</h2>

                {reviewsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex items-center gap-0.5">
                        <Stars rating={Math.round(avgRating)} size="md" />
                      </div>
                      <span className="text-lg font-bold text-gray-900">{avgRating.toFixed(1)}</span>
                      <span className="text-sm text-gray-400">({reviews.length} değerlendirme)</span>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                      {reviews.map((r) => (
                        <div key={r.id} className="py-3.5 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-900">{r.authorName}</span>
                            <span className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('tr-TR')}</span>
                          </div>
                          <Stars rating={r.rating} />
                          {r.comment && <p className="mt-1 text-sm text-gray-600">{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-6">Henüz değerlendirme yapılmamış.</p>
                )}

                <div className="border-t border-gray-100 pt-5">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Değerlendirme Yap</h3>
                  <div className="space-y-3">
                    <input type="text" placeholder="Adınız" aria-label="Adınız" value={authorName} onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors" />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 mr-2">Puan:</span>
                      {[1,2,3,4,5].map((s) => (
                        <button key={s} type="button" onClick={() => setRating(s)} aria-label={`${s} yıldız`} aria-pressed={s === rating}>
                          <Star className={`h-6 w-6 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} hover:fill-yellow-400 hover:text-yellow-400 transition-colors`} />
                        </button>
                      ))}
                    </div>
                    <textarea placeholder="Yorumunuz (isteğe bağlı)" aria-label="Yorumunuz" value={comment} onChange={(e) => setComment(e.target.value)}
                      className="w-full rounded-lg border-2 border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-colors resize-none" rows={3} />
                    <button disabled={submitting || !authorName.trim() || rating === 0}
                      onClick={async () => {
                        setSubmitting(true)
                        try {
                          const res = await fetch('/api/v1/reviews', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ businessId: id, authorName: authorName.trim(), rating, comment: comment.trim() || null }),
                          })
                          if (!res.ok) throw new Error()
                          const newReview = await res.json()
                          setReviews((prev) => [newReview, ...prev])
                          setAuthorName('')
                          setRating(0)
                          setComment('')
                        } catch {
                          alert('Değerlendirme gönderilirken bir hata oluştu.')
                        } finally {
                          setSubmitting(false)
                        }
                      }}
                      className="rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitting ? 'Gönderiliyor...' : 'Gönder'}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              <div className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-violet-50 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Randevu Alın</h3>
                <p className="text-xs text-gray-600 mb-4">Hemen randevu oluşturun, işletme sizinle iletişime geçsin.</p>
                {biz.services.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {biz.services.slice(0, 4).map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2 text-xs">
                        <span className="font-medium text-gray-700">{s.name}</span>
                        <span className="text-brand-600 font-semibold">₺{s.price.toLocaleString('tr-TR')}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => setRandevuOpen(true)}
                  className="w-full rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-bold text-black hover:bg-brand-600 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  <CalendarCheck className="h-4 w-4" /> Randevu Al
                </button>
              </div>

              <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Hizmet Özeti</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Hizmet Sayısı</span>
                    <span className="text-sm font-bold text-gray-900">{biz.services.length}</span>
                  </div>
                  <div className="h-px bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Çalışan Sayısı</span>
                    <span className="text-sm font-bold text-gray-900">{biz.employees.length}</span>
                  </div>
                  {biz.services.length > 0 && (
                    <>
                      <div className="h-px bg-gray-100" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Başlangıç Fiyat</span>
                        <span className="text-sm font-bold text-gray-900">₺{Math.min(...biz.services.map(s => s.price)).toLocaleString('tr-TR')}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Konum</h3>
                {biz.latitude && biz.longitude ? (
                  <div className="rounded-xl overflow-hidden h-48">
                    <MapContainer
                      center={[biz.latitude, biz.longitude]}
                      zoom={15}
                      scrollWheelZoom={false}
                      className="h-full w-full"
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={[biz.latitude, biz.longitude]}>
                        <Popup>{biz.name}</Popup>
                      </Marker>
                    </MapContainer>
                  </div>
                ) : (
                  <div className="rounded-xl bg-gray-100 h-48 flex items-center justify-center text-gray-600 text-xs">
                    <MapPin className="h-5 w-5 mr-1" /> Konum belirtilmemiş
                  </div>
                )}
                {biz.address && <p className="text-xs text-gray-500 mt-2">{biz.address}</p>}
              </div>

              {biz.workingHours && (() => {
                let hours: { open: boolean; start: string; end: string }[] = []
                try { hours = JSON.parse(biz.workingHours) } catch { return null }
                if (!Array.isArray(hours) || hours.length === 0) return null
                const today = new Date().getDay()
                const todayIdx = today === 0 ? 6 : today - 1
                const todayHours = hours[todayIdx]
                return (
                  <div className="rounded-2xl border-2 border-gray-100 bg-gray-50 p-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-3">Çalışma Saatleri</h3>
                    <div className="space-y-2">
                      {DAYS_TR.map((day, i) => {
                        const h = hours[i]
                        if (!h) return null
                        const isToday = i === todayIdx
                        return (
                          <div key={day} className={`flex items-center justify-between text-xs py-1.5 px-2 rounded-lg ${isToday ? 'bg-brand-50 font-semibold' : ''}`}>
                            <span className={isToday ? 'text-brand-600' : 'text-gray-600'}>{day}</span>
                            {h.open ? (
                              <span className={isToday ? 'text-brand-700' : 'text-gray-900'}>{h.start} – {h.end}</span>
                            ) : (
                              <span className="text-gray-400">Kapalı</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
      <RandevuModal open={randevuOpen} onClose={() => setRandevuOpen(false)} businessName={biz.name} businessId={biz.id} services={biz.services} />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} url={typeof window !== 'undefined' ? window.location.href : ''} title={biz.name} />

      {selectedImage !== null && biz.galleryImages[selectedImage] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setSelectedImage(null)}>
          <button aria-label="Kapat" className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl" onClick={() => setSelectedImage(null)}>✕</button>
          <div className="flex items-center gap-4 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {selectedImage > 0 && (
              <button onClick={() => setSelectedImage(selectedImage - 1)} aria-label="Önceki fotoğraf"
                      className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
                <ChevronRight className="h-6 w-6 rotate-180" />
              </button>
            )}
            <img src={biz.galleryImages[selectedImage]} alt={`${biz.name} galeri fotoğrafı ${selectedImage + 1}`} className="max-h-[80vh] w-full rounded-2xl object-contain" />
            {selectedImage < biz.galleryImages.length - 1 && (
              <button onClick={() => setSelectedImage(selectedImage + 1)} aria-label="Sonraki fotoğraf"
                      className="shrink-0 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors">
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
          <div className="absolute bottom-4 text-white/60 text-xs">
            {selectedImage + 1} / {biz.galleryImages.length}
          </div>
        </div>
      )}
    </>
  )
}
