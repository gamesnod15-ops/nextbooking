import { PageHeader } from '@/components/ui/PageHeader'
import { BillingSettings } from '@/pages/settings/SettingsPage'

export function SubscriptionPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Abonelik"
        description="Planınızı, modül erişimlerinizi ve geçiş seçeneklerinizi yönetin"
      />
      <BillingSettings />
    </div>
  )
}