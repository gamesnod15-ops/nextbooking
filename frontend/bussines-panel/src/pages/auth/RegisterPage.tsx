import { useState, useId, cloneElement, isValidElement } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useTenantRegister } from '@/hooks/useAuth'
import { showToast } from '@/components/ui/Toast'
import { GoogleIcon, AppleIcon } from '@/lib/icons'
import { startOAuthLogin } from '@/lib/oauth'

// Mirrors the backend's BusinessCategory enum — same list used on the web
// app's own /register page.
const BUSINESS_CATEGORIES = [
  { value: 1,  label: 'Güzellik Salonu' },
  { value: 2,  label: 'Kuaför / Berber' },
  { value: 3,  label: 'Klinik' },
  { value: 4,  label: 'Diş Kliniği' },
  { value: 5,  label: 'Fizyoterapi' },
  { value: 6,  label: 'Spor Salonu' },
  { value: 7,  label: 'Kişisel Antrenör' },
  { value: 8,  label: 'Yoga & Pilates' },
  { value: 9,  label: 'Spa & Masaj' },
  { value: 10, label: 'Tırnak Salonu' },
  { value: 11, label: 'Dövme Stüdyosu' },
  { value: 12, label: 'Veteriner' },
  { value: 13, label: 'Oto Servis' },
  { value: 14, label: 'Oto Yıkama' },
  { value: 15, label: 'Teknik Servis' },
  { value: 16, label: 'Danışmanlık' },
  { value: 17, label: 'Psikolog' },
  { value: 18, label: 'Beslenme Uzmanı' },
  { value: 19, label: 'Özel Ders' },
  { value: 20, label: 'Fotoğrafçı' },
  { value: 99, label: 'Diğer' },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface FormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  businessName: string
  subdomain: string
  businessCategory: string
  password: string
  confirmPassword: string
}

const INITIAL: FormState = {
  firstName: '', lastName: '', email: '', phone: '',
  businessName: '', subdomain: '', businessCategory: '',
  password: '', confirmPassword: '',
}

