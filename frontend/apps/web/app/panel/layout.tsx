'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingBag,
  CreditCard,
  User,
  LogOut,
  ExternalLink,
  ChevronRight,
  Globe,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/panel',                   label: 'Genel Bakış',       icon: LayoutDashboard },
  { href: '/panel/paket',             label: 'Paket Bilgisi',     icon: Package },
  { href: '/panel/fatura',            label: 'Fatura Bilgisi',    icon: Receipt },
  { href: '/panel/siparisler',        label: 'Siparişler',        icon: ShoppingBag },
  { href: '/panel/odeme-yontemleri',  label: 'Ödeme Yöntemleri', icon: CreditCard },
  { href: '/panel/profil',            label: 'Profil Bilgileri',  icon: User },
]







export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [fullName, setFullName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [businessPanelUrl, setBusinessPanelUrl] = useState(process.env.NEXT_PUBLIC_BUSINESS_PANEL_URL || 'http://localhost:3000');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/');
      return;
    }
    setFullName(localStorage.getItem('fullName') ?? '');
    setAvatar(localStorage.getItem('profile_avatar'));
    const t = localStorage.getItem('accessToken') ?? '';
    const userId = localStorage.getItem('userId') ?? '';
    const role = localStorage.getItem('role') ?? '';
    const tenantId = localStorage.getItem('tenantId') ?? '';
    const fullName = localStorage.getItem('fullName') ?? '';
    const params = new URLSearchParams({ autologin: t, userId, role, tenantId, fullName });
    setBusinessPanelUrl(`${process.env.NEXT_PUBLIC_BUSINESS_PANEL_URL || 'http://localhost:3000'}?${params.toString()}`);

    const handler = () => {
      setFullName(localStorage.getItem('fullName') ?? '');
      setAvatar(localStorage.getItem('profile_avatar'));
    };
    window.addEventListener('storage', handler);
    window.addEventListener('profile_avatar_updated', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('profile_avatar_updated', handler);
    };
  }, [router]);

  const handleLogout = () => {
    ;['accessToken', 'userId', 'fullName', 'role', 'tenantId', 'profile_avatar'].forEach((k) => localStorage.removeItem(k))
    document.cookie.split(';').forEach((c) => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, `=;expires=${new Date(0).toUTCString()};path=/`);
    });
    router.replace('/login')
  }

  const Sidebar = (
    <aside className="flex flex-col h-full w-64 bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-100">
        <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#EFEFEF] text-black rounded-full'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="ml-auto h-3 w-3 text-gray-400" />}
            </Link>
          )
        })}

        {/* İşletme Paneli bağlantısı */}
        <div className="pt-4 mt-4 border-t border-gray-100">
          <a
            href={businessPanelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium text-black bg-[#EFEFEF] hover:bg-gray-200 transition-colors"
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span>İşletme Paneline Git</span>
            <ExternalLink className="ml-auto h-3 w-3" />
          </a>
        </div>
      </nav>

      {/* Çıkış */}
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Çıkış Yap</span>
        </button>
      </div>

      {/* User footer */}
      <div className="border-t border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          {avatar ? (
            <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFEFEF] text-gray-700 font-semibold text-sm">
              {fullName?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{fullName || 'Kullanıcı'}</p>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col">{Sidebar}</div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 flex flex-col">{Sidebar}</div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-white border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="text-gray-600">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-bold text-gray-900">Hesap Paneli</span>
          <div className="w-5" />
        </header>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
