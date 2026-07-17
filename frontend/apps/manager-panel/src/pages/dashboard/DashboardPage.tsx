import { Building2, Users, UserPlus, Wallet, MessageSquareWarning, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import { formatCurrency } from '@/lib/utils'

export function DashboardPage() {
  const { data, isLoading } = useAdminDashboard()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Gösterge Paneli" description="Platform genelinde özet göstergeler" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam İşletme"
          value={data?.totalTenants ?? 0}
          subtitle={`${data?.activeTenants ?? 0} aktif`}
          icon={<Building2 />}
          color="blue"
        />
        <StatCard
          title="İşletme Kullanıcıları"
          value={data?.totalBusinessUsers ?? 0}
          subtitle="Sahip + çalışan"
          icon={<Users />}
          color="purple"
        />
        <StatCard
          title="Müşteri Kullanıcıları"
          value={data?.totalCustomerUsers ?? 0}
          icon={<UserPlus />}
          color="teal"
        />
        <StatCard
          title="Bu Ay Yeni Kayıt"
          value={data?.newUsersThisMonth ?? 0}
          icon={<UserPlus />}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Bu Ay Gelir"
          value={formatCurrency(data?.revenueThisMonth ?? 0)}
          icon={<Wallet />}
          color="green"
        />
        <StatCard
          title="Toplam Gelir"
          value={formatCurrency(data?.revenueAllTime ?? 0)}
          icon={<Wallet />}
          color="orange"
        />
        <StatCard
          title="Son 30 Gün Geri Bildirim"
          value={data?.unresolvedFeedbackCount ?? 0}
          icon={<MessageSquareWarning />}
          color="red"
        />
      </div>
    </div>
  )
}
