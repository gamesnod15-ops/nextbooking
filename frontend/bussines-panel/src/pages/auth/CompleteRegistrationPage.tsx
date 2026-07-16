import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { AlertCircle, ArrowRight, Loader2, CheckCircle, User, Building2, MapPin, Globe, FileText } from 'lucide-react'
import { useCompleteOAuthRegistration } from '@/hooks/useAuth'
import { showToast } from '@/components/ui/Toast'

interface LocationState {
  provider: string
  providerUserId: string
  email: string
  fullName: string
  avatarUrl: string | null
}

const USAGE_PURPOSES = [
  { value: 'guzellik-salonu', label: 'Güzellik Salonu / Kuaför' },
  { value: 'klinik', label: 'Klinik / Sağlık' },
  { value: 'spor', label: 'Spor / Fitness' },
  { value: 'danismanlik', label: 'Danışmanlık / Eğitim' },
  { value: 'teknik-servis', label: 'Teknik Servis' },
  { value: 'diger', label: 'Diğer' },
]

const COUNTRIES = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'DE', name: 'Almanya' },
  { code: 'US', name: 'Amerika Birleşik Devletleri' },
  { code: 'GB', name: 'Birleşik Krallık' },
  { code: 'NL', name: 'Hollanda' },
  { code: 'FR', name: 'Fransa' },
  { code: 'AE', name: 'Birleşik Arap Emirlikleri' },
  { code: 'AZ', name: 'Azerbaycan' },
]

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  TR: ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Mersin', 'Kocaeli', 'Eskişehir', 'Trabzon', 'Samsun', 'Denizli', 'Diyarbakır'],
  DE: ['Berlin', 'Münih', 'Hamburg', 'Frankfurt', 'Köln', 'Stuttgart', 'Düsseldorf'],
  US: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Seattle', 'Boston'],
  GB: ['Londra', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Liverpool'],
  NL: ['Amsterdam', 'Rotterdam', 'Lahey', 'Utrecht', 'Eindhoven'],
  FR: ['Paris', 'Lyon', 'Marsilya', 'Nice', 'Bordeaux', 'Toulouse'],
  AE: ['Dubai', 'Abu Dabi', 'Sharjah'],
  AZ: ['Bakü', 'Gence', 'Sumgayıt'],
}

