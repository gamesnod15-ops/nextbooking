'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

export default function HesapDogrulaPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Geçersiz doğrulama bağlantısı.')
      return
    }

    api.post('/api/v1/auth/verify-email', { token })
      .then(() => {
        setStatus('success')
        setMessage('E-postanız başarıyla doğrulandı!')
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err?.message || 'Doğrulama başarısız oldu. Bağlantının süresi dolmuş olabilir.')
      })
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border bg-white p-10 text-center shadow-xl">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Doğrulanıyor...</h2>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Hesabınız Aktif!</h2>
            <p className="mt-3 text-gray-600">{message}</p>
            <div className="mt-6 space-y-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Doğrulama Başarısız</h2>
            <p className="mt-3 text-gray-600">{message}</p>
            <div className="mt-6 space-y-3">
              <p className="text-xs text-gray-400">
                Yeni bir doğrulama e-postası almak için lütfen iletişime geçin.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-brand-600 transition-colors"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
