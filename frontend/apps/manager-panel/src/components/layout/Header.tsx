import { useRef, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/store'
import { useLogout } from '@/hooks/useAuth'
import { Menu, LogOut, ChevronDown, Shield } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { fullName, email } = useSelector((s: RootState) => s.auth)
  const logoutMutation = useLogout()
  const [userOpen, setUserOpen] = useState(false)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const initials = fullName ? fullName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() : 'Y'

  return (
    <header className="flex h-16 shrink-0 items-center border-b bg-white px-4 lg:px-6 gap-3">
      <button onClick={onMenuClick} className="rounded-md p-2 text-muted-foreground hover:bg-accent lg:hidden shrink-0">
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex flex-1 items-center gap-2 text-sm font-medium text-gray-500">
        <Shield className="h-4 w-4 text-primary" />
        Platform Yönetimi
      </div>

      <div ref={userRef} className="relative">
        <button
          onClick={() => setUserOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="hidden flex-col items-start text-left sm:flex">
            <span className="text-sm font-medium leading-none">{fullName ?? 'Yönetici'}</span>
            <span className="text-[11px] text-muted-foreground">{email}</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        {userOpen && (
          <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border bg-white shadow-xl">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">{fullName}</p>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
            <div className="p-1">
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
    </header>
  )
}