export function CompleteRegistrationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  const completeMutation = useCompleteOAuthRegistration()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    businessName: '',
    country: '',
    city: '',
    purpose: '',
    agreedToTerms: false,
  })
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (state) {
      const names = state.fullName?.split(' ') || ['', '']
      setForm((prev) => ({
        ...prev,
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        email: state.email || '',
      }))
    }
  }, [state])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.firstName.trim()) errs.firstName = 'Ad gereklidir.'
    if (!form.lastName.trim()) errs.lastName = 'Soyad gereklidir.'
    if (!form.email.trim()) errs.email = 'E-posta gereklidir.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli bir e-posta girin.'
    if (!form.phone.trim()) errs.phone = 'Telefon gereklidir.'
    else if (form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Geçerli bir telefon numarası girin.'
    if (!form.username.trim()) errs.username = 'Kullanıcı adı gereklidir.'
    else if (!/^[a-z0-9_-]{3,}$/i.test(form.username)) errs.username = 'En az 3 karakter, yalnızca harf, rakam, - ve _'
    if (!form.country) errs.country = 'Ülke seçiniz.'
    if (!form.city) errs.city = 'Şehir seçiniz.'
    if (!form.purpose) errs.purpose = 'Kullanım amacı seçiniz.'
    if (!form.agreedToTerms) errs.agreedToTerms = 'Kullanım şartlarını kabul etmelisiniz.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate() || !state) return

    try {
      await completeMutation.mutateAsync({
        provider: state.provider,
        providerUserId: state.providerUserId,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone.replace(/\s/g, ''),
        username: form.username,
        businessName: form.businessName || undefined,
        country: form.country,
        city: form.city,
        purpose: form.purpose,
        agreedToTerms: form.agreedToTerms,
        avatarUrl: state.avatarUrl,
      })
      setSuccess(true)
      showToast('success', 'Kayıt tamamlandı', 'Hesabınız başarıyla oluşturuldu.')
      setTimeout(() => navigate('/user/dashboard'), 2000)
    } catch {
      showToast('error', 'Kayıt başarısız', 'Bir hata oluştu. Lütfen tekrar deneyin.')
    }
  }

  function formatPhoneDisplay(raw: string) {
    const digits = raw.replace(/\D/g, '')
    const local = digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
    const d = local.slice(0, 10)
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
    setForm((prev) => ({ ...prev, phone: digits }))
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-10 text-center shadow-xl">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Geçersiz Oturum</h2>
          <p className="mt-2 text-gray-600">Bu sayfaya doğrudan erişemezsiniz. Lütfen giriş yapın.</p>
          <Link to="/login" className="mt-6 inline-block rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Kaydınız Tamamlandı!</h2>
          <p className="mt-3 text-gray-600">Hesabınız başarıyla oluşturuldu. Panelinize yönlendiriliyorsunuz...</p>
        </div>
      </div>
    )
  }

  const cities = form.country ? CITIES_BY_COUNTRY[form.country] || [] : []

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2">
            <img src="/logo.png" alt="NextBooking" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl sm:p-10">
          <div className="mb-6 text-center">
            {state.avatarUrl && (
              <img src={state.avatarUrl} alt="" className="mx-auto mb-4 h-20 w-20 rounded-full border-4 border-brand-100 object-cover" />
            )}
            <h1 className="text-2xl font-extrabold text-gray-900">Hesabını Tamamla</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              <strong>{state.provider}</strong> hesabınızla giriş yapıldı. Eksik bilgileri tamamlayın.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {errors.general && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
                <User className="h-5 w-5 text-brand-500" />
                Kişisel Bilgiler
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ad" error={errors.firstName}>
                  <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Adınız" className={inputClass(!!errors.firstName)} />
                </Field>
                <Field label="Soyad" error={errors.lastName}>
                  <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Soyadınız" className={inputClass(!!errors.lastName)} />
                </Field>
              </div>
              <div className="mt-4 space-y-4">
                <Field label="E-posta Adresi" error={errors.email}>
                  <input type="email" value={form.email} onChange={set('email')} placeholder="ornek@email.com" className={inputClass(!!errors.email)} />
                </Field>
                <Field label="Telefon Numarası" error={errors.phone}>
                  <div className={`flex w-full overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-brand-500/40 transition-shadow ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}>
                    <span className="flex shrink-0 select-none items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                      🇹🇷 +90
                    </span>
                    <input
                      type="tel"
                      value={formatPhoneDisplay(form.phone)}
                      onChange={handlePhoneChange}
                      placeholder="555 000 00 00"
                      className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </Field>
                <Field label="Kullanıcı Adı" error={errors.username} hint="Panelinize girişte kullanacağınız benzersiz kullanıcı adı">
                  <input type="text" value={form.username} onChange={set('username')} placeholder="kullaniciadiniz" className={inputClass(!!errors.username)} />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-brand-500" />
                İşletme Bilgileri (Opsiyonel)
              </h2>
              <div className="space-y-4">
                <Field label="Şirket / İşletme Adı" error={errors.businessName} hint="Bir işletmeniz varsa adını girin">
                  <input type="text" value={form.businessName} onChange={set('businessName')} placeholder="İşletme adı" className={inputClass(!!errors.businessName)} />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-brand-500" />
                Konum Bilgileri
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Ülke" error={errors.country}>
                  <select value={form.country} onChange={set('country')} className={inputClass(!!errors.country)}>
                    <option value="">Ülke seçin…</option>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Şehir" error={errors.city}>
                  <select value={form.city} onChange={set('city')} className={inputClass(!!errors.city)} disabled={!form.country}>
                    <option value="">Şehir seçin…</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-brand-500" />
                Kullanım Amacı
              </h2>
              <Field label="Platformu ne amaçla kullanacaksınız?" error={errors.purpose}>
                <select value={form.purpose} onChange={set('purpose')} className={inputClass(!!errors.purpose)}>
                  <option value="">Seçin…</option>
                  {USAGE_PURPOSES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-500" />
                Sözleşme Onayı
              </h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.agreedToTerms}
                    onChange={(e) => setForm((prev) => ({ ...prev, agreedToTerms: e.target.checked }))}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  <span className="text-sm text-gray-600">
                    <Link to="/terms" className="font-semibold text-brand-500 hover:underline">Kullanım Şartları</Link>
                    {' '}ve{' '}
                    <Link to="/privacy" className="font-semibold text-brand-500 hover:underline">Gizlilik Politikası</Link>
                    {' '}nı okudum ve kabul ediyorum. KVKK kapsamında kişisel verilerimin işlenmesine onay veriyorum.
                  </span>
                </label>
                {errors.agreedToTerms && <p className="text-xs text-red-500">{errors.agreedToTerms}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={completeMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {completeMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor…</>
              ) : (
                <>Kaydı Tamamla <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors',
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-gray-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
  ].join(' ')
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
