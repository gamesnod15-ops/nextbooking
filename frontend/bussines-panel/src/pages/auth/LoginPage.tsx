import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import { showToast } from '@/components/ui/Toast'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react'
import { GoogleIcon, AppleIcon } from '@/lib/icons'
import { startOAuthLogin } from '@/lib/oauth'

export function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError('E-posta ve şifre gereklidir.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    try {
      await loginMutation.mutateAsync({ email, password })
      showToast('success', 'Giriş başarılı', 'Panele yönlendiriliyorsunuz...')
      navigate('/dashboard')
    } catch {
      showToast('error', 'Giriş başarısız', 'E-posta veya şifre hatalı.')
      setError('E-posta veya şifre hatalı.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <>
      {/* Animated Background */}
      <div className="login-bg">
        <div className="blob blob1" />
        <div className="blob blob2" />
        <div className="blob blob3" />
        <div className="grid-dot grid-dot-left" />
        <div className="grid-dot grid-dot-right" />
      </div>

      {/* Login Wrapper */}
      <div className="login-wrapper">
        <div className={`login-card ${shake ? 'login-error' : ''}`}>

          {/* Logo */}
          <div className="login-logo">
            <img src="/icon-site.png" alt="JetRandevu" />
          </div>

          <h1 className="login-title">Hoş Geldiniz</h1>
          <p className="login-subtitle">Hesabınıza giriş yaparak devam edin</p>

          <form onSubmit={handleSubmit} className="login-form">

            {/* Email */}
            <div className="login-form-group">
              <label>E-posta</label>
              <div className="login-input-wrap">
                <Mail className="login-input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  placeholder="ornek@email.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-form-group">
              <label>Şifre</label>
              <div className="login-input-wrap">
                <Lock className="login-input-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Şifreniz"
                />
                <button
                  type="button"
                  className="login-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="login-forgot">
              <a href="/sifre-unuttum">Şifremi Unuttum?</a>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 text-center text-sm text-red-600 font-medium">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className={`login-submit ${loginMutation.isPending ? 'login-loading' : ''}`}
            >
              <span>Giriş Yap</span>
              <ArrowRight className="arrow-icon" size={22} />
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span>veya</span>
          </div>

          {/* Social login */}
          <div className="flex justify-center gap-4">
            <button type="button" onClick={() => startOAuthLogin('google')} aria-label="Google ile giriş yap"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <GoogleIcon size={20} />
            </button>
            <button type="button" onClick={() => startOAuthLogin('apple')} aria-label="Apple ile giriş yap"
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300">
              <AppleIcon size={20} className="text-gray-900" />
            </button>
          </div>

          {/* Register */}
          <div className="login-register mt-4">
            Hesabınız yok mu?{' '}
            <Link to="/register">Kayıt Ol</Link>
          </div>
        </div>

        {/* Security Badge */}
        <div className="login-secure">
          <Shield size={18} />
          Güvenli bağlantı ile korunmaktadır
        </div>
      </div>
    </>
  )
}
