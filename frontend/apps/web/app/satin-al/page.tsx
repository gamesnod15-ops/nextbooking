'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, ArrowLeft, Loader2, Shield, CreditCard, Lock } from 'lucide-react'
import axios from '@/lib/axios'

const PACKAGES: Record<string, Record<string, { price: number; features: string[]; label: string }>> = {
  ad: {
    Temel:     { price: 1999, label: 'Temel',     features: ['Ana sayfa listeleme', 'Kategori sayfasında öne çıkarma', '10.000 aylık gösterim', 'Temel raporlama'] },
    Standart:  { price: 4999, label: 'Standart',  features: ['Ana sayfa listeleme', 'Kategori sayfasında öne çıkarma', '50.000 aylık gösterim', 'Gelişmiş raporlama', 'Öncelikli destek'] },
    Premium:   { price: 9999, label: 'Premium',   features: ['Ana sayfa listeleme', 'Kategori sayfasında öne çıkarma', 'Sınırsız gösterim', 'Özel raporlama', '7/24 destek'] },
  },
  sponsored: {
    Gumus:     { price: 799,  label: 'Gümüş',     features: ['Kategori sayfasında öne çıkma', 'Sponsorlu etiketi', '5.000 aylık gösterim', 'Temel istatistikler'] },
    Altin:     { price: 1999, label: 'Altın',     features: ['Kategori sayfasında öne çıkma', 'Sponsorlu etiketi', '20.000 aylık gösterim', 'Gelişmiş istatistikler', 'Ana sayfada listeleme'] },
    Platin:    { price: 4999, label: 'Platin',    features: ['Kategori sayfasında öne çıkma', 'Sponsorlu etiketi', 'Sınırsız gösterim', 'Özel raporlama', 'Ana sayfada listeleme', '7/24 destek'] },
  },
}

const TYPE_LABELS: Record<string, string> = { ad: 'Reklamveren', sponsored: 'Sponsorlu Öne Çıkan' }

function CheckoutForm() {
  const router = useRouter()
  const sp = useSearchParams()
  const type = sp.get('type') || ''
  const plan = sp.get('plan') || ''
  const pkg = PACKAGES[type]?.[plan]

  const [token, setToken] = useState<string | null>(null)
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('accessToken')
    setToken(t)
    if (!t) router.replace(`/login?redirect=${encodeURIComponent(`/satin-al?type=${type}&plan=${plan}`)}`)
  }, [])

  if (!type || !pkg) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-gray-500">Geçersiz paket bilgisi.</p>
        <Link href="/" className="text-brand-500 hover:underline mt-4 inline-block">Ana Sayfa</Link>
      </div>
    )
  }

  if (!token) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cardName.trim() || cardNumber.replace(/\s/g, '').length < 16 || !cardExpiry || !cardCvc) {
      setError('Lütfen tüm kart bilgilerini eksiksiz doldurun.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await axios.post('/api/v1/product-purchases', {
        productType: type === 'ad' ? 'Ad' : 'Sponsored',
        planName: pkg.label,
        amount: pkg.price,
        customerName: cardName.trim(),
      })
      if (res.status === 200) setSuccess(true)
    } catch (err: any) {
      setError(err?.response?.data?.title || 'Ödeme sırasında bir hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-5">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Satın Alma Başarılı!</h2>
        <p className="text-gray-500 mb-6">{TYPE_LABELS[type]} - {pkg.label} paketiniz aktif edildi.</p>
        <Link href="/panel/siparisler" className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-black hover:bg-brand-600 transition-colors">
          Siparişlerime Git
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/${type === 'ad' ? 'reklamveren' : 'sponsorlu'}`} aria-label="Geri dön" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Satın Al</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-2xl border border-gray-100 bg-white p-6">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-brand-500" /> Kart Bilgileri
            </h2>
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Bu bölüm test aşamasındadır. Gerçek kart bilgisi girmenize gerek yok — herhangi bir kart numarası, isim ve güvenlik kodu (CVC) kullanabilirsiniz.
            </p>
            <div className="space-y-4">
              <div>
                <label htmlFor="satinal-cardname" className="mb-1 block text-xs font-medium text-gray-600">Kart Üzerindeki İsim</label>
                <input id="satinal-cardname" value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Ad Soyad"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
              </div>
              <div>
                <label htmlFor="satinal-cardnumber" className="mb-1 block text-xs font-medium text-gray-600">Kart Numarası</label>
                <input id="satinal-cardnumber" value={cardNumber} onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim())} placeholder="0000 0000 0000 0000" maxLength={19}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="satinal-expiry" className="mb-1 block text-xs font-medium text-gray-600">Son Kullanma</label>
                  <input id="satinal-expiry" value={cardExpiry} onChange={e => { const v = e.target.value.replace(/\D/g, ''); setCardExpiry(v.length > 2 ? v.slice(0,2) + '/' + v.slice(2,4) : v) }} placeholder="AA/YY" maxLength={5}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label htmlFor="satinal-cvc" className="mb-1 block text-xs font-medium text-gray-600">CVC</label>
                  <input id="satinal-cvc" value={cardCvc} onChange={e => setCardCvc(e.target.value.replace(/\D/g, '').slice(0,4))} placeholder="000" maxLength={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Lock className="h-3 w-3" /> Ödeme bilgileriniz 256-bit SSL ile şifrelenir.
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-black hover:bg-brand-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> İşleniyor...</> : `₺${pkg.price.toLocaleString('tr-TR')} Öde`}
          </button>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{TYPE_LABELS[type]}</p>
            <h3 className="text-xl font-extrabold text-gray-900 mb-1">{pkg.label}</h3>
            <p className="text-3xl font-extrabold text-gray-900 mb-4">₺{pkg.price.toLocaleString('tr-TR')}<span className="text-sm font-normal text-gray-400">/ay</span></p>
            <ul className="space-y-2">
              {pkg.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                  <Check className="h-3.5 w-3.5 text-brand-500 mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex items-center gap-3">
            <Shield className="h-8 w-8 text-brand-500" />
            <p className="text-xs text-gray-600">14 gün içinde memnun kalmazsanız paranız iade edilir.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SatinAlPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <Suspense fallback={<div className="text-center py-20 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}>
        <CheckoutForm />
      </Suspense>
    </main>
  )
}
