'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarCheck, CreditCard, MapPin, Lock, ArrowRight, CheckCircle, ChevronDown, ChevronUp, Sparkles, X } from 'lucide-react'
import axios from '@/lib/axios'

interface PlanMeta { id: string; name: string; price: string; period: string; color: string; monthlyPrice: number }

const PLAN_META: Record<string, PlanMeta> = {
  starter:      { id: 'starter',      name: 'Starter',      price: '\u20BA299', period: '/ay', color: 'bg-slate-600', monthlyPrice: 299 },
  business:     { id: 'business',     name: 'Business',     price: '\u20BA599', period: '/ay', color: 'bg-brand-500', monthlyPrice: 599 },
  professional: { id: 'professional', name: 'Professional', price: '\u20BA999', period: '/ay', color: 'bg-blue-600', monthlyPrice: 999 },
  custom:       { id: 'custom',       name: 'Custom',       price: 'Özel', period: ' fiyat', color: 'bg-amber-500', monthlyPrice: 0 },
}

const DURATIONS = [
  { months: 1,  label: '1 Ay',  discount: 0  },
  { months: 6,  label: '6 Ay',  discount: 0  },
  { months: 12, label: '12 Ay', discount: 5  },
  { months: 24, label: '24 Ay', discount: 10 },
  { months: 36, label: '36 Ay', discount: 15 },
] as const

interface SavedCard {
  id: string
  brand: string
  lastFour: string
  expiry: string
  cardHolder: string
  default: boolean
}

function formatCardNum(v: string) {
  return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}
