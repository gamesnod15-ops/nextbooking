import { useState } from 'react'
import { useAppSelector, useAppDispatch } from '@/store'
import { toggleModule } from '@/store/slices/modulesSlice'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { UpgradePlanModal } from '@/components/ui/UpgradePlanModal'
import { normalizePlanId, planAllows } from '@/config/plans'
import { cn } from '@/lib/utils'
import {
  CalendarCheck,
  CalendarDays,
  Scissors,
  UserCheck,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Tag,
  Gift,
  Percent,
  Star,
  Globe,
  Layout,
  MessageSquare,
  Mail,
  TrendingUp,
  Lock,
  CheckCircle2,
  MapPin,
  ListOrdered,
  Award,
  ClipboardList,
  Share2,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react'
import type { Module, PlanId } from '@/types'

const iconMap: Record<string, LucideIcon> = {
  CalendarCheck,
  CalendarDays,
  Scissors,
  UserCheck,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Tag,
  Gift,
  Percent,
  Star,
  Globe,
  Layout,
  MessageSquare,
  Mail,
  TrendingUp,
  MapPin,
  ListOrdered,
  Award,
  ClipboardList,
  Share2,
  ClipboardCheck,
}

const categoryLabels: Record<string, string> = {
  core: 'Temel',
  marketing: 'Pazarlama',
  finance: 'Finans',
  communication: 'İletişim',
  advanced: 'Gelişmiş',
}

const categoryOrder = ['core', 'finance', 'marketing', 'communication', 'advanced']

interface ModuleCardProps {
  module: Module
  currentPlan: PlanId
  onUpgradeRequired: (module: Module) => void
}

function ModuleCard({ module, currentPlan, onUpgradeRequired }: ModuleCardProps) {
  const dispatch = useAppDispatch()
  const Icon = iconMap[module.icon] ?? Package

  const isAllowed = planAllows(currentPlan, module.requiredPlan)
  const isPlanRestricted = module.isPremium && !isAllowed

  function handleToggle() {
    if (isPlanRestricted) {
      onUpgradeRequired(module)
      return
    }
    dispatch(toggleModule(module.id))
  }

  return (
    <Card
      className={cn(
        'transition-all',
        module.isEnabled ? 'ring-1 ring-primary/20' : 'opacity-80'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
              module.isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold">{module.name}</h3>
              {module.isBuiltIn && (
                <Badge variant="info" className="text-[10px] px-1.5 py-0">
                  Dahili
                </Badge>
              )}
              {module.isPremium && (
                <Badge variant="purple" className="text-[10px] px-1.5 py-0">
                  Premium
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
              {module.description}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60">v{module.version}</span>
              {module.isBuiltIn ? (
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Her zaman aktif
                </div>
              ) : isPlanRestricted ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={handleToggle}
                >
                  <Lock className="h-3 w-3" />
                  Planı Yükselt
                </Button>
              ) : (
                <button
                  onClick={handleToggle}
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    module.isEnabled ? 'bg-primary' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                      module.isEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    )}
                  />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function PluginsPage() {
  const modules = useAppSelector((s) => s.modules.modules)
  const business = useAppSelector((s) => s.business.business)
  const currentPlan: PlanId = normalizePlanId(business?.plan)
  const [upgradeModule, setUpgradeModule] = useState<Module | null>(null)

  const enabledCount = modules.filter((m) => m.isEnabled).length
  const totalCount = modules.length

  const byCategory = categoryOrder.map((cat) => ({
    category: cat,
    label: categoryLabels[cat],
    items: modules.filter((m) => m.category === cat),
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eklentiler & Modüller"
        description="İşletmeniz için ihtiyacınıza göre özellikleri açın veya kapatın"
      >
        <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium">{enabledCount}</span>
          <span className="text-muted-foreground">/ {totalCount} aktif</span>
        </div>
      </PageHeader>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white text-[10px] font-bold">
          i
        </div>
        <div>
          <p className="text-sm font-medium text-blue-900">Modüler Yapı</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Dahili modüller her zaman aktiftir ve devre dışı bırakılamaz. Premium modüller için planınızı
            yükseltmeniz gerekir. Diğer tüm modülleri dilediğiniz zaman açıp kapatabilirsiniz.
          </p>
        </div>
      </div>

      {/* Module groups */}
      <div className="space-y-8">
        {byCategory.map(({ category, label, items }) => (
          <div key={category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {label} <span className="ml-1 font-normal normal-case">({items.length})</span>
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  currentPlan={currentPlan}
                  onUpgradeRequired={setUpgradeModule}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upgrade modal */}
      {upgradeModule && (
        <UpgradePlanModal
          currentPlan={currentPlan}
          moduleName={upgradeModule.name}
          requiredPlan={upgradeModule.requiredPlan ?? 'professional'}
          onClose={() => setUpgradeModule(null)}
        />
      )}
    </div>
  )
}
