import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { updateProfile, logout } from '@/store/slices/authSlice'
import { updateBusiness } from '@/store/slices/businessSlice'
import { PLAN_CONFIGS, getPlanConfig, normalizePlanId, planAllows, splitModulesByPlan } from '@/config/plans'
import { useBusiness, useUpdateBusiness } from '@/hooks/useBusiness'
import type { Business } from '@/types'
import { useBusinessSettings, useSaveBusinessSettings } from '@/hooks/useSettings'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { PhoneInput } from '@/components/ui/PhoneInput'
import {
  Building2,
  Clock,
  Bell,
  Shield,
  Globe,
  ChevronRight,
  User,
  Phone,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  CreditCard,
  Plus,
  Trash2,
  FileText,
  Pencil,
  Image as ImageIcon,
  Upload,
  Film,
  AlertTriangle,
} from 'lucide-react'

// ── Billing address & payment method types ─────────────────────────────────
interface BillingAddress {
  id: string
  name: string
  addressLine1: string
  addressLine2: string
  city: string
  postalCode: string
  organization: string
  invoiceType: 'bireysel' | 'kurumsal'
  phone: string
  country: string
  taxNumber: string
  taxOffice: string
}

interface SavedCard {
  id: string
  cardHolder: string
  last4: string
  brand: 'visa' | 'mastercard' | 'other'
  expiry: string
  isDefault: boolean
}

function mapCardFromApi(c: any): SavedCard {
  return {
    id: String(c.id),
    cardHolder: c.cardHolder ?? c.cardHolderName ?? '',
    last4: c.lastFour ?? '',
    brand: ((c.brand ?? '').toLowerCase() === 'visa' ? 'visa' : (c.brand ?? '').toLowerCase() === 'mastercard' ? 'mastercard' : 'other') as SavedCard['brand'],
    expiry: c.expiry ?? '',
    isDefault: c.default ?? c.isDefault ?? false,
  }
}

function mapBillingFromApi(b: any): BillingAddress {
  return {
    id: 'billing-default',
    name: b.settings?.billing_contact_name ?? b.name ?? '',
    addressLine1: b.address ?? '',
    addressLine2: '',
    city: b.city ?? '',
    postalCode: b.postalCode ?? '',
    organization: b.name ?? '',
    invoiceType: b.settings?.billing_invoice_type ?? 'bireysel',
    phone: b.phone ?? '',
    country: b.country ?? 'Türkiye',
    taxNumber: b.taxNumber ?? '',
    taxOffice: b.taxOffice ?? '',
  }
}

const EMPTY_BILLING: Omit<BillingAddress, 'id'> = {
  name: '', addressLine1: '', addressLine2: '', city: '', postalCode: '',
  organization: '', invoiceType: 'bireysel', phone: '', country: 'Türkiye', taxNumber: '', taxOffice: '',
}

type SettingsTab = 'profile' | 'general' | 'hours' | 'notifications' | 'security' | 'integrations'

const tabs: { id: SettingsTab; label: string; icon: typeof Building2; badge?: string }[] = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'general', label: 'Genel', icon: Building2 },
  { id: 'hours', label: 'Çalışma Saatleri', icon: Clock },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'security', label: 'Güvenlik', icon: Shield },
  { id: 'integrations', label: 'Entegrasyonlar', icon: Globe },
]

const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

function NotifToggleRow({
  label, desc, checked, onChange,
}: {
  label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <label className="relative flex shrink-0 cursor-pointer items-center">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
      </label>
    </div>
  )
}

