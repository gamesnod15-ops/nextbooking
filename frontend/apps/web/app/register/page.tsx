'use client'

import { useState, useEffect, useId, cloneElement, isValidElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CalendarCheck, CalendarClock, MessageSquareText, ChartNoAxesColumn, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'

// Business categories mapped from the backend BusinessCategory enum
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

function generateChallenge() {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return { a, b, answer: a + b }
}

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
  address: string
  businessName: string
  subdomain: string
  businessCategory: string
  password: string
  confirmPassword: string
  captchaAnswer: string
  // honeypot — must remain empty
  website_url: string
}

const INITIAL: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  address: '',
  businessName: '',
  subdomain: '',
  businessCategory: '',
  password: '',
  confirmPassword: '',
  captchaAnswer: '',
  website_url: '',
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'En az 8 karakter',    ok: password.length >= 8 },
    { label: 'Büyük harf içerir',   ok: /[A-Z]/.test(password) },
    { label: 'Rakam içerir',        ok: /[0-9]/.test(password) },
  ]
  const strength = checks.filter((c) => c.ok).length
  const colors = ['bg-red-400', 'bg-yellow-400', 'bg-emerald-400']
  const labels = ['Zayıf', 'Orta', 'Güçlü']

  if (!password) return null
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? colors[strength - 1] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength === 3 ? 'text-emerald-600' : strength === 2 ? 'text-yellow-600' : 'text-red-500'}`}>
        {labels[strength - 1] ?? ''}
      </p>
      <ul className="space-y-0.5">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-emerald-600' : 'text-gray-400'}`}>
            <CheckCircle className="h-3 w-3 shrink-0" /> {c.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const honeypotId = useId()
  const [tab, setTab] = useState<'customer' | 'business'>('customer')
  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [challenge, setChallenge] = useState<{ a: number; b: number; answer: number }>({ a: 3, b: 7, answer: 10 })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => { setChallenge(generateChallenge()) }, [])

  // Auto-derive subdomain from business name
  useEffect(() => {
    if (form.businessName) {
      setForm((prev) => ({ ...prev, subdomain: slugify(form.businessName) }))
    }
  }, [form.businessName])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

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

    if (!form.firstName.trim())              errs.firstName = 'Ad gereklidir.'
    if (!form.lastName.trim())               errs.lastName = 'Soyad gereklidir.'
    if (!form.email.trim())                  errs.email = 'E-posta gereklidir.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Geçerli bir e-posta girin.'
    if (!form.phone.trim())                  errs.phone = 'Telefon gereklidir.'
    else if (form.phone.replace(/\D/g, '').length < 12) errs.phone = 'Geçerli bir telefon numarası girin.'
    if (tab === 'business') {
      if (!form.address.trim())              errs.address = 'Adres gereklidir.'
      if (!form.businessName.trim())         errs.businessName = 'İşletme adı gereklidir.'
      if (!form.subdomain.trim())            errs.subdomain = 'Firma kullanıcı adı gereklidir.'
      else if (!/^[a-z0-9-]{3,50}$/.test(form.subdomain)) errs.subdomain = 'Yalnızca küçük harf, rakam ve tire (-) kullanabilirsiniz (3-50 karakter).'
      if (!form.businessCategory)            errs.businessCategory = 'İşletme kategorisi seçiniz.'
    }
    if (!form.password)                      errs.password = 'Şifre gereklidir.'
    else if (form.password.length < 8)       errs.password = 'Şifre en az 8 karakter olmalıdır.'
    else if (!/[A-Z]/.test(form.password))   errs.password = 'Şifre en az bir büyük harf içermelidir.'
    else if (!/[0-9]/.test(form.password))   errs.password = 'Şifre en az bir rakam içermelidir.'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Şifreler eşleşmiyor.'
    if (parseInt(form.captchaAnswer) !== challenge.answer) errs.captchaAnswer = 'Güvenlik sorusunu yanlış yanıtladınız.'

    // Honeypot check
    if (form.website_url) {
      errs.general = 'Bir hata oluştu. Lütfen tekrar deneyin.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})
    try {
      if (tab === 'customer') {
        await api.post('/api/v1/auth/register', {
          firstName:   form.firstName,
          lastName:    form.lastName,
          email:       form.email,
          phone:       form.phone.replace(/\s/g, ''),
          password:    form.password,
        })
        router.push('/isletmeler')
        return
      }

      await api.post('/api/v1/tenants/register', {
        businessName:     form.businessName,
        subdomain:        form.subdomain,
        ownerEmail:       form.email,
        ownerPassword:    form.password,
        ownerFirstName:   form.firstName,
        ownerLastName:    form.lastName,
        ownerPhone:       form.phone.replace(/\s/g, ''),
        ownerAddress:     form.address,
        businessCategory: parseInt(form.businessCategory),
        plan:             'starter',
      })

      // Auto-login after registration
      try {
        const loginRes = await api.post<{
          accessToken: string
          refreshToken: string
          role: string
          userId: string
          fullName: string
          tenantId: string
        }>('/api/v1/auth/login', {
          email: form.email,
          password: form.password,
        })

        localStorage.setItem('accessToken', loginRes.accessToken)
        localStorage.setItem('refreshToken', loginRes.refreshToken)
        localStorage.setItem('role', loginRes.role)
        localStorage.setItem('userId', loginRes.userId)
        localStorage.setItem('fullName', loginRes.fullName)
        localStorage.setItem('tenantId', loginRes.tenantId)
        localStorage.setItem('business_panel_url', `https://next-bussines-ten.vercel.app?autologin=${loginRes.accessToken}&userId=${loginRes.userId}`)

        router.push('/register/onboarding')
      } catch {
        // If auto-login fails, show success page with login link
        setSuccess(true)
      }
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 409) {
        const msg = apiErr.message.toLowerCase()
        if (msg.includes('subdomain')) setErrors({ subdomain: 'Bu firma kullanıcı adı zaten alınmış.' })
        else if (msg.includes('email')) setErrors({ email: 'Bu e-posta adresi zaten kayıtlı.' })
        else setErrors({ general: apiErr.message })
      } else {
        setErrors({ general: apiErr.message || 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.' })
      }
      setChallenge(generateChallenge())
      setForm((prev) => ({ ...prev, captchaAnswer: '' }))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Hesabınız Oluşturuldu!</h2>
          <p className="mt-3 text-gray-600">
            <strong>{form.email}</strong> adresine bir doğrulama e-postası gönderdik.
            Hesabınızı aktifleştirmek için e-postadaki bağlantıya tıklayın.
          </p>
          <div className="mt-6 space-y-3">
            <p className="text-xs text-gray-400">
              E-postayı görmüyor musunuz? Gereksiz (spam) klasörünü kontrol edin.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
              Giriş Yap <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* ——Left panel — brand / value prop ——*/}
      <div className="relative hidden lg:flex flex-col bg-black px-16 py-14 text-white overflow-hidden">
        {/* decorative blobs */}
        <div aria-hidden className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div aria-hidden className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
        {/* Decorative geometric shapes */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute -top-10 -right-10 h-80 w-80 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
            <polygon points="100,0 200,100 100,200 0,100" className="fill-white" />
          </svg>
          <svg className="absolute bottom-10 -left-10 h-56 w-56 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
            <rect x="25" y="25" width="150" height="150" rx="24" className="stroke-white stroke-[1.5]" fill="none" />
            <circle cx="100" cy="100" r="50" className="stroke-white stroke-[1.5]" fill="none" />
          </svg>
        </div>

        {/* Logo */}
        <Link href="/" className="relative shrink-0">
          <img src="/logo-white-last.png" alt="BookingAi" className="h-9 w-auto" />
        </Link>

        {/* Headline */}
        <div className="relative mt-10 flex-1 space-y-8 overflow-y-auto">
          {/* Photo */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80"
              alt="Dijital işletme"
              className="w-full h-52 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-white">
              İşletmenizi<br />
              <span className="text-brand-500">dijitalleştirmenin</span><br />
              en kolay yolu.
            </h1>
            <p className="mt-4 text-base text-gray-400 leading-relaxed max-w-sm">
              14 gün ücretsiz kullanın. Kurulum yok, yazılım yok — tarayıcınızdan anında başlayın.
            </p>
          </div>

          {/* Benefits */}
          <ul className="space-y-3">
            {[
              { icon: <CalendarClock className="h-4 w-4" />, text: '7/24 online randevu — müşterileriniz her yerden rezervasyon yapabilir' },
              { icon: <MessageSquareText className="h-4 w-4" />, text: 'Otomatik SMS & e-posta hatırlatmalar ile hayır-deme oranı %70 azalır' },
              { icon: <ChartNoAxesColumn className="h-4 w-4" />, text: 'Gerçek zamanlı gelir analitiği ve raporlama' },
              { icon: <span className="text-sm">🔒</span>, text: 'Güvenli ödeme altyapısı — İyzico & Stripe entegrasyonu' },
              { icon: <span className="text-sm">⚡</span>, text: '5 dakikada kurulum, 10 dakikada müşteri kabul' },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-sm text-gray-300">
                <span className="shrink-0 mt-0.5">{item.icon}</span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => <span key={i} className={`text-sm ${i < 4 ? 'text-brand-500' : 'text-brand-500/30'}`}>&</span>)}
            </div>
            <p className="text-sm text-gray-300 italic leading-relaxed">
              &ldquo;BookingAi sayesinde telefon trafiğimiz %80 azaldı. Artık müşterilerimizle çok daha fazla ilgilenebiliyoruz.&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold text-brand-500/70">— Zeynep K., Güzellik Salonu Sahibi</p>
          </div>

          {/* Stat row */}
          <div className="flex gap-6">
            {[{ val: '10.000+', lbl: 'İşletme' }, { val: '2M+', lbl: 'Randevu/ay' }, { val: '%99.9', lbl: 'Uptime' }].map(s => (
              <div key={s.lbl}>
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-gray-500">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative mt-8 shrink-0 text-xs text-gray-600">© 2026 BookingAi. Tüm hakları saklıdır.</p>
      </div>

      {/* ——Right panel — form ——*/}
      <div className="flex flex-col">
        {/* Mobile header */}
        <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <CalendarCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">BookingAi</span>
            </Link>
            <p className="text-sm text-gray-500">
              <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                Giriş Yap
              </Link>
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 xl:px-16 overflow-y-auto">
          {/* Desktop login link */}
          <div className="hidden lg:flex justify-end mb-4">
            <p className="text-sm text-gray-500">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                Giriş Yap
              </Link>
            </p>
          </div>

          {/* Page title */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Hesap Oluşturun</h2>
            <p className="mt-1.5 text-sm text-gray-500">
              {tab === 'customer' ? 'Randevu almak için ücretsiz hesap oluşturun.' : '14 gün ücretsiz kullanın. Kredi kartı gerekmez.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mb-6 flex gap-2 rounded-xl bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => { setTab('customer'); setForm(INITIAL); setErrors({}) }}
              className={`flex-1 rounded-lg px-3 py-2.5 text-center transition-colors ${tab === 'customer' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
            >
              <span className={`block text-sm font-semibold ${tab === 'customer' ? 'text-gray-900' : 'text-gray-500'}`}>Müşteri</span>
              <span className={`block text-[11px] mt-0.5 ${tab === 'customer' ? 'text-gray-500' : 'text-gray-400'}`}>Randevu almak istiyorum</span>
            </button>
            <button
              type="button"
              onClick={() => { setTab('business'); setForm(INITIAL); setErrors({}) }}
              className={`flex-1 rounded-lg px-3 py-2.5 text-center transition-colors ${tab === 'business' ? 'bg-white shadow-sm' : 'hover:bg-white/60'}`}
            >
              <span className={`block text-sm font-semibold ${tab === 'business' ? 'text-gray-900' : 'text-gray-500'}`}>İşletme</span>
              <span className={`block text-[11px] mt-0.5 ${tab === 'business' ? 'text-gray-500' : 'text-gray-400'}`}>İşletme sahibiyim, randevu kabul edeceğim</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* General error */}
          {errors.general && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{errors.general}</p>
            </div>
          )}

          {/* Card: Kişisel Bilgiler */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">1</span>
              Kişisel Bilgiler
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ad" error={errors.firstName}>
                <input type="text" value={form.firstName} onChange={set('firstName')}
                  placeholder="Ahmet" autoComplete="given-name"
                  className={inputClass(!!errors.firstName)} />
              </Field>
              <Field label="Soyad" error={errors.lastName}>
                <input type="text" value={form.lastName} onChange={set('lastName')}
                  placeholder="Yılmaz" autoComplete="family-name"
                  className={inputClass(!!errors.lastName)} />
              </Field>
            </div>

            <div className="mt-4 space-y-4">
              <Field label="E-posta Adresi" error={errors.email}>
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="ornek@email.com" autoComplete="email"
                  className={inputClass(!!errors.email)} />
              </Field>
              <Field label="Telefon Numarası" error={errors.phone}>
                <div className={`flex w-full overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-brand-500/40 transition-shadow ${errors.phone ? 'border-red-400' : 'border-gray-200'}`}>
                  <span className="flex shrink-0 select-none items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
                    🇹🇷 +90
                  </span>
                  <input
                    aria-label="Telefon Numarası"
                    type="tel"
                    value={formatPhoneDisplay(form.phone)}
                    onChange={handlePhoneChange}
                    placeholder="555 000 00 00"
                    autoComplete="tel"
                    className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
                  />
                </div>
              </Field>
              {tab === 'business' && (
                <Field label="Adres" error={errors.address}>
                  <input type="text" value={form.address} onChange={set('address')}
                    placeholder="Bağdat Cad. No:1, Kadıköy, İstanbul" autoComplete="street-address"
                    className={inputClass(!!errors.address)} />
                </Field>
              )}
            </div>
          </div>

          {/* Card: İşletme Bilgileri (only for business) */}
          {tab === 'business' && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">2</span>
                İşletme Bilgileri
              </h2>

              <div className="space-y-4">
                <Field label="İşletme Adı" error={errors.businessName}>
                  <input type="text" value={form.businessName} onChange={set('businessName')}
                    placeholder="Yılmaz Kuaför" autoComplete="organization"
                    className={inputClass(!!errors.businessName)} />
                </Field>

                <Field
                  label="Firma Kullanıcı Adı (Subdomain)"
                  error={errors.subdomain}
                  hint="Bu adres randevu sayfanızın URL'i olacak: nextbooking.com/firma-adi"
                >
                  <div className="flex rounded-xl border border-gray-300 overflow-hidden focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                    <span className="flex items-center bg-gray-50 px-3 text-xs text-gray-500 border-r border-gray-300 whitespace-nowrap">
                      nextbooking.com/
                    </span>
                    <input
                      aria-label="Firma Kullanıcı Adı (Subdomain)"
                      type="text"
                      value={form.subdomain}
                      onChange={set('subdomain')}
                      placeholder="yilmaz-kuafor"
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                    />
                  </div>
                  {errors.subdomain && <p className="mt-1 text-xs text-red-500">{errors.subdomain}</p>}
                </Field>

                <Field label="İşletme Kategorisi" error={errors.businessCategory}>
                  <select value={form.businessCategory} onChange={set('businessCategory')}
                    className={inputClass(!!errors.businessCategory)}>
                    <option value="">Kategori seçin⬦</option>
                    {BUSINESS_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* Card: Şifre */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">{tab === 'customer' ? '2' : '3'}</span>
              Şifre Belirleyin
            </h2>

            <div className="space-y-4">
              <Field label="Şifre" error={errors.password}>
                <div className="relative">
                  <input aria-label="Şifre" type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder="En az 8 karakter" autoComplete="new-password"
                    className={`${inputClass(!!errors.password)} pr-10`} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </Field>

              <Field label="Şifre Tekrar" error={errors.confirmPassword}>
                <div className="relative">
                  <input aria-label="Şifre Tekrar" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Şifrenizi tekrar girin" autoComplete="new-password"
                    className={`${inputClass(!!errors.confirmPassword)} pr-10`} />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>
            </div>
          </div>

          {/* Card: Güvenlik doğrulaması */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">{tab === 'customer' ? '3' : '4'}</span>
              Güvenlik Doğrulaması
            </h2>
            <Field
              label={`${challenge.a} + ${challenge.b} = ?`}
              error={errors.captchaAnswer}
              hint="Basit bir matematik sorusu — botlara karşı koruma"
            >
              <input
                type="number"
                value={form.captchaAnswer}
                onChange={set('captchaAnswer')}
                placeholder="Yanıtı girin"
                className={inputClass(!!errors.captchaAnswer)}
              />
            </Field>
          </div>

          {/* Honeypot — hidden from real users */}
          <div aria-hidden style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }}>
            <label htmlFor={honeypotId}>Website</label>
            <input id={honeypotId} type="text" tabIndex={-1} autoComplete="off"
              value={form.website_url} onChange={set('website_url')} />
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-gray-500">
            Kayıt olarak{' '}
            <Link href="/kullanim" className="text-brand-500 hover:underline">Kullanım Şartları</Link>
            {' '}ve{' '}
            <Link href="/gizlilik" className="text-brand-500 hover:underline">Gizlilik Politikası</Link>
            'nı kabul etmiş sayılırsınız.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-xl"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Hesap Oluşturuluyor⬦</>
            ) : (
              <>{tab === 'customer' ? 'Hesap Oluştur' : 'Ücretsiz Hesap Oluştur'} <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Sorun mu yaşıyorsunuz?{' '}
          <Link href="/iletisim" className="text-brand-500 hover:underline">Destek alın</Link>
        </p>
        </div>
      </div>
    </div>
  )
}

// ———Helpers ——————————————————————————————————————————————————————————————————

function inputClass(hasError: boolean) {
  return [
    'w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors',
    hasError
      ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-2 focus:ring-red-400/20'
      : 'border-gray-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20',
  ].join(' ')
}

function Field({
  label, error, hint, children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  const id = useId()
  // Only clone a direct input/select/textarea — compound fields (e.g. the
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
