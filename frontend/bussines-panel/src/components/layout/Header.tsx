import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState, useAppDispatch } from '@/store'
import { normalizePlanId, planAllows } from '@/config/plans'
import { markAllAsRead, markAsRead } from '@/store/slices/notificationsSlice'
import { useLogout } from '@/hooks/useAuth'
import {
  Menu,
  LogOut,
  Bell,
  ExternalLink,
  ChevronDown,
  User,
  Settings,
  Check,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { SearchTrigger } from '@/components/search/GlobalSearch'

interface HeaderProps {
  onMenuClick: () => void
  onSidebarToggle: () => void
}

const notificationIcons: Record<string, string> = {
  appointment_new: '📅',
  appointment_cancelled: '❌',
  appointment_reminder: '⏰',
  payment_received: '💳',
  review_new: '⭐',
  system: '🔔',
}

export function Header({ onMenuClick, onSidebarToggle }: HeaderProps) {
  const { fullName, jobTitle, phone: userPhone } = useSelector((s: RootState) => s.auth)
  const { items, unreadCount } = useSelector((s: RootState) => s.notifications)
  const { unresolvedCount: errorCount } = useSelector((s: RootState) => s.errors)
  const business = useSelector((s: RootState) => s.business.business)
  const logoutMutation = useLogout()
  const dispatch = useAppDispatch()

  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    try { return localStorage.getItem('profile_avatar') } catch { return null }
  })

  // Close dropdowns on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  // Sync avatar when updated from SettingsPage (same tab)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'profile_avatar') {
        setAvatarUrl(e.newValue)
      }
    }
    window.addEventListener('storage', onStorage)
    // Also poll via custom event for same-tab updates
    function onAvatarUpdate(e: Event) {
      setAvatarUrl((e as CustomEvent<string | null>).detail)
    }
    window.addEventListener('profile_avatar_updated', onAvatarUpdate)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('profile_avatar_updated', onAvatarUpdate)
    }
  }, [])

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-white px-4 lg:px-6 gap-3">
      {/* Left: hamburger */}
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden shrink-0"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={onSidebarToggle}
        className="hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent lg:inline-flex lg:shrink-0"
        title="Menüyü daralt veya genişlet"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Center: Global Search — takes remaining space, centered */}
      <div className="flex flex-1 justify-center">
        <SearchTrigger />
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Edit Site button — only for professional/custom plans */}
        {planAllows(normalizePlanId(business?.plan), 'professional') && (
          <Button
            variant="premium"
            size="sm"
            className="hidden md:flex"
            onClick={() => alert('Site builder yakında aktif olacak!')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Sitemi Düzenle
          </Button>
        )}

        {/* Error monitor indicator */}
        {errorCount > 0 && (
          <Link
            to="/error-monitor"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-amber-600 hover:bg-amber-50 hover:text-amber-700 transition-colors"
            title={`${errorCount} çözülmemiş hata`}
          >
            <Shield className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[10px] font-bold text-white">
              {errorCount > 9 ? '9+' : errorCount}
            </span>
          </Link>
        )}

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setNotifOpen((v) => !v); setUserOpen(false) }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border bg-white shadow-xl">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <span className="text-sm font-semibold">Bildirimler</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(markAllAsRead())}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Check className="h-3 w-3" />
                    Tümünü okundu işaretle
                  </button>
                )}
              </div>
              <div className="max-h-80 divide-y overflow-y-auto">
                {items.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">
                    Bildirim yok
                  </p>
                ) : (
                  items.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        dispatch(markAsRead(n.id))
                        setNotifOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                        !n.isRead && 'bg-blue-50/50'
                      )}
                    >
                      <span className="mt-0.5 text-base">{notificationIcons[n.type] ?? '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn('text-sm', !n.isRead ? 'font-semibold' : 'font-medium')}>
                          {n.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{n.message}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: tr })}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </button>
                  ))
                )}
              </div>
              <div className="border-t px-4 py-2.5">
                <Link
                  to="/notifications"
                  onClick={() => setNotifOpen(false)}
                  className="block text-center text-xs font-medium text-primary hover:underline"
                >
                  Tüm bildirimleri görüntüle
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setUserOpen((v) => !v); setNotifOpen(false) }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground overflow-hidden">
              {avatarUrl
                ? <img src={avatarUrl} alt="Profil" className="h-full w-full object-cover" />
                : initials}
            </div>
            <div className="hidden flex-col items-start text-left sm:flex">
              <span className="text-sm font-medium leading-none">{fullName ?? 'Kullanıcı'}</span>
              <span className="text-[11px] text-muted-foreground">{jobTitle ?? business?.name}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border bg-white shadow-xl">
              <div className="border-b px-4 py-3">
                <p className="text-sm font-medium">{fullName}</p>
                {jobTitle && <p className="text-xs text-muted-foreground">{jobTitle}</p>}
                {userPhone && <p className="text-xs text-muted-foreground">{userPhone}</p>}
                {!jobTitle && <p className="text-xs text-muted-foreground">{business?.name}</p>}
              </div>
              <div className="p-1">
                <Link
                  to="/settings/profile"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  Profil
                </Link>
                <Link
                  to="/settings/integrations"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Ayarlar
                </Link>
                <Link
                  to="/error-monitor"
                  onClick={() => setUserOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Hata İzleme
                  {errorCount > 0 && (
                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700">
                      {errorCount}
                    </span>
                  )}
                </Link>
              </div>
              <div className="border-t p-1">
                <button
                  onClick={() => logoutMutation.mutate()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
