import { Building2, Users, UserPlus, Wallet, MessageSquareWarning, Loader2, UserRound, UserCheck, Receipt } from 'lucide-react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { useAdminDashboard } from '@/hooks/useAdminDashboard'
import { formatCurrency } from '@/lib/utils'

const typeLabels: Record<string, string> = {
  subscription: 'Abonelik',
  advertiser: 'Reklamveren',
  sponsorship: 'Sponsorluk',
}

const pieColors = ['#be123c', '#2563eb', '#059669']

export function DashboardPage() {
  const { data, isLoading } = useAdminDashboard()

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  const revenueChartData = data?.monthlyRevenue.map((p) => ({ name: p.label, gelir: p.value })) ?? []
  const tenantChartData = data?.tenantGrowth.map((p) => ({ name: p.label, işletme: p.value })) ?? []
  const paymentTypeData = (data?.paymentsByType ?? [])
    .filter((t) => t.amount > 0)
    .map((t) => ({ name: typeLabels[t.type] ?? t.type, value: t.amount }))

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
          subtitle="Sahip + çalışan hesabı"
          icon={<Users />}
          color="purple"
        />
        <StatCard title="Toplam Müşteri" value={data?.totalCustomers ?? 0} icon={<UserRound />} color="teal" />
        <StatCard title="Toplam Personel" value={data?.totalEmployees ?? 0} icon={<UserCheck />} color="orange" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Bu Ay Gelir" value={formatCurrency(data?.revenueThisMonth ?? 0)} icon={<Wallet />} color="green" />
        <StatCard title="Toplam Gelir" value={formatCurrency(data?.revenueAllTime ?? 0)} icon={<Wallet />} color="green" />
        <StatCard title="Toplam Ödeme Kaydı" value={data?.totalPayments ?? 0} icon={<Receipt />} color="blue" />
        <StatCard title="Bu Ay Yeni Kayıt" value={data?.newUsersThisMonth ?? 0} icon={<UserPlus />} color="purple" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aylık Gelir (Son 6 Ay)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₺${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="gelir" fill="#be123c" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gelir Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {paymentTypeData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">Henüz ödeme verisi yok</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                    {paymentTypeData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Yeni İşletme Kayıtları (Son 6 Ay)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tenantChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="işletme" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <StatCard
          title="Son 30 Gün Geri Bildirim"
          value={data?.unresolvedFeedbackCount ?? 0}
          icon={<MessageSquareWarning />}
          color="red"
          className="h-fit"
        />
      </div>
    </div>
  )
}