function ProfileSettings() {
  const dispatch = useAppDispatch()
  const { email: storedEmail, tenantId: _tenantId } = useAppSelector((s) => s.auth)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loading, setLoading] = useState(true)

  // Billing addresses
  const [billingAddresses, setBillingAddresses] = useState<BillingAddress[]>([])
  const [billingFormOpen, setBillingFormOpen] = useState(false)
  const [editingBillingId, setEditingBillingId] = useState<string | null>(null)
  const [billingForm, setBillingForm] = useState<Omit<BillingAddress, 'id'>>(EMPTY_BILLING)
  // Payment methods (cards)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [cardFormOpen, setCardFormOpen] = useState(false)
  const [cardForm, setCardForm] = useState({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' })
  const [cardSaving, setCardSaving] = useState(false)

  function openAddBilling() {
    setEditingBillingId(null)
    setBillingForm(EMPTY_BILLING)
    setBillingFormOpen(true)
  }

  function openEditBilling(addr: BillingAddress) {
    setEditingBillingId(addr.id)
    const { id: _id, ...rest } = addr
    setBillingForm(rest)
    setBillingFormOpen(true)
  }

  async function saveBillingForm() {
    if (!billingForm.name.trim() || !billingForm.addressLine1.trim()) return
    try {
      const current = await api.get<any>('/business/me').then(r => r.data)
      await api.put('/business/me', {
        name: billingForm.organization || businessName || current.name,
        phone: billingForm.phone || null,
        email: current.email,
        address: billingForm.addressLine1 + (billingForm.addressLine2 ? ', ' + billingForm.addressLine2 : ''),
        city: billingForm.city || null,
        postalCode: billingForm.postalCode || null,
        country: billingForm.country || null,
        taxNumber: billingForm.taxNumber || null,
        taxOffice: billingForm.taxOffice || null,
        website: current.website,
        description: current.description,
        logoUrl: current.logoUrl,
        settings: { ...current.settings, billing_invoice_type: billingForm.invoiceType, billing_contact_name: billingForm.name },
      })
      const id = editingBillingId || `ba-${Date.now()}`
      const address: BillingAddress = { id, ...billingForm }
      setBillingAddresses(editingBillingId
        ? billingAddresses.map(a => a.id === editingBillingId ? address : a)
        : [address])
      setBillingFormOpen(false)
      setEditingBillingId(null)
    } catch { /* sessiz */ }
  }

  async function deleteBillingAddress(_id: string) {
    try {
      const current = await api.get<any>('/business/me').then(r => r.data)
      await api.put('/business/me', {
        name: current.name,
        phone: null,
        email: current.email,
        address: null,
        city: null,
        postalCode: null,
        country: null,
        taxNumber: null,
        taxOffice: null,
        website: current.website,
        description: current.description,
        logoUrl: current.logoUrl,
        settings: { ...current.settings, billing_invoice_type: null, billing_contact_name: null },
      })
      setBillingAddresses([])
    } catch { /* sessiz */ }
  }

  async function saveCard() {
    if (!cardForm.cardHolder.trim() || cardForm.cardNumber.replace(/\s/g, '').length < 13) return
    setCardSaving(true)
    try {
      const rawNum = cardForm.cardNumber.replace(/\s/g, '')
      const brand = rawNum.startsWith('4') ? 'visa' : rawNum.startsWith('5') ? 'mastercard' : 'other'
      await api.post('/payments/cards', {
        cardHolder: cardForm.cardHolder,
        cardNumber: rawNum,
        expiry: cardForm.expiry,
        cvv: cardForm.cvv,
        brand,
      })
      const res = await api.get('/payments/cards')
      setSavedCards((res.data || []).map(mapCardFromApi))
      setCardForm({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' })
      setCardFormOpen(false)
    } catch { /* sessiz */ }
    setCardSaving(false)
  }

  async function setDefaultCard(id: string) {
    try {
      await api.put(`/payments/cards/${id}/default`)
      const res = await api.get('/payments/cards')
      setSavedCards((res.data || []).map(mapCardFromApi))
    } catch { /* sessiz */ }
  }

  async function deleteCard(id: string) {
    try {
      await api.delete(`/payments/cards/${id}`)
      const res = await api.get('/payments/cards')
      setSavedCards((res.data || []).map(mapCardFromApi))
    } catch { /* sessiz */ }
  }
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profili API'den yükle
  useEffect(() => {
    api.get<{ firstName: string; lastName: string; fullName: string; email: string; phone: string | null; jobTitle: string | null; avatarUrl: string | null }>('/users/me')
      .then(r => {
        const d = r.data
        setName(d.fullName ?? '')
        setPhone(d.phone ?? '')
        setJobTitle(d.jobTitle ?? '')
        if (d.avatarUrl) {
          const fullUrl = d.avatarUrl.startsWith('/') ? `http://localhost:5280${d.avatarUrl}` : d.avatarUrl
          setAvatarUrl(fullUrl)
          try { localStorage.setItem('profile_avatar', fullUrl) } catch { /* quota */ }
          window.dispatchEvent(new CustomEvent('profile_avatar_updated', { detail: fullUrl }))
        }
        dispatch(updateProfile({ fullName: d.fullName, phone: d.phone ?? undefined, jobTitle: d.jobTitle ?? undefined, email: d.email }))
      })
      .catch(() => { /* Redux'taki mevcut değerleri kullan */ })

    // Load business billing info
    api.get<any>('/business/me')
      .then(r => {
        const d = r.data
        if (d.address || d.city || d.postalCode || d.country || d.taxNumber || d.taxOffice) {
          setBillingAddresses([mapBillingFromApi(d)])
        }
        setBusinessName(d.name ?? '')
      })
      .catch(() => {})

    // Load saved cards
    api.get('/payments/cards')
      .then(r => {
        const cards = (r.data || []).map(mapCardFromApi)
        setSavedCards(cards)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dispatch])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.put<{ url: string }>('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data.url
      setAvatarUrl(url)
      try {
        localStorage.setItem('profile_avatar', url)
        window.dispatchEvent(new CustomEvent('profile_avatar_updated', { detail: url }))
      } catch { /* quota */ }
    } catch {
      /* sessiz hata */
    }
  }

  // Email change state
  const [emailOpen, setEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailSaved, setEmailSaved] = useState(false)

  const currentEmail = storedEmail ?? '—'

  function save() {
    setSaveError('')
    const parts = name.trim().split(' ')
    const firstName = parts[0] ?? ''
    const lastName = parts.slice(1).join(' ') || firstName
    api.put('/users/me', { firstName, lastName, phone: phone || null, jobTitle: jobTitle || null, avatarUrl: avatarUrl || null })
      .then(() => {
        dispatch(updateProfile({ fullName: name, phone, jobTitle }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? 'Profil güncellenemedi.'
        setSaveError(msg)
      })
  }

  function saveEmail() {
    setEmailError('')
    if (!newEmail.includes('@')) { setEmailError('Geçerli bir e-posta adresi girin.'); return }
    if (newEmail !== confirmEmail) { setEmailError('E-posta adresleri eşleşmiyor.'); return }
    api.put('/auth/update-email', { newEmail })
      .then(() => {
        dispatch(updateProfile({ email: newEmail }))
        setEmailSaved(true)
        setEmailOpen(false)
        setNewEmail('')
        setConfirmEmail('')
        setTimeout(() => setEmailSaved(false), 2500)
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? 'E-posta güncellenemedi.'
        setEmailError(msg)
      })
  }

  const initials = name
    ? name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'U'

  if (loading) {
    return <div className="flex justify-center py-16"><span className="animate-spin text-primary">⏳</span></div>
  }

  // ── Profile completion ────────────────────────────────────────────────────
  const completionItems: { label: string; done: boolean; action?: string }[] = [
    { label: 'Ad Soyad', done: !!name.trim(), action: 'Ad soyadınızı girin' },
    { label: 'Profil fotoğrafı', done: !!avatarUrl, action: 'Fotoğraf yükleyin' },
    { label: 'Unvan / Rol', done: !!jobTitle.trim(), action: 'Unvanınızı girin' },
    { label: 'Telefon', done: !!phone.trim(), action: 'Telefon ekleyin' },
    { label: 'E-posta', done: !!(storedEmail && storedEmail !== '—'), action: 'E-posta doğrulayın' },
    { label: 'Fatura adresi', done: billingAddresses.length > 0, action: 'Fatura adresi ekleyin' },
    { label: 'Ödeme yöntemi', done: savedCards.length > 0, action: 'Kart ekleyin' },
  ]
  const completedCount = completionItems.filter(i => i.done).length
  const progressPct = Math.round((completedCount / completionItems.length) * 100)
  const profileComplete = completedCount === completionItems.length

  return (
    <div className="space-y-6">
      {/* ── Profil İlerlemesi ────────────────────────────────────────────────── */}
      <Card className={profileComplete
        ? 'border-emerald-200 bg-emerald-50/40'
        : 'border-primary/20 bg-primary/5'
      }>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-semibold leading-tight">
                {profileComplete ? 'Profil tamamlandı' : 'Profil tamamlanma durumu'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {profileComplete
                  ? 'Tüm bilgiler eksiksiz.'
                  : `${completionItems.length - completedCount} eksik alan kaldı`}
              </p>
            </div>
            <span className={`text-2xl font-bold tabular-nums ${profileComplete ? 'text-emerald-600' : 'text-primary'}`}>
              %{progressPct}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${profileComplete ? 'bg-emerald-500' : 'bg-primary'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {/* Checklist */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {completionItems.map(item => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs">
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                )}
                <span className={item.done ? 'text-foreground' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profil Bilgileri</CardTitle>
          <CardDescription>Değişiklikler header'daki kullanıcı menüsüne yansır</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profil" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
                  {initials}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-white font-medium">Değiştir</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div>
              <p className="text-sm font-medium leading-none">{name || 'Kullanıcı'}</p>
              {jobTitle && <p className="mt-0.5 text-xs text-muted-foreground">{jobTitle}</p>}
              {phone && <p className="mt-0.5 text-xs text-muted-foreground">{phone}</p>}
              <Button variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                Fotoğraf Yükle
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Ad Soyad</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Adınız Soyadınız"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Header'da görünen isim güncellenir</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Unvan / Rol</label>
              <input
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Örn: İşletme Sahibi"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">Header kullanıcı menüsünde görünür</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Telefon</label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            {saveError && <span className="text-sm text-red-500">{saveError}</span>}
            {(saved || emailSaved) && (
              <span className="text-sm text-emerald-600">✓ {saved ? 'Profil güncellendi' : 'E-posta güncellendi'}</span>
            )}
            <Button onClick={save}>Profili Kaydet</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E-posta Adresi</CardTitle>
          <CardDescription>Giriş yapmak için kullandığınız e-posta adresi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="text-sm font-medium">Mevcut E-posta</p>
              <p className="text-xs text-muted-foreground">{currentEmail}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setEmailOpen(v => !v); setEmailError('') }}>
              {emailOpen ? 'İptal' : 'E-posta Değiştir'}
            </Button>
          </div>

          {emailOpen && (
            <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Yeni E-posta</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="yeni@eposta.com"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Yeni E-posta (Tekrar)</label>
                  <input
                    type="email"
                    value={confirmEmail}
                    onChange={(e) => setConfirmEmail(e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="yeni@eposta.com"
                    onKeyDown={(e) => e.key === 'Enter' && saveEmail()}
                  />
                </div>
              </div>
              {emailError && <p className="text-sm text-red-500">{emailError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setEmailOpen(false); setEmailError('') }}>İptal</Button>
                <Button size="sm" onClick={saveEmail}>Kaydet</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Fatura Bilgileri ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fatura Bilgileri</CardTitle>
              <CardDescription>Faturalandırma için kullanılacak adres bilgileri. Birden fazla ekleyebilirsiniz.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={openAddBilling}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Adres Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {billingAddresses.length === 0 && !billingFormOpen && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Henüz fatura adresi eklenmedi.</p>
              <Button size="sm" variant="outline" onClick={openAddBilling}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> İlk Adresi Ekle
              </Button>
            </div>
          )}

          {billingAddresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border bg-muted/20 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{addr.name}</p>
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-medium',
                      addr.invoiceType === 'kurumsal'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    )}>
                      {addr.invoiceType === 'kurumsal' ? 'Kurumsal' : 'Bireysel'}
                    </span>
                  </div>
                  {addr.organization && <p className="text-xs text-muted-foreground">{addr.organization}</p>}
                  <p className="text-xs text-muted-foreground">
                    {[addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[addr.postalCode, addr.city, addr.country].filter(Boolean).join(' / ')}
                  </p>
                  {addr.taxNumber && <p className="text-xs text-muted-foreground">Vergi No: {addr.taxNumber}</p>}
                  {addr.taxOffice && <p className="text-xs text-muted-foreground">Vergi Dairesi: {addr.taxOffice}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEditBilling(addr)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    title="Düzenle"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => deleteBillingAddress(addr.id)}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Billing form */}
          {billingFormOpen && (
            <div className="rounded-xl border bg-background p-4 space-y-4">
              <p className="text-sm font-semibold">{editingBillingId ? 'Adresi Düzenle' : 'Yeni Fatura Adresi'}</p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Ad Soyad <span className="text-red-500">*</span></label>
                  <input
                    value={billingForm.name}
                    onChange={e => setBillingForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ad Soyad"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Organizasyon</label>
                  <input
                    value={billingForm.organization}
                    onChange={e => setBillingForm(f => ({ ...f, organization: e.target.value }))}
                    placeholder="Şirket / Organizasyon adı"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium">Adres Satırı 1 <span className="text-red-500">*</span></label>
                  <input
                    value={billingForm.addressLine1}
                    onChange={e => setBillingForm(f => ({ ...f, addressLine1: e.target.value }))}
                    placeholder="Mahalle, cadde, sokak, no"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium">Adres Satırı 2</label>
                  <input
                    value={billingForm.addressLine2}
                    onChange={e => setBillingForm(f => ({ ...f, addressLine2: e.target.value }))}
                    placeholder="Daire, kat, blok vb. (isteğe bağlı)"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Şehir</label>
                  <input
                    value={billingForm.city}
                    onChange={e => setBillingForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="İstanbul"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Posta Kodu</label>
                  <input
                    value={billingForm.postalCode}
                    onChange={e => setBillingForm(f => ({ ...f, postalCode: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="34000"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Ülke</label>
                  <input
                    value={billingForm.country}
                    onChange={e => setBillingForm(f => ({ ...f, country: e.target.value }))}
                    placeholder="Türkiye"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Telefon</label>
                  <input
                    value={billingForm.phone}
                    onChange={e => setBillingForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+90 555 000 00 00"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Fatura Tipi</label>
                  <select
                    value={billingForm.invoiceType}
                    onChange={e => setBillingForm(f => ({ ...f, invoiceType: e.target.value as BillingAddress['invoiceType'] }))}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="bireysel">Bireysel</option>
                    <option value="kurumsal">Kurumsal</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Vergi No</label>
                  <input
                    value={billingForm.taxNumber}
                    onChange={e => setBillingForm(f => ({ ...f, taxNumber: e.target.value }))}
                    placeholder="Vergi numarası / T.C. kimlik no"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Vergi Dairesi</label>
                  <input
                    value={billingForm.taxOffice}
                    onChange={e => setBillingForm(f => ({ ...f, taxOffice: e.target.value }))}
                    placeholder="Vergi dairesi adı"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setBillingFormOpen(false); setEditingBillingId(null) }}
                >
                  İptal
                </Button>
                <Button
                  size="sm"
                  onClick={saveBillingForm}
                  disabled={!billingForm.name.trim() || !billingForm.addressLine1.trim()}
                >
                  Kaydet
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Ödeme Yöntemleri ─────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ödeme Yöntemleri</CardTitle>
              <CardDescription>Abonelik ödemeleri için kayıtlı kartlarınız.</CardDescription>
            </div>
            {!cardFormOpen && (
              <Button size="sm" variant="outline" onClick={() => setCardFormOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Kart Ekle
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {savedCards.length === 0 && !cardFormOpen && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed py-8 text-center">
              <CreditCard className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Henüz kayıtlı kart yok.</p>
              <Button size="sm" variant="outline" onClick={() => setCardFormOpen(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Kart Ekle
              </Button>
            </div>
          )}

          {savedCards.map((card) => (
            <div
              key={card.id}
              className={cn(
                'flex items-center justify-between rounded-xl border px-4 py-3 transition-colors',
                card.isDefault && 'border-primary/30 bg-primary/5'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-9 w-14 shrink-0 items-center justify-center rounded-md border text-xs font-bold',
                  card.brand === 'visa' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  card.brand === 'mastercard' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                  'bg-muted text-muted-foreground'
                )}>
                  {card.brand === 'visa' ? 'VISA' : card.brand === 'mastercard' ? 'MC' : '••••'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">•••• {card.last4}</p>
                    {card.isDefault && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Varsayılan</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{card.cardHolder} · Son: {card.expiry}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {!card.isDefault && (
                  <button
                    onClick={() => setDefaultCard(card.id)}
                    className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  >
                    Varsayılan Yap
                  </button>
                )}
                <button
                  onClick={() => deleteCard(card.id)}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Kartı Kaldır"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Card form */}
          {cardFormOpen && (
            <div className="rounded-xl border bg-background p-4 space-y-4">
              <p className="text-sm font-semibold">Yeni Kart Ekle</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Kart Üzerindeki İsim</label>
                  <input
                    value={cardForm.cardHolder}
                    onChange={e => setCardForm(f => ({ ...f, cardHolder: e.target.value }))}
                    placeholder="Ad Soyad"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">Kart Numarası</label>
                  <input
                    value={cardForm.cardNumber}
                    onChange={e => setCardForm(f => ({ ...f, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() }))}
                    placeholder="0000 0000 0000 0000"
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">Son Kullanma Tarihi</label>
                    <input
                      value={cardForm.expiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
                        setCardForm(f => ({ ...f, expiry: v }))
                      }}
                      placeholder="AA/YY"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium">CVV</label>
                    <input
                      value={cardForm.cvv}
                      onChange={e => setCardForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                      placeholder="•••"
                      type="password"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setCardFormOpen(false); setCardForm({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' }) }}
                  disabled={cardSaving}
                >
                  İptal
                </Button>
                <Button
                  size="sm"
                  onClick={saveCard}
                  disabled={cardSaving || !cardForm.cardHolder.trim() || cardForm.cardNumber.replace(/\s/g, '').length < 13}
                >
                  {cardSaving ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Kaydediliyor…</> : 'Kaydet'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function GeneralSettings() {
  const { data: business, isLoading } = useBusiness()
  const updateMutation = useUpdateBusiness()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rk_gallery_images') || '[]') } catch { return [] }
  })
  const [galleryVideos, setGalleryVideos] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('rk_gallery_videos') || '[]') } catch { return [] }
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  // Populate form once data loads
  if (business && !initialized) {
    setName(business.name ?? '')
    setPhone(business.phone ?? '')
    setEmail(business.email ?? '')
    setAddress(business.address ?? '')
    setCity(business.city ?? '')
    setWebsite(business.website ?? '')
    setDescription(business.description ?? '')
    if (business.galleryImages?.length) {
      setGalleryImages(business.galleryImages)
      localStorage.setItem('rk_gallery_images', JSON.stringify(business.galleryImages))
    }
    setInitialized(true)
  }

  async function handleSave() {
    await updateMutation.mutateAsync({
      name, phone, email, address, city, website, description,
      logoUrl: business?.logoUrl ?? null,
      galleryImages,
      postalCode: business?.postalCode ?? null,
      country: business?.country ?? null,
      taxNumber: business?.taxNumber ?? null,
      taxOffice: business?.taxOffice ?? null,
      settings: business?.settings,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><span className="animate-spin text-primary">⏳</span></div>
  }

  const businessFields: { label: string; done: boolean }[] = [
    { label: 'İşletme Adı',  done: !!name.trim() },
    { label: 'Kategori',     done: !!business?.category },
    { label: 'Telefon',      done: !!phone.trim() },
    { label: 'E-posta',      done: !!email.trim() },
    { label: 'Şehir',        done: !!city.trim() },
    { label: 'Web Sitesi',   done: !!website.trim() },
    { label: 'Adres',        done: !!address.trim() },
    { label: 'Açıklama',     done: !!description.trim() },
    { label: 'Logo',         done: !!business?.logoUrl },
    { label: 'Vergi No',     done: !!business?.taxNumber },
    { label: 'Vergi Dairesi', done: !!business?.taxOffice },
  ]
  const fieldDone = businessFields.filter(f => f.done).length
  const fieldTotal = businessFields.length
  const fieldPct = Math.round((fieldDone / fieldTotal) * 100)
  const fieldComplete = fieldDone === fieldTotal

  return (
    <div className="space-y-6">
      <Card className={fieldComplete ? 'border-emerald-200 bg-emerald-50/40' : 'border-primary/20 bg-primary/5'}>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-semibold leading-tight">
                {fieldComplete ? 'İşletme profili tamamlandı' : 'İşletme profili tamamlanma durumu'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {fieldComplete ? 'Tüm bilgiler eksiksiz.' : `${fieldTotal - fieldDone} eksik alan kaldı`}
              </p>
            </div>
            <span className={`text-2xl font-bold tabular-nums ${fieldComplete ? 'text-emerald-600' : 'text-primary'}`}>
              %{fieldPct}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${fieldComplete ? 'bg-emerald-500' : 'bg-primary'}`}
                 style={{ width: `${fieldPct}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {businessFields.map(f => (
              <div key={f.label} className="flex items-center gap-1.5 text-xs">
                {f.done ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        : <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                <span className={f.done ? 'text-foreground' : 'text-muted-foreground'}>{f.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İşletme Bilgileri</CardTitle>
          <CardDescription>İşletmenizin temel bilgilerini güncelleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">İşletme Adı</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="İşletme adınız"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Kategori</label>
              <select className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option>Güzellik & Bakım</option>
                <option>Sağlık & Spor</option>
                <option>Eğitim</option>
                <option>Hukuk & Danışmanlık</option>
                <option>Diğer</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Telefon</label>
              <PhoneInput value={phone} onChange={setPhone} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">E-posta</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="isletme@example.com"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Şehir</label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="İstanbul"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Web Sitesi</label>
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="https://isletme.com"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Adres</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="İşletme adresi"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              placeholder="İşletmeniz hakkında kısa bilgi"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && <span className="text-sm text-emerald-600">✓ Kaydedildi</span>}
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İşletme Galerisi</CardTitle>
          <CardDescription>İşletmenizin fotoğraf ve videolarını ekleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <p className="text-sm font-medium mb-2">Logo</p>
            <div className="flex items-center gap-4">
              {business?.logoUrl ? (
                <img src={business.logoUrl} alt="logo" className="h-16 w-16 rounded-lg object-cover border" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-muted">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()}>
                <Upload className="mr-1.5 h-4 w-4" /> Logo Yükle
              </Button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                     onChange={async (e) => {
                       const file = e.target.files?.[0]
                       if (!file) return
                       const reader = new FileReader()
                       reader.onload = async () => {
                         const dataUrl = reader.result as string
                          await updateMutation.mutateAsync({
                            name, phone, email, address, city, website, description,
                            logoUrl: dataUrl,
                            galleryImages,
                            postalCode: business?.postalCode ?? null,
                            country: business?.country ?? null,
                            taxNumber: business?.taxNumber ?? null,
                            taxOffice: business?.taxOffice ?? null,
                            settings: business?.settings,
                          })
                       }
                       reader.readAsDataURL(file)
                     }} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Fotoğraflar</p>
            <div className="flex flex-wrap gap-3">
              {galleryImages.map((src, i) => (
                <div key={i} className="group relative h-20 w-20 overflow-hidden rounded-lg border">
                  <img src={src} alt={`gallery-${i}`} className="h-full w-full object-cover" />
                  <button onClick={() => {
                    const next = galleryImages.filter((_, j) => j !== i)
                    setGalleryImages(next)
                    localStorage.setItem('rk_gallery_images', JSON.stringify(next))
                  }}
                  className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => fileRef.current?.click()}
                      className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30 transition-colors hover:bg-muted/60">
                <Plus className="h-5 w-5 text-muted-foreground" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                     onChange={(e) => {
                       const files = Array.from(e.target.files || [])
                       if (!files.length) return
                       Promise.all(files.map(f => new Promise<string>(resolve => {
                         const r = new FileReader()
                         r.onload = () => resolve(r.result as string)
                         r.readAsDataURL(f)
                       }))).then(results => {
                         const next = [...galleryImages, ...results]
                         setGalleryImages(next)
                         localStorage.setItem('rk_gallery_images', JSON.stringify(next))
                       })
                       e.target.value = ''
                     }} />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Videolar (YouTube / Vimeo linki)</p>
            <div className="space-y-2">
              {galleryVideos.map((url, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                  <Film className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 truncate text-muted-foreground">{url}</span>
                  <button onClick={() => {
                    const next = galleryVideos.filter((_, j) => j !== i)
                    setGalleryVideos(next)
                    localStorage.setItem('rk_gallery_videos', JSON.stringify(next))
                  }}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input ref={videoRef} type="url" placeholder="https://youtube.com/watch?v=..."
                       className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && videoRef.current?.value) {
                           const next = [...galleryVideos, videoRef.current.value]
                           setGalleryVideos(next)
                           localStorage.setItem('rk_gallery_videos', JSON.stringify(next))
                           videoRef.current.value = ''
                         }
                       }} />
                <Button size="sm" onClick={() => {
                  if (videoRef.current?.value) {
                    const next = [...galleryVideos, videoRef.current.value]
                    setGalleryVideos(next)
                    localStorage.setItem('rk_gallery_videos', JSON.stringify(next))
                    videoRef.current.value = ''
                  }
                }}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rezervasyon Ayarları</CardTitle>
          <CardDescription>Randevu alma sürecini yapılandırın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Online rezervasyona izin ver', desc: 'Müşteriler web sitenizden randevu alabilir', defaultChecked: true },
            { label: 'Onay gerektir', desc: 'Yeni randevular için manuel onay isteyin', defaultChecked: false },
            { label: 'Otomatik hatırlatma gönder', desc: 'Randevudan 24 saat önce SMS/e-posta gönder', defaultChecked: true },
            { label: 'İptal bildirimi gönder', desc: 'Randevu iptal edildiğinde bildirim gönder', defaultChecked: true },
          ].map(({ label, desc, defaultChecked }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <label className="relative flex shrink-0 cursor-pointer items-center">
                <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
                <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2); const m = i % 2 === 0 ? '00' : '30'
  return `${String(h).padStart(2, '0')}:${m}`
})

type DaySchedule = { open: boolean; start: string; end: string }
const defaultSchedule: DaySchedule[] = [
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '09:00', end: '20:00' },
  { open: true, start: '10:00', end: '18:00' },
  { open: false, start: '10:00', end: '18:00' },
]

function WorkingHoursSettings() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(() => {
    try {
      const stored = localStorage.getItem('working_hours')
      return stored ? JSON.parse(stored) : defaultSchedule
    } catch { return defaultSchedule }
  })
  const [saved, setSaved] = useState(false)

  function update(i: number, patch: Partial<DaySchedule>) {
    setSchedule(prev => prev.map((d, idx) => idx === i ? { ...d, ...patch } : d))
  }

  function save() {
    localStorage.setItem('working_hours', JSON.stringify(schedule))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Çalışma Saatleri</CardTitle>
        <CardDescription>Haftanın her günü için çalışma saatlerini belirleyin</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {days.map((day, i) => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-28 shrink-0">
                <span className={cn('text-sm font-medium', !schedule[i].open && 'text-muted-foreground')}>{day}</span>
              </div>
              <label className="relative flex shrink-0 cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={schedule[i].open}
                  onChange={e => update(i, { open: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
              </label>
              {schedule[i].open ? (
                <div className="flex flex-1 items-center gap-2">
                  <select
                    value={schedule[i].start}
                    onChange={e => update(i, { start: e.target.value })}
                    className="rounded-lg border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {HALF_HOURS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className="text-muted-foreground">—</span>
                  <select
                    value={schedule[i].end}
                    onChange={e => update(i, { end: e.target.value })}
                    className="rounded-lg border bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {HALF_HOURS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ) : (
                <span className="flex-1 text-sm text-muted-foreground">Kapalı</span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          {saved && <span className="text-sm text-emerald-600">✓ Saatler kaydedildi</span>}
          <Button onClick={save}>Saatleri Kaydet</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationSettings() {
  const { data: settings, isLoading } = useBusinessSettings()
  const saveMutation = useSaveBusinessSettings()
  const [saved, setSaved] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})

  function getVal(key: string): boolean {
    if (key in overrides) return overrides[key]
    return Boolean((settings as unknown as Record<string, unknown>)?.[key])
  }

  async function handleToggle(key: string, value: boolean) {
    if (!settings) return
    setOverrides(prev => ({ ...prev, [key]: value }))
    try {
      await saveMutation.mutateAsync({ ...settings, ...overrides, [key]: value })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setOverrides(prev => { const n = { ...prev }; delete n[key]; return n })
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bildirim Tercihleri</CardTitle>
          <CardDescription>Hangi kanallardan ve ne zaman bildirim alacağınızı ayarlayın</CardDescription>
        </CardHeader>
        <CardContent>
          {saved && <p className="mb-3 text-sm text-emerald-600">✓ Tercihler kaydedildi</p>}
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wide">Kanallar</h3>
            <NotifToggleRow label="E-posta Bildirimleri" desc="Randevu ve işlem bilgileri e-posta ile" checked={getVal('emailNotifications')} onChange={v => handleToggle('emailNotifications', v)} />
            <NotifToggleRow label="SMS Bildirimleri" desc="Önemli randevu bildirimleri SMS ile" checked={getVal('smsNotifications')} onChange={v => handleToggle('smsNotifications', v)} />
          </div>
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground tracking-wide">Randevular</h3>
            <NotifToggleRow label="Randevu Hatırlatması" desc={`${settings.reminderHoursBefore} saat önce otomatik hatırlatma`} checked={getVal('appointmentReminders')} onChange={v => handleToggle('appointmentReminders', v)} />
            <NotifToggleRow label="Yeni Randevu Bildirimi" desc="Yeni bir randevu oluşturulduğunda bildir" checked={getVal('newBookingAlert')} onChange={v => handleToggle('newBookingAlert', v)} />
            <NotifToggleRow label="İptal Bildirimi" desc="Bir randevu iptal edildiğinde bildir" checked={getVal('cancellationAlert')} onChange={v => handleToggle('cancellationAlert', v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rezervasyon Ayarları</CardTitle>
          <CardDescription>Online rezervasyon ve onay kuralları</CardDescription>
        </CardHeader>
        <CardContent>
          <NotifToggleRow label="Online Rezervasyon" desc="Müşterilerin online randevu almasına izin ver" checked={getVal('allowOnlineBooking')} onChange={v => handleToggle('allowOnlineBooking', v)} />
          <NotifToggleRow label="Manuel Onay Gerekli" desc="Her rezervasyon manuel olarak onaylanmalı" checked={getVal('requireConfirmation')} onChange={v => handleToggle('requireConfirmation', v)} />
          <NotifToggleRow label="İptal İzni" desc="Müşteriler randevularını iptal edebilir" checked={getVal('allowCancellation')} onChange={v => handleToggle('allowCancellation', v)} />
        </CardContent>
      </Card>
    </div>
  )
}

const MOCK_INVOICES = [
  { id: 'INV-2026-005', date: '17 Mayıs 2026', amount: '₺499,00', status: 'Ödendi', plan: 'Business' },
  { id: 'INV-2026-004', date: '17 Nisan 2026', amount: '₺499,00', status: 'Ödendi', plan: 'Business' },
  { id: 'INV-2026-003', date: '17 Mart 2026', amount: '₺499,00', status: 'Ödendi', plan: 'Business' },
  { id: 'INV-2026-002', date: '17 Şubat 2026', amount: '₺299,00', status: 'Ödendi', plan: 'Starter' },
  { id: 'INV-2026-001', date: '17 Ocak 2026', amount: '₺299,00', status: 'Ödendi', plan: 'Starter' },
]

export function BillingSettings() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [planModalView, setPlanModalView] = useState<'main' | 'invoices' | 'payment' | 'contact' | 'cancel-confirm' | null>(null)

  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(null)

  useEffect(() => {
    api.get<{ plan: string; subscriptionEndsAt?: string | null }>('/business/me').then((res) => {
      const plan = res.data.plan as Business['plan']
      if (plan) {
        dispatch(updateBusiness({ plan }))
      }
      if (res.data.subscriptionEndsAt) {
        setSubscriptionEndsAt(res.data.subscriptionEndsAt)
      }
    }).catch(() => {})
  }, [])

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [paymentForm, setPaymentForm] = useState({ cardHolder: '', cardNumber: '', expiry: '', cvv: '' })
  const [paymentSaved, setPaymentSaved] = useState(false)
  const business = useAppSelector((s) => s.business.business)
  const modules = useAppSelector((s) => s.modules.modules)
  const { tenantId: _tenantId } = useAppSelector((s) => s.auth)
  const currentPlan = normalizePlanId(business?.plan)
  const currentPlanConfig = getPlanConfig(currentPlan)
  const { available, unavailable } = splitModulesByPlan(modules, currentPlan)

  const accessToken = useAppSelector((s) => s.auth.accessToken)

  function getWebAppBaseUrl() {
    if (window.location.hostname === 'localhost') return 'http://localhost:3004'
    return window.location.origin
  }

  function handleUpgradeClick(targetPlan: string) {
    localStorage.setItem('selectedPlan', targetPlan)
    localStorage.setItem('panelReturnUrl', window.location.origin + '/subscription')

    if (!accessToken) {
      const loginUrl = `${getWebAppBaseUrl()}/login?redirect=${encodeURIComponent('/paket-sec?plan=' + targetPlan)}`
      window.location.href = loginUrl
      return
    }

    window.location.href = `${getWebAppBaseUrl()}/paket-sec?plan=${targetPlan}&_token=${accessToken}`
  }

  async function handleCancelSubscription() {
    setCancelling(true)
    setCancelError('')
    try {
      await api.post('/business/me/cancel-subscription')
    } catch {
      // Backend unavailable in demo — proceed with local deactivation
    }
    dispatch(updateBusiness({ isActive: false }))
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  function handlePaymentSave() {
    setPaymentSaved(true)
    setTimeout(() => {
      setPaymentSaved(false)
      setPlanModalView('main')
    }, 1800)
  }

  const modalTitle: Record<NonNullable<typeof planModalView>, string> = {
    main: 'Plan Yönetimi',
    invoices: 'Fatura Geçmişi',
    payment: 'Ödeme Yöntemi',
    contact: 'Satış ile İletişim',
    'cancel-confirm': 'Aboneliği İptal Et',
  }

  return (
    <div className="space-y-6">
      {planModalView !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background shadow-xl">
            <div className="flex items-center gap-3 border-b p-5">
              {planModalView !== 'main' && (
                <button
                  onClick={() => setPlanModalView('main')}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground"
                >
                  ←
                </button>
              )}
              <div>
                <h3 className="text-lg font-semibold">{modalTitle[planModalView]}</h3>
                {planModalView === 'main' && (
                  <p className="text-sm text-muted-foreground mt-0.5">Aboneliğinizi yönetin</p>
                )}
              </div>
            </div>

            {/* Main view */}
            {planModalView === 'main' && (
              <div className="p-5 space-y-3">
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <p className="font-semibold">{currentPlanConfig.name} Plan</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{currentPlanConfig.price} · Sonraki ödeme: {subscriptionEndsAt ? formatDate(subscriptionEndsAt) : '-'}</p>
                </div>
                <button
                  onClick={() => setPlanModalView('invoices')}
                  className="w-full rounded-lg border px-4 py-3 text-left hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">Fatura Geçmişi</p>
                    <p className="text-xs text-muted-foreground">Geçmiş ödemelerinizi görüntüleyin</p>
                  </div>
                  <span className="text-muted-foreground text-sm">→</span>
                </button>
                <button
                  onClick={() => setPlanModalView('payment')}
                  className="w-full rounded-lg border px-4 py-3 text-left hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">Ödeme Yöntemi Güncelle</p>
                    <p className="text-xs text-muted-foreground">Kredi kartı veya banka kartı bilgilerini değiştirin</p>
                  </div>
                  <span className="text-muted-foreground text-sm">→</span>
                </button>
                <button
                  onClick={() => setPlanModalView('contact')}
                  className="w-full rounded-lg border px-4 py-3 text-left hover:bg-accent transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">Satış ile İletişime Geç</p>
                    <p className="text-xs text-muted-foreground">Plan değişikliği veya özel teklif için</p>
                  </div>
                  <span className="text-muted-foreground text-sm">→</span>
                </button>
                <button
                  onClick={() => setPlanModalView('cancel-confirm')}
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left hover:bg-red-100 transition-colors"
                >
                  <p className="text-sm font-medium text-red-700">Aboneliği İptal Et</p>
                  <p className="text-xs text-red-600 mt-0.5">Dönem sonunda otomatik yenileme durur. Verileriniz 30 gün korunur.</p>
                </button>
              </div>
            )}

            {/* Invoices view */}
            {planModalView === 'invoices' && (
              <div className="p-5 space-y-2 max-h-[420px] overflow-y-auto">
                {MOCK_INVOICES.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{inv.id}</p>
                      <p className="text-xs text-muted-foreground">{inv.date} · {inv.plan}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{inv.amount}</span>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">{inv.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment method view */}
            {planModalView === 'payment' && (
              <div className="p-5 space-y-4">
                {paymentSaved ? (
                  <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">✓</div>
                    <p className="font-medium">Ödeme yöntemi güncellendi</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Kart Üzerindeki İsim</label>
                      <input
                        value={paymentForm.cardHolder}
                        onChange={e => setPaymentForm(f => ({ ...f, cardHolder: e.target.value }))}
                        placeholder="Ad Soyad"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Kart Numarası</label>
                      <input
                        value={paymentForm.cardNumber}
                        onChange={e => setPaymentForm(f => ({ ...f, cardNumber: e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim() }))}
                        placeholder="0000 0000 0000 0000"
                        className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Son Kullanma Tarihi</label>
                        <input
                          value={paymentForm.expiry}
                          onChange={e => {
                            let v = e.target.value.replace(/\D/g, '').slice(0, 4)
                            if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
                            setPaymentForm(f => ({ ...f, expiry: v }))
                          }}
                          placeholder="AA/YY"
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">CVV</label>
                        <input
                          value={paymentForm.cvv}
                          onChange={e => setPaymentForm(f => ({ ...f, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                          placeholder="•••"
                          type="password"
                          className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    </div>
                    <Button className="w-full" size="sm" onClick={handlePaymentSave}>Kaydet</Button>
                  </>
                )}
              </div>
            )}

            {/* Contact view */}
            {planModalView === 'contact' && (
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">Plan değişikliği, toplu lisans veya özel teklif için ekibimize ulaşın.</p>
                <a
                  href="mailto:satis@randevumkolay.com"
                  className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent transition-colors"
                >
                  <span className="text-lg">✉️</span>
                  <div>
                    <p className="text-sm font-medium">E-posta Gönder</p>
                    <p className="text-xs text-muted-foreground">satis@randevumkolay.com</p>
                  </div>
                </a>
                <a
                  href="tel:+902121234567"
                  className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-accent transition-colors"
                >
                  <span className="text-lg">📞</span>
                  <div>
                    <p className="text-sm font-medium">Telefon</p>
                    <p className="text-xs text-muted-foreground">+90 (212) 123 45 67 · Pzt–Cum 09:00–18:00</p>
                  </div>
                </a>
                <div className="rounded-lg bg-primary/5 border border-primary/15 px-4 py-3 text-xs text-muted-foreground">
                  Ortalama yanıt süresi: <span className="font-medium text-foreground">1 iş günü</span>
                </div>
              </div>
            )}

            {/* Cancel confirm view */}
            {planModalView === 'cancel-confirm' && (
              <div className="p-5 space-y-4">
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
                  <p className="font-semibold text-red-800">Aboneliğinizi iptal etmek üzeresiniz</p>
                  <ul className="space-y-1 text-sm text-red-700">
                    <li>• Hesabınız <strong>hemen pasif</strong> hale gelecek ve panelden çıkış yapılacak</li>
                    <li>• Tüm kullanıcılar sisteme <strong>giriş yapamayacak</strong></li>
                    <li>• Verileriniz <strong>30 gün</strong> saklandıktan sonra silinecektir</li>
                  </ul>
                </div>
                {cancelError && (
                  <p className="text-sm text-red-600">{cancelError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPlanModalView('main')}
                    disabled={cancelling}
                  >
                    Vazgeç
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleCancelSubscription}
                    disabled={cancelling}
                  >
                    {cancelling ? 'İptal ediliyor…' : 'Evet, İptal Et'}
                  </Button>
                </div>
              </div>
            )}

            {planModalView !== 'cancel-confirm' && (
              <div className="flex justify-end gap-2 border-t p-4">
                <Button variant="outline" size="sm" onClick={() => setPlanModalView(null)}>Kapat</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Mevcut Plan</CardTitle>
          <CardDescription>Aktif abonelik bilgileriniz</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-xl bg-primary/5 border border-primary/20 p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">{currentPlanConfig.name} Plan</p>
                <Badge variant="default">Aktif</Badge>
                <Badge variant="secondary">{currentPlanConfig.badgeLabel}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {currentPlanConfig.price} · Sonraki ödeme: {subscriptionEndsAt ? formatDate(subscriptionEndsAt) : '-'}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">{currentPlanConfig.description}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPlanModalView('main')}>Planı Yönet</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-primary/10 bg-[linear-gradient(180deg,rgba(239,246,255,0.84)_0%,rgba(255,255,255,1)_26%)] shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Paketler</CardTitle>
              <CardDescription>Ferah görünüm için kartları yatay şeritte gezebilirsiniz.</CardDescription>
            </div>
            <div className="rounded-full border border-primary/10 bg-white/80 px-3 py-1 text-xs text-muted-foreground shadow-sm">
              Sola-sağa kaydır
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-6">
          <div className="billing-scrollbar overflow-x-auto px-1 pb-4">
            <div className="flex min-w-max gap-4 px-5 snap-x snap-mandatory">
              {PLAN_CONFIGS.map((plan) => {
                const isActive = plan.id === currentPlan
                const availableCount = modules.filter((module) => planAllows(plan.id, module.requiredPlan)).length
                const borderClass = plan.accentClassName.split(' ').find((item) => item.startsWith('border-'))
                const accentSurface = plan.accentClassName
                  .replace('border-cyan-200', 'border-cyan-100')
                  .replace('border-blue-200', 'border-blue-100')
                  .replace('border-amber-200', 'border-amber-100')
                  .replace('border-slate-200', 'border-slate-100')

                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      'relative w-[268px] shrink-0 snap-start overflow-hidden border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:w-[282px]',
                      isActive ? 'border-primary/30 ring-2 ring-primary/15 shadow-primary/10' : borderClass
                    )}
                  >
                    <div className={cn('h-1.5 w-full', accentSurface.split(' ')[1] ?? 'bg-slate-100')} />
                    <CardContent className="flex h-full min-h-[388px] flex-col p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-2 inline-flex rounded-full border border-primary/10 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
                            {plan.badgeLabel}
                          </div>
                          <h3 className="text-lg font-semibold tracking-tight">{plan.name}</h3>
                        </div>
                        {isActive && <Badge>Aktif</Badge>}
                      </div>

                      <div className="mb-4">
                        <p className="text-[28px] font-bold leading-none tracking-tight">{plan.price}</p>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                      </div>

                      <div className={cn('mb-5 rounded-2xl border px-4 py-3 text-sm', accentSurface)}>
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Modül Erişimi</p>
                        <p className="mt-1 font-medium text-foreground">
                          <span className="font-bold">{availableCount}</span> modül bu pakette aktif olur
                        </p>
                      </div>

                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 leading-5">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[11px] text-emerald-600">
                              ✓
                            </span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-auto pt-5">
                        {!isActive ? (
                          <>
                            <Button
                              className="h-10 w-full rounded-xl"
                              variant={plan.id === 'custom' ? 'outline' : 'default'}
                              onClick={() => handleUpgradeClick(plan.id)}
                            >
                              {plan.id === 'custom' ? 'Satış Ekibiyle Görüş' : 'Geçiş Yap'}
                            </Button>
                          </>
                        ) : (
                          <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-primary">
                            Bu paket şu anda demoda aktif.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan Geçişi Sonrası Modül Durumu</CardTitle>
          <CardDescription>Demo geçişte uygun modüller otomatik açılır, üst paket isteyenler kullanılamaz olur.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium text-emerald-900">Aktif Modüller</p>
              <Badge variant="success">{available.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {available.map((module) => (
                <span key={module.id} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                  {module.name}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-medium text-amber-900">Kullanılamayan Modüller</p>
              <Badge variant="warning">{unavailable.length}</Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {unavailable.map((module) => (
                <span key={module.id} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
                  {module.name}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SecuritySettings() {
  const { data: settings } = useBusinessSettings()
  const saveMutation = useSaveBusinessSettings()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  const [twoFAError, setTwoFAError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const dispatch = useAppDispatch()

  const TOTP_KEY = 'JBSWY3DPEHPK3PXP'

  function changePassword() {
    setError('')
    if (!current) { setError('Mevcut şifrenizi girin.'); return }
    if (next.length < 8) { setError('Yeni şifre en az 8 karakter olmalıdır.'); return }
    if (next !== confirm) { setError('Yeni şifreler eşleşmiyor.'); return }
    api.put('/auth/change-password', { currentPassword: current, newPassword: next })
      .then(() => {
        setCurrent(''); setNext(''); setConfirm('')
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      })
      .catch((err) => {
        const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? 'Şifre güncellenemedi.'
        setError(msg)
      })
  }

  async function toggle2FA() {
    if (!settings) return
    if (!settings.twoFactorEnabled) {
      setShow2FAModal(true)
    } else {
      await saveMutation.mutateAsync({ ...settings, twoFactorEnabled: false })
    }
  }

  async function confirm2FA() {
    if (twoFACode.length !== 6) { setTwoFAError('6 haneli kodu girin.'); return }
    if (!settings) return
    await saveMutation.mutateAsync({ ...settings, twoFactorEnabled: true })
    setShow2FAModal(false)
    setTwoFACode('')
    setTwoFAError('')
  }

  return (
    <div className="space-y-6">
      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background shadow-xl">
            <div className="border-b p-5">
              <h3 className="text-lg font-semibold">İki Faktörlü Doğrulama Kurulumu</h3>
              <p className="text-sm text-muted-foreground mt-1">Google Authenticator veya Authy uygulamasını kullanın</p>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-1">
                <p className="text-sm font-medium">1. Authenticator uygulamanızı açın</p>
                <p className="text-xs text-muted-foreground">Google Authenticator, Authy veya benzer bir TOTP uygulaması kullanın.</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">2. Kurulum anahtarını girin</p>
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                  <code className="flex-1 font-mono text-sm tracking-wider select-all">{TOTP_KEY}</code>
                  <button
                    onClick={() => navigator.clipboard.writeText(TOTP_KEY)}
                    className="text-xs text-primary hover:underline shrink-0"
                  >
                    Kopyala
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Uygulamanızda "Manuel Giriş" seçeneği ile bu anahtarı ekleyin.</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">3. Doğrulama kodunu girin</p>
                <input
                  value={twoFACode}
                  onChange={e => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-center text-xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
                {twoFAError && <p className="text-sm text-red-500">{twoFAError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <Button variant="outline" size="sm" onClick={() => { setShow2FAModal(false); setTwoFACode(''); setTwoFAError('') }}>İptal</Button>
              <Button size="sm" onClick={confirm2FA} disabled={saveMutation.isPending || twoFACode.length < 6}>
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "2FA'yı Etkinleştir"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Şifre Değiştir</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Mevcut Şifre</label>
            <input
              type="password"
              value={current}
              onChange={e => setCurrent(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Yeni Şifre</label>
            <input
              type="password"
              value={next}
              onChange={e => setNext(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="En az 8 karakter"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Yeni Şifre (Tekrar)</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-sm text-emerald-600">✓ Şifre güncellendi</span>}
            <Button onClick={changePassword}>Şifreyi Güncelle</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>İki Faktörlü Doğrulama</CardTitle>
          <CardDescription>Hesabınızı daha güvenli hale getirin</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">2FA Durumu</p>
              <p className="text-xs text-muted-foreground">{settings?.twoFactorEnabled ? 'Etkin — TOTP ile doğrulama' : 'Şu anda devre dışı'}</p>
            </div>
            <Button
              variant={settings?.twoFactorEnabled ? 'secondary' : 'outline'}
              size="sm"
              onClick={toggle2FA}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : settings?.twoFactorEnabled ? 'Devre Dışı Bırak' : '2FA Etkinleştir'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Hesabı Sil</CardTitle>
          <CardDescription>Hesabınızı kalıcı olarak silmek istediğinizden emin misiniz?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-2 mb-4">
            <p className="text-sm font-semibold text-red-800">Bu işlem geri alınamaz</p>
            <ul className="space-y-1 text-sm text-red-700 list-disc list-inside">
              <li>Tüm hesap bilgileriniz kalıcı olarak silinecek</li>
              <li>Randevu geçmişiniz ve müşteri verileriniz kaybolacak</li>
              <li>Aktif aboneliğiniz varsa iptal edilecek</li>
            </ul>
          </div>
          <Button
            variant="destructive"
            onClick={() => { setShowDeleteModal(true); setDeletePassword(''); setDeleteError('') }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hesabımı Sil
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-background shadow-xl">
            <div className="flex items-center gap-3 border-b p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Hesabınızı silmek üzeresiniz</h3>
                <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Hesabınızı kalıcı olarak silmek için lütfen şifrenizi girin.
              </p>
              <div>
                <label className="mb-1.5 block text-sm font-medium">Şifre</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t p-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setDeleteError('') }}
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deleting || !deletePassword}
                onClick={async () => {
                  setDeleting(true)
                  setDeleteError('')
                  try {
                    await api.delete('/users/me', { data: { password: deletePassword } })
                    dispatch(logout())
                    window.location.href = '/login'
                  } catch (err: any) {
                    const msg = err?.response?.data?.detail ?? err?.response?.data?.message ?? 'Hesap silinemedi. Şifreniz hatalı olabilir.'
                    setDeleteError(msg)
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Evet, Hesabımı Sil'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IntegrationsSettings() {
  const [connected, setConnected] = useState<Record<string, boolean>>({
    'google-cal': false,
    'whatsapp': false,
    'iyzico': true,
    'zoom': false,
    'slack': false,
  })
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [whatsappToken, setWhatsappToken] = useState('')
  const [iyzicoApiKey, setIyzicoApiKey] = useState('')
  const [iyzicoSecretKey, setIyzicoSecretKey] = useState('')
  const [iyzicoSandbox, setIyzicoSandbox] = useState(true)
  const [slackWebhook, setSlackWebhook] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [zoomClientId, setZoomClientId] = useState('')
  const [zoomClientSecret, setZoomClientSecret] = useState('')
  const [googleClientId, setGoogleClientId] = useState('')
  const [toast, setToast] = useState('')

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  function toggleExpanded(key: string) {
    setExpandedKey(prev => prev === key ? null : key)
  }

  function connect(key: string, msg?: string) {
    setConnected(prev => ({ ...prev, [key]: true }))
    setExpandedKey(null)
    showToast(msg ?? 'Bağlantı kuruldu')
  }

  function disconnect(key: string) {
    setConnected(prev => ({ ...prev, [key]: false }))
    showToast('Bağlantı kesildi')
  }

  const integrations = [
    { key: 'google-cal', name: 'Google Takvim', desc: 'Randevularınızı Google Takvim ile otomatik senkronize edin', type: 'oauth', logo: '📅', docsUrl: 'https://developers.google.com/calendar' },
    { key: 'whatsapp', name: 'WhatsApp Business', desc: 'WhatsApp Cloud API ile randevu hatırlatması ve bildirim gönderin', type: 'api-key', logo: '💬', docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api' },
    { key: 'iyzico', name: 'Iyzico', desc: 'Online ödeme alın — kredi kartı, 3D Secure ve taksit desteği', type: 'api-key', logo: '💳', docsUrl: 'https://dev.iyzipay.com' },
    { key: 'zoom', name: 'Zoom', desc: 'Online hizmetler için otomatik Zoom toplantısı oluşturun', type: 'oauth', logo: '📹', docsUrl: 'https://marketplace.zoom.us/docs/api-reference' },
    { key: 'slack', name: 'Slack', desc: 'Yeni randevu ve önemli olayları Slack kanalınıza bildirin', type: 'webhook', logo: '💼', docsUrl: 'https://api.slack.com/messaging/webhooks' },
  ]

  function renderConfig(key: string) {
    if (key === 'google-cal') return (
      <div className="border-t bg-muted/30 p-4 space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800">Google Takvim OAuth 2.0 yetkilendirmesi gerektirir. Yalnızca takvim okuma/yazma izni istenir; diğer Google hizmetlerine erişilmez.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Google Client ID <span className="text-muted-foreground">(kurumsal, opsiyonel)</span></label>
          <input value={googleClientId} onChange={e => setGoogleClientId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="xxxxxx.apps.googleusercontent.com" />
        </div>
        <div className="rounded-lg border bg-background px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">Verilecek izinler:</p>
          <p>✓ Google Takvim okuma ve yazma</p>
          <p>✓ Etkinlik oluşturma ve güncelleme</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpandedKey(null)}>İptal</Button>
          <Button size="sm" onClick={() => connect('google-cal', 'Google Takvim bağlandı')}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Google ile Yetkilendir
          </Button>
        </div>
      </div>
    )

    if (key === 'whatsapp') return (
      <div className="border-t bg-muted/30 p-4 space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">WhatsApp Cloud API için Meta Business hesabı ve onaylı iş telefonu gereklidir. Meta Developers portalında uygulama oluşturun.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Telefon Numarası ID</label>
            <input value={whatsappPhone} onChange={e => setWhatsappPhone(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="1234567890" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Erişim Token'ı</label>
            <input type="password" value={whatsappToken} onChange={e => setWhatsappToken(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Bearer token..." />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpandedKey(null)}>İptal</Button>
          <Button size="sm" onClick={() => connect('whatsapp', 'WhatsApp yapılandırması kaydedildi')} disabled={!whatsappPhone || !whatsappToken}>
            <Phone className="h-3.5 w-3.5 mr-1" /> Kaydet & Bağlan
          </Button>
        </div>
      </div>
    )

    if (key === 'iyzico') return (
      <div className="border-t bg-muted/30 p-4 space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            API anahtarlarınızı{' '}
            <a href="https://merchant.iyzipay.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Iyzico Merchant Portal</a>'dan alabilirsiniz.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">API Anahtarı</label>
            <input value={iyzicoApiKey} onChange={e => setIyzicoApiKey(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="sandbox-xxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Gizli Anahtar</label>
            <input type="password" value={iyzicoSecretKey} onChange={e => setIyzicoSecretKey(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="sandbox-xxxxxxxxxxxxxxxxxxxxxxxx" />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2.5">
          <div>
            <p className="text-sm font-medium">Sandbox Modu</p>
            <p className="text-xs text-muted-foreground">Test ödemeleri için sandbox ortamını kullan</p>
          </div>
          <label className="relative flex shrink-0 cursor-pointer items-center">
            <input type="checkbox" checked={iyzicoSandbox} onChange={e => setIyzicoSandbox(e.target.checked)} className="sr-only peer" />
            <div className="peer h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-primary after:absolute after:left-0.5 after:top-0.5 after:h-4 after:w-4 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-4" />
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpandedKey(null)}>İptal</Button>
          <Button size="sm" onClick={() => connect('iyzico', 'Iyzico ödeme entegrasyonu aktif')} disabled={!iyzicoApiKey || !iyzicoSecretKey}>
            Kaydet & Bağlan
          </Button>
        </div>
      </div>
    )

    if (key === 'zoom') return (
      <div className="border-t bg-muted/30 p-4 space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-800">Zoom Marketplace'de bir OAuth uygulaması oluşturun. Client ID ve Secret bilgilerini girin, ardından yetkilendirin.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium">Client ID</label>
            <input value={zoomClientId} onChange={e => setZoomClientId(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Zoom Client ID" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium">Client Secret</label>
            <input type="password" value={zoomClientSecret} onChange={e => setZoomClientSecret(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Zoom Client Secret" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpandedKey(null)}>İptal</Button>
          <Button size="sm" onClick={() => connect('zoom', 'Zoom bağlandı')} disabled={!zoomClientId || !zoomClientSecret}>
            <ExternalLink className="h-3.5 w-3.5 mr-1" /> Zoom ile Yetkilendir
          </Button>
        </div>
      </div>
    )

    if (key === 'slack') return (
      <div className="border-t bg-muted/30 p-4 space-y-4">
        <div className="flex items-start gap-2 rounded-lg bg-purple-50 border border-purple-200 p-3">
          <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
          <p className="text-xs text-purple-800">Slack Workspace ayarlarınızda Apps → Incoming Webhooks kısmından kanal bazlı webhook URL alın.</p>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Webhook URL</label>
          <input value={slackWebhook} onChange={e => setSlackWebhook(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="https://hooks.slack.com/services/..." />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium">Kanal <span className="text-muted-foreground">(opsiyonel)</span></label>
          <input value={slackChannel} onChange={e => setSlackChannel(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="#randevular" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setExpandedKey(null)}>İptal</Button>
          <Button size="sm" onClick={() => connect('slack', 'Slack webhook kaydedildi')} disabled={!slackWebhook}>
            Kaydet & Bağlan
          </Button>
        </div>
      </div>
    )

    return null
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 border border-emerald-200">
          ✓ {toast}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Entegrasyonlar</CardTitle>
          <CardDescription>Üçüncü taraf servislerle bağlantı kurun. Gerçek bir ortamda OAuth akışları backend üzerinden yürütülür.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {integrations.map(({ key, name, desc, type, logo, docsUrl }) => (
              <div key={key} className="rounded-xl border overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{logo}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{name}</p>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', type === 'oauth' ? 'bg-blue-100 text-blue-700' : type === 'api-key' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700')}>
                          {type === 'oauth' ? 'OAuth' : type === 'api-key' ? 'API Key' : 'Webhook'}
                        </span>
                        {connected[key] ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold"><CheckCircle2 className="h-3 w-3" /> Bağlı</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground"><XCircle className="h-3 w-3" /> Bağlı değil</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ExternalLink className="h-3 w-3" /> Döküman
                    </a>
                    {connected[key] ? (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => toggleExpanded(key)}>
                          {expandedKey === key ? 'Kapat' : 'Düzenle'}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs text-red-500 h-7 hover:text-red-600 hover:bg-red-50" onClick={() => disconnect(key)}>
                          Kes
                        </Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => toggleExpanded(key)}>
                        {expandedKey === key ? 'Kapat' : 'Yapılandır'} <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
                {expandedKey === key && renderConfig(key)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function SettingsPage() {
  const navigate = useNavigate()
  const location = useLocation()

  // Derive active tab from URL sub-path: /settings/profile → 'profile'
  const subPath = location.pathname.replace(/^\/settings\/?/, '') as SettingsTab
  const validTabs = tabs.map(t => t.id)
  const activeTab: SettingsTab = validTabs.includes(subPath) ? subPath : 'general'

  function setTab(id: SettingsTab) {
    navigate(`/settings/${id}`, { replace: true })
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileSettings />
      case 'general': return <GeneralSettings />
      case 'hours': return <WorkingHoursSettings />
      case 'notifications': return <NotificationSettings />
      case 'security': return <SecuritySettings />
      case 'integrations': return <IntegrationsSettings />
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ayarlar" description="İşletme ve hesap ayarlarınızı yönetin" />

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        {/* Sidebar nav */}
        <nav className="flex shrink-0 flex-row gap-1 overflow-x-auto lg:w-52 lg:flex-col lg:overflow-x-visible">
          {tabs.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                activeTab === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-left">{label}</span>
              {badge && (
                <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                  {badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{renderContent()}</div>
      </div>
    </div>
  )
}

