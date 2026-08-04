'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { api, ApiError } from '@/lib/api'

interface ProviderInfo {
  provider: string
  providerUserId: string
  email: string
  fullName: string
  avatarUrl: string | null
}

type OAuthCallbackResponse =
  | { isNewUser: true; providerInfo: ProviderInfo }
  | {
      isNewUser: false
      accessToken: string
      userId: string
      role: string
      fullName: string
      email: string
      avatarUrl: string | null
      tenantId: string | null
    }

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Max-Age=0; path=/`
}

function OAuthCallbackForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ranRef = useRef(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    async function run() {
      if (searchParams.get('error')) {
        setError('Giriş sağlayıcıdan bir hata döndü. Lütfen tekrar deneyin.')
        return
      }

      let provider: 'google' | 'apple' | null = null
      let token: string | null = null

      // Google's implicit id_token flow returns via the URL fragment, which
      // never reaches the server — only readable here, client-side.
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const hashIdToken = hashParams.get('id_token')

      if (hashIdToken) {
        provider = 'google'
        token = hashIdToken
        sessionStorage.removeItem('oauth_nonce')
      } else if (searchParams.get('provider') === 'apple') {
        provider = 'apple'
        token = readCookie('oauth_apple_token')
        clearCookie('oauth_apple_token')
        sessionStorage.removeItem('oauth_state')
      }

      if (!provider || !token) {
        setError('Giriş bilgisi alınamadı. Lütfen tekrar deneyin.')
        return
      }

      try {
        const res = await api.post<OAuthCallbackResponse>(`/api/v1/auth/oauth/${provider}/callback`, {
          token,
          deviceInfo: navigator.userAgent,
        })

        if (res.isNewUser) {
          sessionStorage.setItem('oauth_provider_info', JSON.stringify(res.providerInfo))
          router.replace('/register/complete-oauth')
          return
        }

        localStorage.setItem('accessToken', res.accessToken)
        localStorage.setItem('userId', res.userId)
        localStorage.setItem('fullName', res.fullName)
        localStorage.setItem('role', res.role)
        if (res.tenantId) localStorage.setItem('tenantId', res.tenantId)

        router.replace(res.role === 'customer' ? '/musteri' : '/panel')
      } catch (err) {
        const apiErr = err as ApiError
        setError(apiErr.message || 'Giriş başarısız. Lütfen tekrar deneyin.')
      }
    }

    run()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="text-sm text-gray-600">{error}</p>
        <a href="/login" className="text-sm font-semibold text-brand-600 hover:underline">Giriş sayfasına dön</a>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-sm text-gray-500">Giriş yapılıyor…</p>
    </div>
  )
}

export default function OAuthCallbackPage() {
  return <OAuthCallbackForm />
}
