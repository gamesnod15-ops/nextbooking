import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useOAuthLogin } from '@/hooks/useAuth'
import { showToast } from '@/components/ui/Toast'

export function OAuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const oauthLogin = useOAuthLogin()
  const [status, setStatus] = useState<'processing' | 'redirecting' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const provider = searchParams.get('provider') || 'google'
    const token = searchParams.get('token') || searchParams.get('code') || searchParams.get('id_token')

    const hash = window.location.hash.substring(1)
    const hashParams = new URLSearchParams(hash)
    const accessToken = hashParams.get('access_token') || hashParams.get('id_token')

    const finalToken = token || accessToken

    if (!finalToken) {
      setStatus('error')
      setErrorMessage('Kimlik doğrulama bilgisi alınamadı. Lütfen tekrar deneyin.')
      return
    }

    setStatus('processing')

    oauthLogin.mutate(
      { provider, token: finalToken },
      {
        onSuccess: (data) => {
          if (data.isNewUser) {
            navigate('/auth/complete-registration', {
              state: {
                provider: data.providerInfo?.provider || provider,
                providerUserId: data.providerInfo?.providerUserId || '',
                email: data.providerInfo?.email || '',
                fullName: data.providerInfo?.fullName || '',
                avatarUrl: data.providerInfo?.avatarUrl || null,
              },
            })
          } else {
            setStatus('redirecting')
            showToast('success', 'Giriş başarılı', 'Panele yönlendiriliyorsunuz...')
            setTimeout(() => navigate('/dashboard'), 500)
          }
        },
        onError: () => {
          setStatus('error')
          setErrorMessage('Kimlik doğrulama başarısız. Lütfen tekrar deneyin.')
        },
      }
    )
  }, [])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900">Doğrulama Başarısız</h2>
          <p className="mt-3 text-gray-600">{errorMessage}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
          >
            Giriş Sayfasına Dön
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-violet-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-xl">
        {status === 'redirecting' ? (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Giriş Başarılı!</h2>
            <p className="mt-3 text-gray-600">Yönlendiriliyorsunuz...</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
              <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900">Kimlik Doğrulanıyor</h2>
            <p className="mt-3 text-gray-600">Lütfen bekleyin, hesabınıza giriş yapılıyor...</p>
          </>
        )}
      </div>
    </div>
  )
}