const inputCls = (hasError: boolean) => [
  'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors',
  hasError
    ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
    : 'border-gray-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
].join(' ')

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  const id = useId()
  // Only clone a direct input/select control — compound fields (e.g. the
  // phone field's flag-prefix wrapper div) render their own labelled control.
  const isFormControl = isValidElement(children) && typeof children.type === 'string' && ['input', 'select', 'textarea'].includes(children.type)
  const control = isFormControl ? cloneElement(children as React.ReactElement<{ id?: string }>, { id }) : children
  return (
    <div>
      <label htmlFor={isFormControl ? id : undefined} className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {control}
      {hint && !error && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useTenantRegister()

  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'businessName') next.subdomain = slugify(value)
      return next
    })
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
    setForm((prev) => ({ ...prev, phone: digits ? `+90${digits}` : '' }))
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.firstName.trim()) errs.firstName = 'Ad gereklidir.'
    if (!form.lastName.trim()) errs.lastName = 'Soyad gereklidir.'
    if (!form.email.trim()) errs.email = 'E-posta gereklidir.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli bir e-posta girin.'
    if (!form.phone.trim()) errs.phone = 'Telefon gereklidir.'
    else if (form.phone.replace(/\D/g, '').length < 12) errs.phone = 'Geçerli bir telefon numarası girin.'
    if (!form.businessName.trim()) errs.businessName = 'İşletme adı gereklidir.'
    if (!form.subdomain.trim()) errs.subdomain = 'Firma kullanıcı adı gereklidir.'
    else if (!/^[a-z0-9-]{3,50}$/.test(form.subdomain)) errs.subdomain = 'Yalnızca küçük harf, rakam ve tire (-) kullanabilirsiniz (3-50 karakter).'
    if (!form.businessCategory) errs.businessCategory = 'İşletme kategorisi seçiniz.'
    if (!form.password) errs.password = 'Şifre gereklidir.'
    else if (form.password.length < 8) errs.password = 'Şifre en az 8 karakter olmalıdır.'
    else if (!/[A-Z]/.test(form.password)) errs.password = 'Şifre en az bir büyük harf içermelidir.'
    else if (!/[0-9]/.test(form.password)) errs.password = 'Şifre en az bir rakam içermelidir.'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Şifreler eşleşmiyor.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    try {
      await registerMutation.mutateAsync({
        businessName: form.businessName.trim(),
        subdomain: form.subdomain,
        ownerEmail: form.email,
        ownerPassword: form.password,
        ownerFirstName: form.firstName,
        ownerLastName: form.lastName,
        ownerPhone: form.phone.replace(/\s/g, ''),
        businessCategory: parseInt(form.businessCategory, 10),
      })
      setSuccess(true)
      showToast('success', 'Hesabınız oluşturuldu', 'Panelinize yönlendiriliyorsunuz.')
      setTimeout(() => navigate('/onboarding'), 1200)
    } catch (err) {
      const apiErr = err as { response?: { status?: number; data?: { message?: string } } }
      const status = apiErr.response?.status
      const msg = apiErr.response?.data?.message?.toLowerCase() ?? ''
      if (status === 409) {
        if (msg.includes('subdomain')) setErrors({ subdomain: 'Bu firma kullanıcı adı zaten alınmış.' })
        else if (msg.includes('email')) setErrors({ email: 'Bu e-posta adresi zaten kayıtlı.' })
        else setErrors({ general: apiErr.response?.data?.message || 'Bir hata oluştu.' })
      } else {
        setErrors({ general: apiErr.response?.data?.message || 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.' })
      }
      showToast('error', 'Kayıt başarısız', 'Lütfen bilgilerinizi kontrol edip tekrar deneyin.')
    }
  }

  if (success) {
    return (
      <div className="login-bg" style={{ position: 'fixed', inset: 0 }}>
        <div className="login-wrapper">
          <div className="login-card" style={{ textAlign: 'center' }}>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Hesabınız Oluşturuldu!</h2>
            <p className="mt-3 text-gray-600">Panelinize yönlendiriliyorsunuz…</p>
            <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-brand-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="login-bg">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
        <div className="grid-dot grid-dot-left" />
        <div className="grid-dot grid-dot-right" />
      </div>

      <div className="login-wrapper" style={{ padding: '40px 20px' }}>
        <div className="login-card" style={{ width: 520 }}>
          <div className="login-logo">
            <img src="/icon-site.png" alt="JetRandevu" />
          </div>
          <h1 className="login-title">Hesap Oluşturun</h1>
          <p className="login-subtitle">14 gün ücretsiz kullanın. Kredi kartı gerekmez.</p>

          <form onSubmit={handleSubmit} noValidate className="login-form space-y-4">
            {errors.general && (
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{errors.general}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ad" error={errors.firstName}>
                <input type="text" value={form.firstName} onChange={set('firstName')} placeholder="Ahmet" autoComplete="given-name" className={inputCls(!!errors.firstName)} />
              </Field>
              <Field label="Soyad" error={errors.lastName}>
                <input type="text" value={form.lastName} onChange={set('lastName')} placeholder="Yılmaz" autoComplete="family-name" className={inputCls(!!errors.lastName)} />
              </Field>
            </div>

            <Field label="E-posta Adresi" error={errors.email}>
              <input type="email" value={form.email} onChange={set('email')} placeholder="ornek@email.com" autoComplete="email" className={inputCls(!!errors.email)} />
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
                  autoComplete="tel"
                  className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                />
              </div>
            </Field>

            <Field label="İşletme Adı" error={errors.businessName}>
              <input type="text" value={form.businessName} onChange={set('businessName')} placeholder="Yılmaz Kuaför" autoComplete="organization" className={inputCls(!!errors.businessName)} />
            </Field>

            <Field
              label="Firma Kullanıcı Adı (Subdomain)"
              error={errors.subdomain}
              hint="Bu adres randevu sayfanızın URL'i olacak: jetrandevu.com/firma-adi"
            >
              <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                <span className="flex items-center whitespace-nowrap border-r border-gray-300 bg-gray-50 px-3 text-xs text-gray-500">
                  jetrandevu.com/
                </span>
                <input type="text" value={form.subdomain} onChange={set('subdomain')} placeholder="yilmaz-kuafor" className="flex-1 bg-white px-3 py-2.5 text-sm outline-none" />
              </div>
            </Field>

            <Field label="İşletme Kategorisi" error={errors.businessCategory}>
              <select value={form.businessCategory} onChange={set('businessCategory')} className={inputCls(!!errors.businessCategory)}>
                <option value="">Kategori seçin…</option>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Şifre" error={errors.password}>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder="En az 8 karakter" autoComplete="new-password" className={`${inputCls(!!errors.password)} pr-9`} />
                  <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
              <Field label="Şifre Tekrar" error={errors.confirmPassword}>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Tekrar girin" autoComplete="new-password" className={`${inputCls(!!errors.confirmPassword)} pr-9`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>

            <p className="text-center text-xs text-gray-500">
              Kayıt olarak <Link to="/terms" className="text-brand-500 hover:underline">Kullanım Şartları</Link>'nı kabul etmiş sayılırsınız.
            </p>

            <button type="submit" disabled={registerMutation.isPending}
              className={`login-submit ${registerMutation.isPending ? 'login-loading' : ''}`}>
              <span>{registerMutation.isPending ? 'Hesap Oluşturuluyor…' : 'Ücretsiz Hesap Oluştur'}</span>
              <ArrowRight className="arrow-icon" size={22} />
            </button>
          </form>

          <div className="login-divider">
            <span>veya</span>
          </div>

          <div className="flex justify-center gap-4">
            <button type="button" onClick={() => startOAuthLogin('google')} aria-label="Google ile devam et"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <GoogleIcon size={20} />
            </button>
            <button type="button" onClick={() => startOAuthLogin('apple')} aria-label="Apple ile devam et"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <AppleIcon size={20} className="text-gray-900" />
            </button>
          </div>

          <div className="login-register mt-4">
            Zaten hesabınız var mı? <Link to="/login">Giriş Yap</Link>
          </div>
        </div>
      </div>
    </>
  )
}
