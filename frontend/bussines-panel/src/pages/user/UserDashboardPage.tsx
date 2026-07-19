import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { logout as logoutAction } from '@/store/slices/authSlice'
import { useLogout } from '@/hooks/useAuth'
import { showToast } from '@/components/ui/Toast'
import api from '@/lib/api'
import {
  User, Shield, Bell, CreditCard, LogOut, Package, Building2,
  Smartphone, ChevronRight, Loader2, ExternalLink,
  CheckCircle, XCircle, Clock, Trash2, Key,
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface DashboardData {
  userId: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  avatarUrl: string | null
  role: string
  emailVerified: boolean
  lastLoginAt: string | null
  createdAt: string
  membership: {
    plan: string | null
    businessName: string | null
    tenantId: string | null
    subdomain: string | null
    hasActiveSubscription: boolean
  } | null
  authProviders: Array<{
    provider: string
    email: string | null
    fullName: string | null
    avatarUrl: string | null
    connectedAt: string
    lastLoginAt: string | null
  }>
  activeSessions: Array<{
    sessionId: string
    deviceInfo: string | null
    ipAddress: string | null
    createdAt: string
    expiresAt: string | null
    isCurrent: boolean
  }>
}

const PROVIDER_ICONS: Record<string, string> = {
  google: 'G',
  apple: '',
}

const PROVIDER_COLORS: Record<string, string> = {
  google: 'bg-blue-50 text-blue-600 border-blue-200',
  apple: 'bg-gray-900 text-white border-gray-900',
}

export function UserDashboardPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const logoutMutation = useLogout()
  const auth = useSelector((s: RootState) => s.auth)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth.accessToken) {
      navigate('/login')
      return
    }
    api.get<DashboardData>('/users/dashboard')
      .then((r) => setData(r.data))
      .catch(() => showToast('error', 'Veri alınamadı'))
      .finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await logoutMutation.mutateAsync()
    dispatch(logoutAction())
    navigate('/login')
    showToast('info', 'Çıkış yapıldı')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-500">Veri yüklenemedi.</p>
          <button onClick={() => window.location.reload()} className="mt-3 text-brand-500 hover:underline">Tekrar dene</button>
        </div>
      </div>
    )
  }

  const initials = data.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-violet-50">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo-black-last.png" alt="BookingAi" className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Çıkış Yap</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-2xl font-bold text-white shadow-lg">
                {data.avatarUrl ? (
                  <img src={data.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
                ) : initials}
              </div>
              <h1 className="text-xl font-extrabold text-gray-900">{data.fullName}</h1>
              <p className="mt-0.5 text-sm text-gray-500">{data.email}</p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${data.emailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {data.emailVerified ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {data.emailVerified ? 'Doğrulanmış' : 'Doğrulanmamış'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                  <User className="h-3 w-3" />
                  {data.role === 'tenant_admin' ? 'İşletme Yöneticisi' : data.role === 'business' ? 'İşletme' : 'Kullanıcı'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-bold text-gray-500 uppercase tracking-wider">Hızlı İşlemler</h2>
              <div className="space-y-2">
                <Link to="/login" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-brand-500" />
                    İşletme Paneli
                  </span>
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/subscription" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-brand-500" />
                    Abonelik Yönetimi
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/settings" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-3">
                    <Shield className="h-4 w-4 text-brand-500" />
                    Ayarlar
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>

            {/* Account Age */}
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-xs text-gray-500">Hesap oluşturma</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {new Date(data.createdAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              {data.lastLoginAt && (
                <>
                  <p className="mt-3 text-xs text-gray-500">Son giriş</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {new Date(data.lastLoginAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Membership Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-500" />
                Üyelik Bilgileri
              </h2>
              {data.membership ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Plan</p>
                    <p className="mt-1 text-base font-bold text-gray-900 capitalize">{data.membership.plan || 'Free'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">İşletme</p>
                    <p className="mt-1 text-base font-bold text-gray-900">{data.membership.businessName || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">Durum</p>
                    <p className="mt-1 flex items-center gap-1.5 text-base font-bold text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      Aktif
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">Henüz bir işletmeye bağlı değilsiniz.</p>
                  <Link to="/register" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-brand-600">
                    İşletme oluştur <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              )}
            </div>

            {/* Auth Providers Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-500" />
                Bağlı Oturum Açma Yöntemleri
              </h2>
              {data.authProviders.length > 0 ? (
                <div className="space-y-3">
                  {data.authProviders.map((p, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${PROVIDER_COLORS[p.provider] || 'bg-gray-100 text-gray-600'}`}>
                          {PROVIDER_ICONS[p.provider] || p.provider[0].toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 capitalize">{p.provider}</p>
                          <p className="text-xs text-gray-500">{p.email || p.fullName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">
                          {new Date(p.connectedAt).toLocaleDateString('tr-TR')}
                        </p>
                        {p.lastLoginAt && (
                          <p className="text-xs text-gray-400">Son: {new Date(p.lastLoginAt).toLocaleDateString('tr-TR')}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">Henüz bir OAuth sağlayıcısı bağlı değil.</p>
                </div>
              )}
            </div>

            {/* Active Sessions Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-900 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-brand-500" />
                Aktif Oturumlar
              </h2>
              {data.activeSessions.length > 0 ? (
                <div className="space-y-3">
                  {data.activeSessions.map((session) => (
                    <div key={session.sessionId} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                          <Smartphone className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {session.deviceInfo || 'Bilinmeyen cihaz'}
                          </p>
                          <p className="text-xs text-gray-500">{session.ipAddress || 'IP bilinmiyor'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-emerald-600">
                          <Clock className="h-3 w-3" />
                          {new Date(session.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                        <button
                          onClick={() => showToast('info', 'Oturum sonlandırıldı')}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-100 bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">Aktif oturum bulunmuyor.</p>
                </div>
              )}
            </div>

            {/* Security Card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-bold text-gray-900 flex items-center gap-2">
                <Key className="h-5 w-5 text-brand-500" />
                Güvenlik Ayarları
              </h2>
              <div className="space-y-3">
                <Link to="/settings" className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <Key className="h-4 w-4 text-gray-400" />
                    Şifre Değiştir
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/settings" className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <Bell className="h-4 w-4 text-gray-400" />
                    Bildirim Tercihleri
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
                <Link to="/subscription" className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-3 text-sm font-medium text-gray-700">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    Fatura Bilgileri
                  </span>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