function formatExp(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d
}
function detectBrand(num: string) {
  const c = num.replace(/\s/g, '')
  if (/^4/.test(c)) return 'Visa'
  if (/^5[1-5]/.test(c) || /^2(?:2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(c)) return 'Mastercard'
  return ''
}
const BRAND_CLS: Record<string, string> = { Visa: 'bg-blue-600', Mastercard: 'bg-red-600' }

interface BillingInfo {
  fullName: string
  company: string
  taxId: string
  address: string
  city: string
  zip: string
  country: string
}

const BILLING_STORAGE_KEY = 'billingInfo'

function loadBilling(): BillingInfo | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(BILLING_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveBilling(info: BillingInfo) {
  if (typeof window === 'undefined') return
  localStorage.setItem(BILLING_STORAGE_KEY, JSON.stringify(info))
}

const EMPTY_BILLING: BillingInfo = {
  fullName: '', company: '', taxId: '', address: '', city: '', zip: '', country: 'Türkiye',
}

function inputCls(err?: boolean) {
  return [
    'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors',
    err
      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-gray-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
  ].join(' ')
}

/* ¦¦¦ Inner component that reads searchParams ¦¦¦ */
function OdemeInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get('plan') ?? 'starter'
  const plan = PLAN_META[planId] ?? PLAN_META['starter']

  const [existingBilling, setExistingBilling] = useState<BillingInfo | null>(null)
  const [mode, setMode] = useState<'loading' | 'form' | 'cart'>('loading')
  const [billing, setBilling] = useState<BillingInfo>(EMPTY_BILLING)
  const [billingErrors, setBillingErrors] = useState<Partial<Record<keyof BillingInfo, string>>>({})
  const [editMode, setEditMode] = useState(false)

  // Payment form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvv, setCvv] = useState('')
  const [payErrors, setPayErrors] = useState<Record<string, string>>({})
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  const [duration, setDuration] = useState(1)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [showNewCardForm, setShowNewCardForm] = useState(false)

  function getDurationOpt() {
    return DURATIONS.find(d => d.months === duration) ?? DURATIONS[0]
  }
  function getSubtotal() {
    return plan.monthlyPrice * duration
  }
  function getDiscount() {
    return Math.round(getSubtotal() * getDurationOpt().discount / 100)
  }
  function getTotal() {
    return getSubtotal() - getDiscount()
  }
  function getVat() {
    return Math.round(getTotal() * 0.20)
  }
  function getGrandTotal() {
    return getTotal() + getVat()
  }

  useEffect(() => {
    async function load() {
      const token = localStorage.getItem('accessToken')

      if (token) {
        try {
          const [bizRes, cardsRes] = await Promise.all([
            axios.get('/api/v1/Business/me'),
            axios.get('/api/v1/Payments/cards'),
          ])
          const data = bizRes.data
          const stored = loadBilling()
          if (stored) {
            setBilling(stored)
            setExistingBilling(stored)
          } else {
            const info: BillingInfo = {
              fullName: data.billingContactName || data.name || '',
              company: data.companyName || data.name || '',
              taxId: data.taxNumber || '',
              address: data.address || '',
              city: data.city || '',
              zip: data.postalCode || '',
              country: data.country || 'Türkiye',
            }
            if (info.fullName) {
              setBilling(info)
              setExistingBilling(info)
              saveBilling(info)
            }
          }

          const cards: SavedCard[] = cardsRes.data || []
          setSavedCards(cards)
          const defaultCard = cards.find((c: SavedCard) => c.default) || cards[0]
          if (defaultCard) setSelectedCardId(defaultCard.id)
          if (cards.length > 0) setShowNewCardForm(false)
        } catch {
          // API failed, try localStorage billing fallback
          const stored = loadBilling()
          if (stored) {
            setBilling(stored)
            setExistingBilling(stored)
          }
        }
      } else {
        const stored = loadBilling()
        if (stored) {
          setBilling(stored)
          setExistingBilling(stored)
        }
      }

      setMode('cart')
    }
    load()
  }, [])

  function validateBilling(): boolean {
    const errs: typeof billingErrors = {}
    if (!billing.fullName.trim()) errs.fullName = 'Ad soyad gereklidir.'
    if (!billing.address.trim()) errs.address = 'Adres gereklidir.'
    if (!billing.city.trim()) errs.city = 'Şehir gereklidir.'
    setBillingErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleBillingSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validateBilling()) return
    saveBilling(billing)
    setExistingBilling(billing)
    setEditMode(false)
    setMode('cart')
  }

  function validatePayment(): boolean {
    const errs: Record<string, string> = {}
    const usingSaved = savedCards.length > 0 && !showNewCardForm && selectedCardId
    if (!usingSaved) {
      if (cardNumber.replace(/\s/g, '').length < 16) errs.cardNumber = 'Geçerli bir kart numarası girin.'
      if (!cardName.trim()) errs.cardName = 'Kart üzerindeki isim gereklidir.'
      if (expiry.length < 5) errs.expiry = 'Geçerli bir son kullanma tarihi girin.'
    }
    if (cvv.length < 3) errs.cvv = 'CVV en az 3 haneli olmalıdır.'
    setPayErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!validatePayment()) return
    setPaying(true)
    setPayErrors({})

    try {
      // 1. Save card if new card form is active
      if (savedCards.length === 0 || showNewCardForm) {
        const brand = detectBrand(cardNumber)
        await axios.post('/api/v1/Payments/cards', {
          cardHolder: cardName,
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiry,
          cvv,
          brand,
        })
      }

      // 2. Update the plan on the tenant
      await axios.patch('/api/v1/Business/me/plan', { plan: planId, months: duration })

      // 3. Create an order (receivable) record
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 1)
      await axios.post('/api/v1/Receivables', {
        customerName: billing.fullName || 'Müşteri',
        totalAmount: getGrandTotal(),
        dueDate: dueDate.toISOString().split('T')[0],
        installmentCount: 1,
        description: `${plan.name} Plan - ${getDurationOpt().label} (${plan.monthlyPrice}\u20BA/ay \u00D7 ${duration} ay)`,
      })

      // 4. Save billing info to business profile
      const { data: current } = await axios.get('/api/v1/Business/me')
      await axios.put('/api/v1/Business/me', {
        name: current.name,
        phone: current.phone ?? null,
        email: current.email ?? null,
        address: billing.address || current.address,
        city: billing.city || current.city,
        postalCode: billing.zip || current.postalCode,
        country: billing.country || current.country,
        taxNumber: billing.taxId || current.taxNumber,
        taxOffice: current.taxOffice ?? null,
        website: current.website ?? null,
        description: current.description ?? null,
        settings: current.settings ?? null,
      })

      setPaying(false)

      const returnUrl = localStorage.getItem('panelReturnUrl')
      if (returnUrl) {
        localStorage.removeItem('panelReturnUrl')
        localStorage.removeItem('selectedPlan')
        localStorage.removeItem('billingInfo')
        router.push(returnUrl)
        return
      }

      setPaid(true)
    } catch (err: any) {
      setPaying(false)

      // Try to parse structured validation errors from FluentValidation
      const errs = err?.response?.data?.errors
      if (errs && typeof errs === 'object') {
        const parsed: Record<string, string> = {}
        for (const [field, messages] of Object.entries(errs)) {
          const arr = messages as string[]
          if (arr.length > 0) {
            const key = field === 'CardNumber' || field === 'Kart numarası' ? 'cardNumber'
              : field === 'CardHolder' || field === 'Kart sahibi' ? 'cardName'
              : field === 'Expiry' || field === 'Son kullanma tarihi' ? 'expiry'
              : field === 'Cvv' || field === 'CVV' ? 'cvv'
              : field === 'Brand' || field === 'Kart markası' ? 'cardNumber'
              : 'cardNumber'
            parsed[key] = arr[0]
          }
        }
        setPayErrors(parsed)
      } else {
        const msg = err?.response?.data?.message || err?.response?.data?.detail || err?.message || 'Ödeme işlenirken bir hata oluştu.'
        setPayErrors({ cardNumber: msg })
      }
    }
  }

  if (mode === 'loading') return null

  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Ödeme Başarılı!</h2>
          <p className="mt-3 text-gray-600">
            <span className="font-semibold">{plan.name}</span> planınız aktif edildi. Panel'e yönlendiriliyorsunuz…
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-black hover:bg-brand-600 transition-colors">
              Panele Git <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/20">
      {/* Header */}
      <header className="border-b border-white/60 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <CalendarCheck className="h-4 w-4 text-black" />
            </div>
            <span className="text-base font-bold text-gray-900">NextBooking</span>
          </Link>
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✓</span>
            <span className="text-gray-400">Hesap</span>
            <span className="text-gray-300">›</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">✓</span>
            <span className="text-gray-400">Paket</span>
            <span className="text-gray-300">›</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-black text-xs font-bold">3</span>
            <span className="font-semibold text-gray-800">Ödeme</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-500 mb-1">Adım 3/3</p>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {mode === 'form' ? 'Fatura Bilgilerinizi Girin' : 'Siparişinizi Tamamlayın'}
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">

          {/* ¦¦ Left: billing form OR cart ¦¦ */}
          <div className="space-y-6">

            {/* Billing info section */}
            {mode === 'form' ? (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900">
                  <MapPin className="h-4 w-4 text-brand-500" /> Fatura Adresi
                </h2>
                <form id="billing-form" onSubmit={handleBillingSubmit} noValidate className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label htmlFor="billing-fullname" className="mb-1.5 block text-sm font-medium text-gray-700">Ad Soyad *</label>
                      <input id="billing-fullname" value={billing.fullName} onChange={e => setBilling(p => ({ ...p, fullName: e.target.value }))}
                        placeholder="Ahmet Yılmaz" className={inputCls(!!billingErrors.fullName)} />
                      {billingErrors.fullName && <p className="mt-1 text-xs text-red-500">{billingErrors.fullName}</p>}
                    </div>
                    <div>
                      <label htmlFor="billing-company" className="mb-1.5 block text-sm font-medium text-gray-700">Şirket Adı</label>
                      <input id="billing-company" value={billing.company} onChange={e => setBilling(p => ({ ...p, company: e.target.value }))}
                        placeholder="Yılmaz Kuaför Ltd." className={inputCls()} />
                    </div>
                    <div>
                      <label htmlFor="billing-taxid" className="mb-1.5 block text-sm font-medium text-gray-700">Vergi No</label>
                      <input id="billing-taxid" value={billing.taxId} onChange={e => setBilling(p => ({ ...p, taxId: e.target.value }))}
                        placeholder="1234567890" className={inputCls()} />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="billing-address" className="mb-1.5 block text-sm font-medium text-gray-700">Adres *</label>
                      <input id="billing-address" value={billing.address} onChange={e => setBilling(p => ({ ...p, address: e.target.value }))}
                        placeholder="Bağdat Cad. No:1, Kadıköy" className={inputCls(!!billingErrors.address)} />
                      {billingErrors.address && <p className="mt-1 text-xs text-red-500">{billingErrors.address}</p>}
                    </div>
                    <div>
                      <label htmlFor="billing-city" className="mb-1.5 block text-sm font-medium text-gray-700">Şehir *</label>
                      <input id="billing-city" value={billing.city} onChange={e => setBilling(p => ({ ...p, city: e.target.value }))}
                        placeholder="İstanbul" className={inputCls(!!billingErrors.city)} />
                      {billingErrors.city && <p className="mt-1 text-xs text-red-500">{billingErrors.city}</p>}
                    </div>
                    <div>
                      <label htmlFor="billing-zip" className="mb-1.5 block text-sm font-medium text-gray-700">Posta Kodu</label>
                      <input id="billing-zip" value={billing.zip} onChange={e => setBilling(p => ({ ...p, zip: e.target.value }))}
                        placeholder="34000" className={inputCls()} />
                    </div>
                    <div className="col-span-2">
                      <label htmlFor="billing-country" className="mb-1.5 block text-sm font-medium text-gray-700">Ülke</label>
                      <select id="billing-country" value={billing.country} onChange={e => setBilling(p => ({ ...p, country: e.target.value }))}
                        className={inputCls()}>
                        <option value="Türkiye">Türkiye</option>
                        <option value="Almanya">Almanya</option>
                        <option value="Hollanda">Hollanda</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-black hover:bg-brand-600 transition-colors">
                    Bilgileri Kaydet & Devam Et <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </section>
            ) : (
              <>
                {/* Billing summary card */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                      <MapPin className="h-4 w-4 text-brand-500" /> Fatura Adresi
                    </h2>
                    <button type="button" onClick={() => setEditMode(!editMode)}
                      className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600 font-medium">
                      {editMode ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      {editMode ? 'Kapat' : 'Düzenle'}
                    </button>
                  </div>

                  {!editMode ? (
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="font-semibold">{billing.fullName}</p>
                      {billing.company && <p className="text-gray-500">{billing.company}</p>}
                      <p>{billing.address}</p>
                      <p>{billing.city}{billing.zip ? ` / ${billing.zip}` : ''} — {billing.country}</p>
                      {billing.taxId && <p className="text-gray-500">Vergi No: {billing.taxId}</p>}
                    </div>
                  ) : (
                    <form onSubmit={handleBillingSubmit} noValidate className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <label htmlFor="billing-edit-fullname" className="mb-1.5 block text-sm font-medium text-gray-700">Ad Soyad *</label>
                          <input id="billing-edit-fullname" value={billing.fullName} onChange={e => setBilling(p => ({ ...p, fullName: e.target.value }))}
                            className={inputCls(!!billingErrors.fullName)} />
                          {billingErrors.fullName && <p className="mt-1 text-xs text-red-500">{billingErrors.fullName}</p>}
                        </div>
                        <div>
                          <label htmlFor="billing-edit-company" className="mb-1.5 block text-sm font-medium text-gray-700">Şirket</label>
                          <input id="billing-edit-company" value={billing.company} onChange={e => setBilling(p => ({ ...p, company: e.target.value }))}
                            className={inputCls()} />
                        </div>
                        <div>
                          <label htmlFor="billing-edit-taxid" className="mb-1.5 block text-sm font-medium text-gray-700">Vergi No</label>
                          <input id="billing-edit-taxid" value={billing.taxId} onChange={e => setBilling(p => ({ ...p, taxId: e.target.value }))}
                            className={inputCls()} />
                        </div>
                        <div className="col-span-2">
                          <label htmlFor="billing-edit-address" className="mb-1.5 block text-sm font-medium text-gray-700">Adres *</label>
                          <input id="billing-edit-address" value={billing.address} onChange={e => setBilling(p => ({ ...p, address: e.target.value }))}
                            className={inputCls(!!billingErrors.address)} />
                        </div>
                        <div>
                          <label htmlFor="billing-edit-city" className="mb-1.5 block text-sm font-medium text-gray-700">Şehir *</label>
                          <input id="billing-edit-city" value={billing.city} onChange={e => setBilling(p => ({ ...p, city: e.target.value }))}
                            className={inputCls(!!billingErrors.city)} />
                        </div>
                        <div>
                          <label htmlFor="billing-edit-zip" className="mb-1.5 block text-sm font-medium text-gray-700">Posta Kodu</label>
                          <input id="billing-edit-zip" value={billing.zip} onChange={e => setBilling(p => ({ ...p, zip: e.target.value }))}
                            className={inputCls()} />
                        </div>
                      </div>
                      <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-bold text-black hover:bg-brand-600 transition-colors">
                        Bilgileri Güncelle
                      </button>
                    </form>
                  )}
                </section>

                {/* Payment method */}
                <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900">
                    <CreditCard className="h-4 w-4 text-brand-500" /> Ödeme Yöntemi
                  </h2>

                  {/* Saved cards */}
                  {savedCards.length > 0 && !showNewCardForm && (
                    <div className="mb-5 space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Kayıtlı Kartlar</p>
                      {savedCards.map(card => {
                        const selected = selectedCardId === card.id
                        return (
                          <button key={card.id} type="button" onClick={() => { setSelectedCardId(card.id); setShowNewCardForm(false) }}
                            className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                              selected ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-gray-200 hover:border-gray-300'
                            }`}>
                            <div className={`flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-white text-xs font-bold ${BRAND_CLS[card.brand] ?? 'bg-gray-700'}`}>
                              {card.brand}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">**** **** **** {card.lastFour}</p>
                              <p className="text-xs text-gray-400">Son Kullanma: {card.expiry}</p>
                            </div>
                            {card.default && <span className="shrink-0 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Varsayılan</span>}
                            <div className={`h-4 w-4 shrink-0 rounded-full border-2 ${selected ? 'border-brand-500 bg-brand-500' : 'border-gray-300'} flex items-center justify-center`}>
                              {selected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </div>
                          </button>
                        )
                      })}
                      <button type="button" onClick={() => { setShowNewCardForm(true); setSelectedCardId(null) }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-500 hover:border-brand-500 hover:text-brand-500 transition-colors">
                        <Sparkles className="h-4 w-4" /> Yeni Kart Ekle
                      </button>
                    </div>
                  )}

                  {(savedCards.length === 0 || showNewCardForm) && (
                    <div className="mb-5 flex justify-center">
                      <div className="w-[390px] max-w-full rounded-xl bg-gradient-to-br from-yellow-600 to-red-600 px-4 pt-4 pb-3 text-white shadow-md select-none">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-1">
                            <div className="w-7 h-5 rounded bg-yellow-400/90" />
                            <div className="w-7 h-5 rounded bg-red-500/60" />
                          </div>
                          <p className="text-[11px] font-bold tracking-wider">DEBIT CARD</p>
                        </div>
                        <p className="text-lg tracking-[3px] font-mono mb-6 text-left">
                          {cardNumber.replace(/\s/g, '')
                            ? ('•'.repeat(Math.max(0, cardNumber.replace(/\s/g, '').length - 4)) + cardNumber.replace(/\s/g, '').slice(-4))
                                .replace(/(.{4})/g, '$1 ').trim()
                            : '••••  ••••  ••••  ••••'}
                        </p>
                        <div className="flex justify-between items-end">
                          <div className="min-w-0 flex-1">
                            <p className="text-[8px] opacity-70 leading-none">KART SAHİBİ</p>
                            <p className="text-xs font-medium truncate uppercase tracking-wider leading-tight">
                              {cardName || 'AD SOYAD'}
                            </p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-[8px] opacity-70 leading-none">SON KULL.</p>
                            <p className="text-xs font-mono leading-tight">{expiry || 'AA/YY'}</p>
                          </div>
                          <div className="text-right ml-3">
                            <p className="text-[8px] opacity-70 leading-none">CVV</p>
                            <p className="text-xs font-mono leading-tight">{cvv || '•••'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handlePay} noValidate className="space-y-4">
                    {/* Card form — always visible when no saved cards, or when adding new */}
                    {(savedCards.length === 0 || showNewCardForm) && (
                      <>
                        <div>
                          <label htmlFor="pay-cardname" className="mb-1.5 block text-sm font-medium text-gray-700">Kart Üzerindeki İsim</label>
                          <input id="pay-cardname" type="text" placeholder="AD SOYAD"
                            value={cardName} onChange={e => setCardName(e.target.value.toUpperCase())}
                            className={`${inputCls(!!payErrors.cardName)} tracking-[1px]`} />
                          {payErrors.cardName && <p className="mt-1 text-xs text-red-500">{payErrors.cardName}</p>}
                        </div>
                        <div>
                          <label htmlFor="pay-cardnumber" className="mb-1.5 block text-sm font-medium text-gray-700">Kart Numarası</label>
                          <input id="pay-cardnumber" type="text" inputMode="numeric" placeholder="1234 5678 9012 3456"
                            value={cardNumber} onChange={e => setCardNumber(formatCardNum(e.target.value))}
                            className={`${inputCls(!!payErrors.cardNumber)} tracking-[2px] font-mono`} />
                          {payErrors.cardNumber && <p className="mt-1 text-xs text-red-500">{payErrors.cardNumber}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="pay-expiry" className="mb-1.5 block text-sm font-medium text-gray-700">Son Kullanma</label>
                            <input id="pay-expiry" type="text" inputMode="numeric" placeholder="AA/YY"
                              value={expiry} onChange={e => setExpiry(formatExp(e.target.value))}
                              className={`${inputCls(!!payErrors.expiry)} font-mono`} />
                            {payErrors.expiry && <p className="mt-1 text-xs text-red-500">{payErrors.expiry}</p>}
                          </div>
                          <div>
                            <label htmlFor="pay-cvv" className="mb-1.5 block text-sm font-medium text-gray-700">CVV</label>
                            <input id="pay-cvv" type="password" inputMode="numeric" placeholder="•••"
                              value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              className={`${inputCls(!!payErrors.cvv)} font-mono max-w-[100px]`} />
                            {payErrors.cvv && <p className="mt-1 text-xs text-red-500">{payErrors.cvv}</p>}
                            <p className="text-[10px] text-gray-400 mt-1">3 haneli güvenlik kodu</p>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Saved card CVV field */}
                    {savedCards.length > 0 && !showNewCardForm && selectedCardId && (
                      <div>
                        <label htmlFor="pay-cvv-saved" className="mb-1.5 block text-sm font-medium text-gray-700">CVV</label>
                        <input id="pay-cvv-saved" type="password" inputMode="numeric" placeholder="•••"
                          value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                          className={`${inputCls(!!payErrors.cvv)} max-w-[100px] font-mono`} />
                        {payErrors.cvv && <p className="mt-1 text-xs text-red-500">{payErrors.cvv}</p>}
                        <p className="text-[10px] text-gray-400 mt-1">3 haneli güvenlik kodu</p>
                      </div>
                    )}

                    <button type="submit" disabled={paying}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 text-base font-bold text-black shadow-lg hover:bg-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-xl">
                      <Lock className="h-4 w-4" />
                      {paying ? 'İşleniyor…' : plan.id === 'custom' ? 'Ödeme Yap' : `\u20BA${getGrandTotal().toLocaleString('tr-TR')} Öde`}
                    </button>
                  </form>

                  <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> 256-bit SSL</span>
                    <span>·</span>
                    <span>PCI DSS uyumlu</span>
                    <span>·</span>
                    <span>İyzico güvenceli</span>
                  </div>
                </section>
              </>
            )}
          </div>

          {/* ¦¦ Right: Order summary ¦¦ */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sticky top-24">
              <h2 className="mb-4 text-base font-bold text-gray-900">Sipariş Özeti</h2>

              {/* Plan badge */}
              <div className={`rounded-xl ${plan.color} p-4 text-black mb-5`}>
                <p className="text-xs font-semibold opacity-75 uppercase tracking-widest">Seçilen Plan</p>
                <p className="mt-1 text-xl font-extrabold">{plan.name}</p>
                <p className="text-sm opacity-80">14 gün ücretsiz deneme</p>
              </div>

              {/* Duration selector */}
              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paket Süresi</p>
                <div className="flex flex-wrap gap-2">
                  {DURATIONS.map(opt => {
                    const active = duration === opt.months
                    return (
                      <button key={opt.months} type="button" onClick={() => setDuration(opt.months)}
                        className={`relative rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                          active
                            ? 'border-brand-500 bg-brand-500 text-black shadow-sm'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}>
                        {opt.label}
                        {opt.discount > 0 && (
                          <span className={`absolute -top-1.5 -right-1.5 flex h-3.5 items-center rounded-full px-1.5 text-[9px] font-bold ${
                            active ? 'bg-black text-brand-500' : 'bg-rose-500 text-white'
                          }`}>
                            -%{opt.discount}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Line items */}
              {plan.id !== 'custom' ? (
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>{plan.name} Plan</span>
                    <span className="font-semibold text-gray-900">{plan.price}{plan.period}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Süre</span>
                    <span className="font-semibold text-gray-900">{getDurationOpt().label}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Ara Toplam</span>
                    <span className="font-semibold text-gray-900">{'\u20BA'}{getSubtotal().toLocaleString('tr-TR')}</span>
                  </div>
                  {getDiscount() > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>İndirim (%{getDurationOpt().discount})</span>
                      <span className="font-semibold">-{'\u20BA'}{getDiscount().toLocaleString('tr-TR')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>KDV (%20)</span>
                    <span className="font-semibold text-gray-900">{'\u20BA'}{getVat().toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-gray-900 text-base">
                    <span>Toplam</span>
                    <span>{'\u20BA'}{getGrandTotal().toLocaleString('tr-TR')}</span>
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">{'\u2713'} İlk 14 gün ücretsiz</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Özel fiyatlandırma için bizimle iletişime geçin.</p>
              )}

              {/* Guarantees */}
              <div className="mt-5 space-y-2">
                {['30 gün para-iade garantisi', 'İstediğiniz zaman iptal', '7/24 müşteri desteği'].map(g => (
                  <div key={g} className="flex items-center gap-2 text-xs text-gray-500">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {g}
                  </div>
                ))}
              </div>

              {/* Change plan link */}
              <Link href="/paket-sec" className="mt-5 block text-center text-xs text-brand-500 hover:underline">
                Planı değiştir
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function OdemePage() {
  return <OdemeInner />
}
