import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useLogin } from '@/hooks/useAuth'
import { showToast } from '@/components/ui/Toast'

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('E-posta ve şifre gereklidir.')
      return
    }

    try {
      await loginMutation.mutateAsync({ email, password })
      showToast('success', 'Giriş başarılı', 'Panele yönlendiriliyorsunuz...')
      navigate('/dashboard')
    } catch {
      showToast('error', 'Giriş başarısız', 'E-posta veya şifre hatalı.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center text-brand-600">Giriş Yap</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-400 focus:outline-none"
              placeholder="ornek@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-brand-400 focus:outline-none"
              placeholder="Şifreniz"
            />
          </div>

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2 rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loginMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Giriş yapılıyor...</>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Hesabınız yok mu?{' '}
          <a href="/register" className="text-brand-600 hover:underline font-medium">Kayıt Ol</a>
        </div>
      </div>
    </div>
  )
}
