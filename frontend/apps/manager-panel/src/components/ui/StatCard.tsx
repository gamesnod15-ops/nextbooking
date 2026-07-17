import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal'
  className?: string
}

const colorMap = {
  blue: { iconBg: 'bg-blue-100', icon: 'text-blue-600' },
  green: { iconBg: 'bg-emerald-100', icon: 'text-emerald-600' },
  purple: { iconBg: 'bg-purple-100', icon: 'text-purple-600' },
  orange: { iconBg: 'bg-orange-100', icon: 'text-orange-600' },
  red: { iconBg: 'bg-red-100', icon: 'text-red-600' },
  teal: { iconBg: 'bg-teal-100', icon: 'text-teal-600' },
}

export function StatCard({ title, value, subtitle, icon, color = 'blue', className }: StatCardProps) {
  const colors = colorMap[color]
  return (
    <div className={cn('rounded-xl border bg-white p-6 shadow-sm', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colors.iconBg)}>
          <div className={cn('h-6 w-6', colors.icon)}>{icon}</div>
        </div>
      </div>
    </div>
  )
}
