import { X, Check, Zap, Briefcase, Star, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { getNextPlan, getPlanConfig } from '@/config/plans'
import type { PlanId } from '@/types'

interface UpgradePlanModalProps {
  currentPlan: PlanId
  moduleName: string
  requiredPlan: PlanId
  onClose: () => void
}

export function UpgradePlanModal({ currentPlan, moduleName, requiredPlan, onClose }: UpgradePlanModalProps) {
  const targetPlan = getPlanConfig(requiredPlan) ?? getNextPlan(currentPlan)
  if (!targetPlan) return null

  const planVisuals: Record<PlanId, { icon: React.ReactNode; color: string; ringColor: string }> = {
    starter: {
      icon: <Zap className="h-5 w-5" />,
      color: 'text-slate-700 bg-slate-100',
      ringColor: 'ring-slate-300',
    },
    business: {
      icon: <Briefcase className="h-5 w-5" />,
      color: 'text-cyan-700 bg-cyan-100',
      ringColor: 'ring-cyan-300',
    },
    professional: {
      icon: <Star className="h-5 w-5" />,
      color: 'text-blue-700 bg-blue-100',
      ringColor: 'ring-blue-400',
    },
    custom: {
      icon: <Crown className="h-5 w-5" />,
      color: 'text-amber-700 bg-amber-100',
      ringColor: 'ring-amber-400',
    },
  }
  const targetPlanVisual = planVisuals[targetPlan.id]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="p-6 pb-4 text-center">
          <div className={cn('mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl', targetPlanVisual.color)}>
            {targetPlanVisual.icon}
          </div>
          <h2 className="text-xl font-bold text-gray-900">Plan Yükseltme Gerekli</h2>
          <p className="mt-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{moduleName}</span> eklentisi{' '}
            <span className="font-semibold text-blue-700">{targetPlan.name}</span> planı ve üstünde kullanılabilir.
          </p>
        </div>

        {/* Current vs Target */}
        <div className="mx-6 mb-5 flex items-center gap-3">
          <div className="flex-1 rounded-xl border bg-gray-50 px-4 py-3 text-center">
            <p className="text-[11px] text-gray-400 mb-0.5">Mevcut Plan</p>
            <p className="text-sm font-semibold text-gray-700 capitalize">{currentPlan}</p>
          </div>
          <div className="text-gray-400 font-bold text-lg">→</div>
          <div className={cn('flex-1 rounded-xl border-2 px-4 py-3 text-center', targetPlanVisual.ringColor.replace('ring', 'border'))}>
            <p className="text-[11px] text-gray-400 mb-0.5">Gerekli Plan</p>
            <p className={cn('text-sm font-bold', targetPlanVisual.color.split(' ')[0])}>{targetPlan.name}</p>
          </div>
        </div>

        {/* Features */}
        <div className="mx-6 mb-5 rounded-xl border bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            {targetPlan.name} Planının Avantajları
          </p>
          <ul className="space-y-2">
            {targetPlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm text-gray-700">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Price & CTA */}
        <div className="px-6 pb-6 space-y-3">
          <div className="text-center">
            <span className="text-2xl font-bold text-gray-900">{targetPlan.price}</span>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              alert('Plan yükseltme sayfasına yönlendiriliyorsunuz...')
              onClose()
            }}
          >
            {targetPlan.ctaLabel}
          </Button>
          <button
            onClick={onClose}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Şimdi değil
          </button>
        </div>
      </div>
    </div>
  )
}
