import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { normalizePlanId, planAllows } from '@/config/plans'
import { cn } from '@/lib/utils'
import { useAppSelector } from '@/store'
import { navigationConfig } from '@/config/navigation'
import {
  AlertCircle,
  Award,
  Banknote,
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Gift,
  Heart,
  LayoutDashboard,
  ListOrdered,
  MapPin,
  Megaphone,
  MessageSquare,
  Package,
  Percent,
  Puzzle,
  Scissors,
  Settings,
  Share2,
  ShieldAlert,
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

// Custom WhatsApp brand icon (not in Lucide)
const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const iconMap: Record<string, LucideIcon | typeof WhatsAppIcon> = {
  AlertCircle,
  Award,
  Banknote,
  BarChart3,
  Bell,
  Brain,
  Briefcase,
  Building2,
  CalendarCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Gift,
  Heart,
  LayoutDashboard,
  ListOrdered,
  MapPin,
  Megaphone,
  MessageSquare,
  Package,
  Percent,
  Puzzle,
  Scissors,
  Settings,
  Share2,
  ShieldAlert,
  Sparkles,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
  WhatsApp: WhatsAppIcon,
}

interface SidebarProps {
  isOpen: boolean
  isCollapsed: boolean
  onClose?: () => void
}

const planBadge: Record<string, { label: string; className: string }> = {
  starter: { label: 'Starter', className: 'bg-[#EFEFEF] text-gray-700' },
  business: { label: 'Business', className: 'bg-[#EFEFEF] text-gray-700' },
  professional: { label: 'Pro', className: 'bg-[#EFEFEF] text-gray-700' },
  custom: { label: 'Custom', className: 'bg-[#EFEFEF] text-gray-700' },
}

export function Sidebar({ isOpen, isCollapsed, onClose }: SidebarProps) {
  const business = useAppSelector((s) => s.business.business)
  const modules = useAppSelector((s) => s.modules.modules)
  const unreadCount = useAppSelector((s) => s.notifications.unreadCount)
  const location = useLocation()
  const plan = normalizePlanId(business?.plan)
  const badge = planBadge[plan]

  const collapsedItems = navigationConfig.flatMap((group) =>
    group.items.filter((item) => {
      if (!item.moduleId) return true
      const module = modules.find((currentModule) => currentModule.id === item.moduleId)
      return (module?.isEnabled ?? true) && planAllows(plan, module?.requiredPlan)
    })
  )

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    navigationConfig.forEach((g) => {
      if (g.isCollapsible) init[g.id] = g.defaultOpen ?? false
    })
    return init
  })

  const toggleGroup = (id: string) =>
    setOpenGroups((prev) => {
      const nextState: Record<string, boolean> = {}

      navigationConfig.forEach((group) => {
        if (group.isCollapsible) {
          nextState[group.id] = group.id === id ? !prev[id] : false
        }
      })

      return nextState
    })

  const isModuleEnabled = (moduleId?: string) => {
    if (!moduleId) return true
    const module = modules.find((currentModule) => currentModule.id === moduleId)
    return (module?.isEnabled ?? true) && planAllows(plan, module?.requiredPlan)
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#EFEFEF] bg-white text-gray-900 transition-[width,transform] duration-300 ease-in-out lg:relative lg:translate-x-0',
          isCollapsed ? 'w-[76px]' : 'w-60',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo / Brand */}
        <div className={cn('flex h-16 shrink-0 items-center border-b border-[#EFEFEF]', isCollapsed ? 'justify-center px-2' : 'px-5')}>
          {isCollapsed ? (
            <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
          ) : (
            <img src="/logo.png" alt="Logo" className="h-7 w-auto" />
          )}
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-x-hidden py-3 no-scrollbar', isCollapsed ? 'overflow-y-auto px-2' : 'overflow-y-auto px-3')}>
          {isCollapsed ? (
            <div className="space-y-1">
              {collapsedItems.map((item) => {
                const Icon = iconMap[item.icon]
                const hasUnread = item.id === 'notifications' && unreadCount > 0

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex h-11 items-center justify-center rounded-full transition-all',
                        isActive
                          ? 'bg-[#EFEFEF] text-black'
                          : 'text-gray-500 hover:text-gray-900'
                      )
                    }
                  >
                    {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                    {hasUnread && (
                      <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          ) : (
            <div className="space-y-0.5">
          {navigationConfig.map((group) => {
            const visibleItems = group.items.filter((item) => isModuleEnabled(item.moduleId))
            if (visibleItems.length === 0) return null

            const GroupIcon = group.icon ? iconMap[group.icon] : null
            const groupOpen = group.isCollapsible ? (openGroups[group.id] ?? false) : true
            const hasActiveChild = visibleItems.some((item) =>
              location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            )

            return (
              <div key={group.id} className="space-y-0.5">
                {group.isCollapsible ? (
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className={cn(
                      'mt-2 flex w-full items-center gap-2 px-3 py-2 text-[14px] font-medium transition-colors',
                      hasActiveChild && !groupOpen
                        ? 'bg-[#EFEFEF] rounded-full'
                        : 'text-gray-500 hover:text-gray-900'
                    )}
                  >
                    {GroupIcon && <GroupIcon className="h-3.5 w-3.5 shrink-0" />}
                    <span className="flex-1 text-left">{group.label}</span>
                    {hasActiveChild && !groupOpen && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />
                    )}
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                        groupOpen && 'rotate-180'
                      )}
                    />
                  </button>
                ) : null}

                {groupOpen && (
                  <div className={cn('space-y-0.5', group.isCollapsible && 'ml-3 border-l border-[#EFEFEF] pl-2')}>
                    {visibleItems.map((item) => {
                      const Icon = iconMap[item.icon]
                      const hasUnread = item.id === 'notifications' && unreadCount > 0
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) =>
                            cn(
                              'group flex items-center gap-3 px-3 py-2 text-[14px] font-medium transition-all',
                              isActive
                                ? 'bg-[#EFEFEF] text-black rounded-full'
                                : 'text-gray-500 hover:text-gray-900'
                            )
                          }
                        >
                          {Icon && <Icon className="h-[15px] w-[15px] shrink-0" />}
                          <span className="flex-1 truncate">{item.label}</span>
                          {hasUnread && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
            </div>
          )}
        </nav>

        {!isCollapsed && badge && (
          <div className="shrink-0 border-t border-[#EFEFEF] px-5 py-4 text-left">
            <p className="text-[12px] font-medium text-gray-900">{badge.label} isletme paneli</p>
            <p className="mt-2 text-[11px] text-gray-500">Created by Bitmap Yazilim - version: 1.0</p>
          </div>
        )}
      </aside>
    </>
  )
}
