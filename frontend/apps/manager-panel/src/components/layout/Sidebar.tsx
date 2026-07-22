import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { navigationConfig } from '@/config/navigation'
import { LayoutDashboard, CreditCard, MessageSquare, Users, Building2, UserRound, UserCheck, Tag, type LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  Users,
  Building2,
  UserRound,
  UserCheck,
  Tag,
}

interface SidebarProps {
  isOpen: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-[#EFEFEF] bg-white text-gray-900 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 shrink-0 items-center border-b border-[#EFEFEF] px-5">
          <img src="/logo-jetrandevu.png" alt="JetRandevu" className="h-7 w-auto" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-0.5">
            {navigationConfig.map((item) => {
              const Icon = iconMap[item.icon]
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-full px-3 py-2 text-[14px] font-medium transition-all',
                      isActive ? 'bg-[#EFEFEF] text-black' : 'text-gray-500 hover:text-gray-900'
                    )
                  }
                >
                  {Icon && <Icon className="h-[15px] w-[15px] shrink-0" />}
                  <span className="flex-1 truncate">{item.label}</span>
                </NavLink>
              )
            })}
          </div>
        </nav>

        <div className="shrink-0 border-t border-[#EFEFEF] px-5 py-4 text-left">
          <p className="text-[12px] font-medium text-gray-900">Platform Yönetici Paneli</p>
          <p className="mt-2 text-[11px] text-gray-500">Created by Bitmap Yazilim - version: 1.0</p>
        </div>
      </aside>
    </>
  )
}
