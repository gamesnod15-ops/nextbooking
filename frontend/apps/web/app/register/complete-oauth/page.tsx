'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarCheck, ArrowRight, Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'

interface ProviderInfo {
  provider: string
  providerUserId: string
  email: string
  fullName: string
  avatarUrl: string | null
}

interface FormState {
  firstName: string
  lastName: string
  phone: string
  username: string
  agreedToTerms: boolean
}

export default function CompleteOAuthRegistrationPage() {
  const router = useRouter()
  const [info, setInfo] = useState<ProviderInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ firstName: '', lastName: '', phone: '', username: '', agreedToTerms: false })

  useEffect(() => {
    const raw = sessionStorage.getItem('oauth_provider_info')
    if (!raw) {
      router.replace('/login')
      return
    }
    const parsed: ProviderInfo = JSON.parse(raw)
    setInfo(parsed)
    const [first, ...rest] = (parsed.fullName || '').trim().split(/\s+/)
    setForm((prev) => ({
      ...prev,
      firstName: first || '',
      lastName: rest.join(' '),
      username: parsed.email ? parsed.email.split('@')[0] : '',
    }))
  }, [router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!info) return

    if (!form.firstName || !form.lastName || !form.phone || !form.username) {
      setError('Lütfen tüm alanları doldurun.')
      return
    }
    if (!form.agreedToTerms) {
      setError('Devam etmek için kullanım şartlarını kabul etmelisiniz.')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await api.post<{
        accessToken: string
        userId: string
        role: string
        fullName: string
        tenantId: string | null
      }>('/api/v1/auth/oauth/complete-registration', {
        provider: info.provider,
        providerUserId: info.providerUserId,
        email: info.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        username: form.username,
        agreedToTerms: form.agreedToTerms,
        avatarUrl: info.avatarUrl,
      })

      sessionStorage.removeItem('oauth_provider_info')
      localStorage.setItem('accessToken', res.accessToken)
      localStorage.setItem('userId', res.userId)
      localStorage.setItem('fullName', res.fullName)
      localStorage.setItem('role', res.role)
      if (res.tenantId) localStorage.setItem('tenantId', res.tenantId)

      router.push(res.role === 'customer' ? '/musteri' : '/panel')
    } catch (err) {
      const apiErr = err as ApiError
      setError(apiErr.message || 'Kayıt tamamlanamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (!info) return null

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
              <CalendarCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900">JetRandevu</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 flex-col justify-center px-6 py-10">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-serif text-2xl font-medium text-gray-900">Son bir adım</h1>
            <p className="mt-1.5 text-sm text-gray-500">
              {info.email} ile devam ediyorsunuz. Hesabınızı tamamlamak için birkaç bilgi daha gerekiyor.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-gray-700">Ad</label>
                <input
                  id="firstName"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-gray-700">Soyad</label>
                <input
                  id="lastName"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-gray-700">Telefon</label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="05XX XXX XX XX"
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-gray-700">Kullanıcı Adı</label>
              <input
                id="username"
                name="username"
                value={form.username}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={form.agreedToTerms}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-600">
                <Link href="/kullanim" className="text-brand-600 hover:underline">Kullanım şartlarını</Link> kabul ediyorum.
              </span>
            </label>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              {loading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Tamamlanıyor…</>
              ) : (
                <>Hesabı Tamamla <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
