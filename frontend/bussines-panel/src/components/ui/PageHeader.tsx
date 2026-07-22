import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  /** Hides the description on mobile widths (<lg), keeping it on desktop. */
  descriptionHiddenOnMobile?: boolean
  children?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, descriptionHiddenOnMobile, children, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between', className)}>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className={cn('mt-1 text-sm text-muted-foreground', descriptionHiddenOnMobile && 'hidden lg:block')}>
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  )
}
