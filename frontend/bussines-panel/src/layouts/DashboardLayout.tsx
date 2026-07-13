import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleSidebar, toggleSidebarCollapsed } from '@/store/slices/uiSlice'
import { updateProfile } from '@/store/slices/authSlice'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import api from '@/lib/api'

const API_BASE = 'http://localhost:5280'

export function DashboardLayout() {
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen)
  const sidebarCollapsed = useAppSelector((s) => s.ui.sidebarCollapsed)
  const dispatch = useAppDispatch()

  // Uygulama açılınca profil bilgilerini DB'den çek (avatar, unvan vb.)
  useEffect(() => {
    api.get<{ fullName: string; email: string; phone: string | null; jobTitle: string | null; avatarUrl: string | null }>('/users/me')
      .then(r => {
        const d = r.data
        dispatch(updateProfile({
          fullName: d.fullName ?? undefined,
          phone: d.phone ?? undefined,
          jobTitle: d.jobTitle ?? undefined,
          email: d.email ?? undefined,
        }))
        if (d.avatarUrl) {
          const fullUrl = d.avatarUrl.startsWith('/') ? `${API_BASE}${d.avatarUrl}` : d.avatarUrl
          try { localStorage.setItem('profile_avatar', fullUrl) } catch { /* quota */ }
          window.dispatchEvent(new CustomEvent('profile_avatar_updated', { detail: fullUrl }))
        }
      })
      .catch(() => { /* token süresi dolmuşsa auth interceptor zaten logout yapar */ })
  }, [dispatch])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={() => dispatch(toggleSidebar())}
      />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          onMenuClick={() => dispatch(toggleSidebar())}
          onSidebarToggle={() => dispatch(toggleSidebarCollapsed())}
        />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
