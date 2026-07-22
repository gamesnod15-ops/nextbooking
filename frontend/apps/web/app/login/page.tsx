"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import Link from "next/link"
import { CalendarCheck, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react"
import { GoogleIcon, AppleIcon } from "@/lib/icons"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [form, setForm] = useState({ email: "", password: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.email || !form.password) {
      setError("E-posta ve şifre gereklidir.")
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await api.post<{
        accessToken: string
        role: string
        userId: string
        fullName: string
        tenantId: string | null
        emailVerified: boolean
        phoneVerified: boolean
      }>("/api/v1/auth/login", {
        email: form.email,
        password: form.password,
      })
      localStorage.setItem('accessToken', res.accessToken)
      localStorage.setItem('userId', res.userId)
      localStorage.setItem('fullName', res.fullName)
      localStorage.setItem('role', res.role)
      if (res.tenantId) localStorage.setItem('tenantId', res.tenantId)

      const roleRoute = res.role === 'customer' ? '/musteri' : redirectTo
      router.push(roleRoute)
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message || "Giriş başarısız. Bilgilerinizi kontrol edin.")
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = (provider: string) => {
    const redirectUri = `${window.location.origin}/auth/oauth/callback`
    const clientIds: Record<string, string> = {
      google: 'YOUR_GOOGLE_CLIENT_ID',
      apple: 'YOUR_APPLE_CLIENT_ID',
    }
    const authUrls: Record<string, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientIds[provider]}&redirect_uri=${redirectUri}&response_type=token&scope=openid%20email%20profile`,
      apple: `https://appleid.apple.com/auth/authorize?client_id=${clientIds[provider]}&redirect_uri=${redirectUri}&response_type=code%20id_token&scope=name%20email&response_mode=form_post`,
    }
    window.location.href = authUrls[provider]
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden lg:flex flex-col bg-black px-16 py-14 text-white overflow-hidden">
        <div aria-hidden className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
        <div aria-hidden className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brand-500/5 blur-3xl" />
        {/* Decorative geometric shapes */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute -top-10 -right-10 h-80 w-80 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
            <polygon points="100,0 200,100 100,200 0,100" className="fill-white" />
          </svg>
          <svg className="absolute bottom-20 left-1/2 h-48 w-48 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
            <rect x="20" y="20" width="160" height="160" rx="20" className="stroke-white stroke-[1.5]" fill="none" />
          </svg>
        </div>

        <Link href="/" className="relative shrink-0">
          <img src="/logo-jetrandevu-white.png" alt="JetRandevu" className="h-9 w-auto" />
        </Link>

        <div className="relative mt-10 flex-1 space-y-8 overflow-y-auto">
          {/* Photo */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
            <img
              src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=500&q=80"
              alt="İşletme yönetimi"
              className="w-full h-52 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          </div>

          <div>
            <h1 className="text-4xl font-extrabold leading-tight text-white">Hoş geldiniz!</h1>
            <p className="mt-4 text-base text-gray-400 leading-relaxed max-w-sm">
              İşletmenizi yönetmeye devam edin. Tüm randevu, müşteri ve finans verilerinize tek yerden ulaşın.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-5">
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-sm ${i < 4 ? 'text-brand-500' : 'text-brand-500/30'}`}>★</span>
              ))}
            </div>
            <p className="text-sm text-gray-300 italic leading-relaxed">
              &ldquo;JetRandevu sayesinde iş süreçlerimizin tamamını tek panelden yönetiyorum. Zaman kazandırıyor.&rdquo;
            </p>
            <p className="mt-3 text-xs font-semibold text-brand-500/70">— Mehmet A., Spor Salonu Sahibi</p>
          </div>

          <div className="flex gap-6">
            {[{ val: '10.000+', lbl: 'İşletme' }, { val: '2M+', lbl: 'Randevu/ay' }, { val: '%99.9', lbl: 'Uptime' }].map((s) => (
              <div key={s.lbl}>
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-gray-500">{s.lbl}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative mt-8 shrink-0 text-xs text-gray-600">© 2026 JetRandevu. Tüm hakları saklıdır.</p>
      </div>

      {/* Right — form panel */}
      <div className="flex flex-col">
        <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md lg:hidden">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
                <CalendarCheck className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900">JetRandevu</span>
            </Link>
            <p className="text-sm text-gray-500">
              <Link href="/register" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                Kayıt Ol
              </Link>
            </p>
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center px-6 py-10 overflow-y-auto">
          <div className="mx-auto w-full max-w-sm">
            <div className="hidden lg:flex justify-end mb-4">
              <p className="text-sm text-gray-500">
                Hesabınız yok mu?{' '}
                <Link href="/register" className="font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                  Kayıt Ol
                </Link>
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-gray-900">Giriş Yap</h2>
              <p className="mt-1.5 text-sm text-gray-500">Hesabınıza giriş yaparak işletmenizi yönetmeye başlayın.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-gray-700">E-posta Adresi</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  placeholder="ornek@email.com"
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-gray-700">Şifre</label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    placeholder="Şifrenizi girin"
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                <span className="text-sm text-gray-600">Beni hatırla</span>
              </label>
              <Link href="/sifre-unuttum" className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
                Şifremi Unuttum
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Giriş Yapılıyor…</>
              ) : (
                <>Giriş Yap <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">veya</span>
              </div>
            </div>

              <div className="flex justify-center gap-4">
                <button type="button" onClick={() => handleSocialLogin('google')} aria-label="Google ile giriş yap"
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
                  <GoogleIcon size={20} />
                </button>
                <button type="button" onClick={() => handleSocialLogin('apple')} aria-label="Apple ile giriş yap"
                  className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
                  <AppleIcon size={20} className="text-gray-900" />
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-xs text-gray-400">
              Sorun mu yaşıyorsunuz?{' '}
              <Link href="/iletisim" className="text-brand-500 hover:underline">Destek alın</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}
