'use client'

import Link from 'next/link'
import { ArrowLeft, Package, CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'


const PACKAGE_LIST = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Başlangıç',
    description: 'Temel operasyonları hızlıca başlatın.',
    price: '₺299 / ay',
    features: [
      'Temel randevu, takvim ve müşteri yönetimi',
      'Ödeme takibi ve temel raporlar',
      'Formlar ve paket satışı',
      'Tek şube ile hızlı başlangıç',
    ],
    accentClass: 'border-slate-200 bg-slate-50',
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'Büyüme',
    description: 'Pazarlama akışlarını ve çoklu şube operasyonlarını yönetin.',
    price: '₺599 / ay',
    features: [
      'Kampanya, kupon ve indirim yönetimi',
      'Online rezervasyon ve bekleme listesi',
      'Sadakat programı ve yorum toplama',
      'Çoklu Şube Yönetimi',
    ],
    accentClass: 'border-cyan-200 bg-cyan-50',
    popular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    badge: 'Otomasyon',
    description: 'Stok, finans ve ekip performansını tek yerden yönetin.',
    price: '₺999 / ay',
    features: [
      'Ürün satışı ve stok yönetimi',
      'Cari alacak ve taksit takibi',
      'Personel performans takibi',
      'Prim, hak ediş, borç ve ödeme takibi',
    ],
    accentClass: 'border-blue-200 bg-blue-50',
  },
  {
    id: 'custom',
    name: 'Custom',
    badge: 'Kurumsal',
    description: 'Kuruma özel kurgu, özel akışlar ve genişleme paketi.',
    price: 'Özel fiyat',
    features: [
      'Tüm Professional özellikleri',
      'Canlı chatbot ve walk-in sıra yönetimi',
      'Özel entegrasyon ve onboarding',
      'Kuruma özel modül kurgusu ve destek',
    ],
    accentClass: 'border-amber-200 bg-amber-50',
  },
];

export default function PaketPage() {
  const [activePackageId, setActivePackageId] = useState<string | null>(null)
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    axios.get('/api/v1/Business/me')
      .then((businessRes: any) => {
        const plan = businessRes.data.plan || null
        setActivePackageId(plan)
        setSubscriptionEnd(businessRes.data.subscriptionEndsAt || null)
      })
      .catch(() => setError('Paket bilgileri alınamadı.'))
      .finally(() => setLoading(false))
  }, [])

  function getRemainingInfo(endsAt: string | null) {
    if (!endsAt) return null
    const end = new Date(endsAt)
    const now = new Date()
    if (end <= now) return { label: 'Süresi doldu', cls: 'text-red-500' }
    const diffMs = end.getTime() - now.getTime()
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const months = Math.floor(totalDays / 30)
    const days = totalDays % 30
    if (months > 0) return { label: `${months} ay ${days} gün kaldı`, cls: 'text-green-600' }
    return { label: `${days} gün kaldı`, cls: 'text-amber-600' }
  }

  const remaining = getRemainingInfo(subscriptionEnd)

  if (loading) return <div className="max-w-3xl mx-auto py-12 text-center text-gray-500">Yükleniyor...</div>;
  if (error)   return <div className="max-w-3xl mx-auto py-12 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/panel" aria-label="Panele dön" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Paket Bilgisi</h1>
      </div>

      {/* Aktif paket */}
      {activePackageId && (
        <div className="rounded-2xl bg-white border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
              <Package className="h-5 w-5 text-brand-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Aktif Paket</p>
              <p className="font-bold text-gray-900 text-lg">{PACKAGE_LIST.find(p => p.id === activePackageId)?.name || '-'}</p>
              {(() => { const p = PACKAGE_LIST.find(p => p.id === activePackageId); return p?.badge ? <p className="text-xs text-gray-400">{p.badge}</p> : null })()}
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full font-medium">
              <CheckCircle2 className="h-3 w-3" /> Aktif
            </span>
          </div>

          {remaining && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-400">Kalan Süre</p>
                <p className={`font-semibold mt-0.5 ${remaining.cls}`}>{remaining.label}</p>
              </div>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-400">Bir Sonraki Ödeme</p>
                <p className="font-semibold text-gray-900 mt-0.5">
                  {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                </p>
              </div>
            </div>
          )}

          <p className="text-gray-500 text-sm">{PACKAGE_LIST.find(p => p.id === activePackageId)?.description}</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm list-disc list-inside pl-2">
            {PACKAGE_LIST.find(p => p.id === activePackageId)?.features.map((f) => (
              <li key={f} className="text-gray-700">{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
