'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Calendar, User, LogOut, Menu, X, Clock,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/musteri',             label: 'Randevularım', icon: Calendar },
  { href: '/musteri/profil',      label: 'Profilim',     icon: User },
]

export default function MusteriLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [fullName, setFullName] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      router.replace('/')
      return
    }
    setFullName(localStorage.getItem('fullName') ?? '')

    const handler = () => setFullName(localStorage.getItem('fullName') ?? '')
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [router])

  const handleLogout = () => {
    ;['accessToken', 'userId', 'fullName', 'role', 'tenantId', 'profile_avatar'].forEach(k => localStorage.removeItem(k))
    router.replace('/login')
  }

  const Sidebar = (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-gray-100">
      <div className="flex items-center px-5 h-16 border-b border-gray-100 shrink-0">
        <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || (item.href !== '/musteri' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-500 text-black shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-black text-xs font-bold uppercase">
            {fullName.charAt(0) || '?'}
          </div>
          <span className="text-sm font-medium text-gray-900 truncate">{fullName || 'Kullanıcı'}</span>
        </div>
        <button onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
          <LogOut className="h-4 w-4" /> Çıkış Yap
        </button>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden lg:flex flex-col">{Sidebar}</div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 flex flex-col">{Sidebar}</div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} aria-label="Menüyü aç" className="text-gray-600">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-gray-900">Müşteri Paneli</span>
          <div className="w-5" />
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
