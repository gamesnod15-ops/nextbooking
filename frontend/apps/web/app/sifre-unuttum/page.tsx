'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function SifreUnuttumPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/api/v1/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      const apiErr = err as { message?: string }
      setError(apiErr.message || 'Bir hata oluştu. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">E-posta Gönderildi</h2>
          <p className="mt-3 text-gray-600">
            <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
            Lütfen gelen kutunuzu kontrol edin.
          </p>
          <div className="mt-6 space-y-3">
            <p className="text-xs text-gray-400">
              E-postayı görmüyor musunuz? Gereksiz (spam) klasörünü kontrol edin.
            </p>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-600 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Giriş Sayfasına Dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border bg-white p-10 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Şifremi Unuttum</h2>
          <p className="mt-2 text-sm text-gray-500">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              E-posta Adresi
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-brand-500"
              placeholder="ornek@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-black hover:bg-brand-600 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Bağlantı Gönder
          </button>

          <div className="text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-brand-500 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Giriş Sayfasına Dön
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
