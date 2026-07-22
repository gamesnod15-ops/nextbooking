'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Menu, X, Home, Store, Tag, Sparkles, Info, Phone, LogIn, UserPlus, ChevronDown, Mail, User, LogOut } from 'lucide-react'
import { InstagramIcon, FacebookIcon, XIcon, YouTubeIcon, LinkedInIcon, TikTokIcon } from '@/lib/icons'
import { IsletmelerMegaMenu } from './IsletmelerMegaMenu'

const iconMap: Record<string, React.ReactNode> = {
  '/':           <Home className="h-4 w-4" />,
  '/features':   <Sparkles className="h-4 w-4" />,
  '/isletmeler': <Store className="h-4 w-4" />,
  '/pricing':    <Tag className="h-4 w-4" />,
  '/hakkimizda': <Info className="h-4 w-4" />,
  '/iletisim':   <Phone className="h-4 w-4" />,
}

const topLinks = [
  { href: '/',           label: 'Ana Sayfa' },
  { href: '/isletmeler', label: 'İşletmeler' },
  { href: '/pricing',    label: 'Fiyatlandırma' },
]

const dropdownLinks = [
  { href: '/features',   label: 'Özellikler' },
  { href: '/hakkimizda', label: 'Hakkımızda' },
  { href: '/iletisim',   label: 'İletişim' },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; avatar: string | null; role: string } | null>(null)
  const pathname = usePathname()

  const loadUser = () => {
    const token = localStorage.getItem('accessToken')
    const fullName = localStorage.getItem('fullName')
    const role = localStorage.getItem('role')
    if (token && fullName) {
      setUser({ name: fullName, avatar: localStorage.getItem('profile_avatar'), role: role || '' })
    } else {
      setUser(null)
    }
  }

  useEffect(() => { loadUser() }, [])

  useEffect(() => {
    const handler = () => loadUser()
    window.addEventListener('storage', handler)
    window.addEventListener('profile_avatar_updated', handler)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('profile_avatar_updated', handler)
    }
  }, [])

  function handleLogout() {
    const keys = ['accessToken', 'userId', 'fullName', 'role', 'tenantId', 'profile_avatar']
    keys.forEach((k) => localStorage.removeItem(k))
    setUser(null)
    setUserDropdownOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      {/* Subheader */}
      <div className="hidden md:flex border-b border-gray-200 bg-[#EFEFEF]">
        <div className="mx-auto flex h-9 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-1.5">
            <Mail className="h-3 w-3" />
            <a href="mailto:info@jetrandevu.com" className="text-xs hover:text-brand-500 transition-colors">info@jetrandevu.com</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+908505555555" className="flex items-center gap-1 text-xs hover:text-brand-500 transition-colors">
              <Phone className="h-3 w-3" /> 0850 555 55 55
            </a>
            <span className="text-gray-300 text-[10px]">|</span>
            <div className="flex items-center gap-2">
              <a href="#" aria-label="Instagram" className="hover:text-brand-500 transition-colors"><InstagramIcon size={13} /></a>
              <a href="#" aria-label="Facebook" className="hover:text-brand-500 transition-colors"><FacebookIcon size={13} /></a>
              <a href="#" aria-label="X (Twitter)" className="hover:text-brand-500 transition-colors"><XIcon size={13} /></a>
              <a href="#" aria-label="YouTube" className="hover:text-brand-500 transition-colors"><YouTubeIcon size={13} /></a>
              <a href="#" aria-label="LinkedIn" className="hover:text-brand-500 transition-colors"><LinkedInIcon size={13} /></a>
              <a href="#" aria-label="TikTok" className="hover:text-brand-500 transition-colors"><TikTokIcon size={13} /></a>
            </div>
          </div>
        </div>
      </div>
      <div className="border-b border-white/10 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <img src="/logo-jetrandevu.png" alt="JetRandevu" className="h-6 w-auto sm:h-7" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {[...topLinks, ...dropdownLinks].map((l) => {
            const isActive = pathname === l.href || pathname.startsWith(l.href + '/')
            const linkClassName = `flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? 'rounded-full bg-[#EFEFEF] text-gray-900'
                : 'rounded-full text-gray-600 hover:text-gray-900'
            }`

            if (l.href === '/isletmeler') {
              return <IsletmelerMegaMenu key={l.href} linkClassName={linkClassName} isActive={isActive} />
            }

            return (
              <Link key={l.href} href={l.href} className={linkClassName}>
                {isActive && iconMap[l.href]}
                {l.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-brand-300 hover:text-gray-900 transition-colors"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="max-w-[100px] truncate">{user.name}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-fade-in">
                    <Link
                      href={user?.role === 'customer' ? '/musteri/profil' : '/panel'}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    >
                      <User className="h-4 w-4" />
                      Profil
                    </Link>
                    <hr className="border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Çıkış Yap
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                aria-label="Giriş Yap"
                title="Giriş Yap"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-600 transition-colors hover:border-gray-400 hover:text-gray-900"
              >
                <User className="h-4 w-4" />
              </Link>
              <Link
                href="/register"
                className="flex items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/40"
              >
                Ücretsiz Başlayın
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
          aria-expanded={open}
          className="md:hidden rounded-md p-2 text-gray-600"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {[...topLinks, ...dropdownLinks].map((l) => {
              const isActive = pathname === l.href || pathname.startsWith(l.href + '/')
              return (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'rounded-full bg-[#EFEFEF] text-gray-900'
                      : 'rounded-full text-gray-700 hover:text-gray-900'
                  }`}
                >
                  {isActive && iconMap[l.href]}
                  {l.label}
                </Link>
              )
            })}
            <hr className="my-1 border-gray-100" />
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700">
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  {user.name}
                </div>
                <Link href={user?.role === 'customer' ? '/musteri/profil' : '/panel'} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-700">
                  <User className="h-4 w-4" />
                  Profil
                </Link>
                <button onClick={() => { handleLogout(); setOpen(false) }} className="flex w-full items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-red-600">
                  <LogOut className="h-4 w-4" />
                  Çıkış Yap
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-gray-700">
                  <LogIn className="h-4 w-4" />
                  Giriş Yap
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30"
                >
                  Ücretsiz Başlayın
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
      </div>
    </header>
  )
}
