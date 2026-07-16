'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'

export default function SifreSifirlaPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'form' | 'success' | 'error'>(
    token ? 'form' : 'error'
  )
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (newPassword.length < 8) {
      setMessage('Şifre en az 8 karakter olmalıdır.')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Şifreler eşleşmiyor.')
      return
    }

    setLoading(true)

    try {
      await api.post('/api/v1/auth/reset-password', {
        token,
        newPassword,
      })
      setStatus('success')
      setMessage('Şifreniz başarıyla sıfırlandı!')
    } catch (err) {
      const apiErr = err as { message?: string }
      setStatus('error')
      setMessage(apiErr.message || 'Şifre sıfırlama başarısız oldu. Bağlantının süresi dolmuş olabilir.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border bg-white p-10 shadow-xl">
        {status === 'form' && (
          <>
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Loader2 className="h-8 w-8 text-blue-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Yeni Şifre Belirleyin</h2>
              <p className="mt-2 text-sm text-gray-500">
                Hesabınız için yeni bir şifre oluşturun.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {message && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
                  {message}
                </div>
              )}

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  Yeni Şifre
                </label>
                <div className="relative mt-1">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="block w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-brand-500"
                    placeholder="En az 8 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Şifre Tekrar
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:ring-brand-500"
                  placeholder="Şifrenizi tekrar girin"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 py-3 text-sm font-bold text-black hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Şifreyi Sıfırla
              </button>
            </form>
          </>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Şifre Sıfırlandı!</h2>
            <p className="mt-3 text-gray-600">{message}</p>
            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && !token && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Geçersiz Bağlantı</h2>
            <p className="mt-3 text-gray-600">
              Bu şifre sıfırlama bağlantısı geçersiz. Lütfen tekrar şifre sıfırlama talebinde bulunun.
            </p>
            <div className="mt-6">
              <Link
                href="/sifre-unuttum"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-brand-600 transition-colors"
              >
                Şifre Sıfırla
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && token && (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Hata</h2>
            <p className="mt-3 text-gray-600">{message}</p>
            <div className="mt-6">
              <Link
                href="/sifre-unuttum"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-brand-600 transition-colors"
              >
                Tekrar Dene
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
