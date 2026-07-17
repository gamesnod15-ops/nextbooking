import { Outlet } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleSidebar } from '@/store/slices/uiSlice'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export function DashboardLayout() {
  const sidebarOpen = useAppSelector((s) => s.ui.sidebarOpen)
  const dispatch = useAppDispatch()

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => dispatch(toggleSidebar())} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => dispatch(toggleSidebar())} />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
