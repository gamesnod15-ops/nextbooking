import { useAppSelector } from '@/store'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  CalendarCheck,
  Users,
  CreditCard,
  TrendingUp,
  Plus,
  Calendar,
  UserCheck,
  Scissors,
  ChevronRight,
  Clock,
  Loader2,
  AlertTriangle,
  FileText,
  MessageCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDashboardStats } from '@/hooks/useDashboard'
import api from '@/lib/api'
import { useEffect, useState } from 'react'

function useBillingCompleteness() {
  const [hasBilling, setHasBilling] = useState(false)
  const [hasCard, setHasCard] = useState(false)

  useEffect(() => {
    api.get<any>('/business/me').then(r => {
      const d = r.data
      setHasBilling(!!(d.address || d.taxNumber || d.settings?.billing_contact_name))
    }).catch(() => {})

    api.get<any>('/payments/cards').then(r => {
      const cards = Array.isArray(r.data) ? r.data : r.data?.items ?? r.data?.data ?? []
      setHasCard(cards.length > 0)
    }).catch(() => {})
  }, [])

  return { hasBilling, hasCard }
}

const quickActions = [
  { label: 'Randevu Ekle', icon: CalendarCheck, to: '/appointments', color: 'text-blue-600 bg-blue-50' },
  { label: 'Müşteri Ekle', icon: Users, to: '/customers', color: 'text-emerald-600 bg-emerald-50' },
  { label: 'Hizmet Ekle', icon: Scissors, to: '/services', color: 'text-purple-600 bg-purple-50' },
  { label: 'Personel Ekle', icon: UserCheck, to: '/employees', color: 'text-orange-600 bg-orange-50' },
]

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'info' }> = {
  confirmed: { label: 'Onaylandı', variant: 'success' },
  pending: { label: 'Beklemede', variant: 'warning' },
  cancelled: { label: 'İptal', variant: 'destructive' },
  completed: { label: 'Tamamlandı', variant: 'info' },
}

/** WhatsApp bookings on the dashboard: 4 per row, at most 8 (2 rows) — the
 *  rest live on the WhatsApp bot page's appointments tab. */
function WhatsAppBookingsSection() {
  const appointments = useAppSelector((s) => s.whatsappBot.appointments)
  if (appointments.length === 0) return null

  const visible = appointments.slice(0, 8)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
              <MessageCircle className="h-3.5 w-3.5 text-green-600" />
            </span>
            WhatsApp Randevuları
          </CardTitle>
          <CardDescription>Bot üzerinden gelen randevu talepleri</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/whatsapp-bot?tab=appointments" className="flex items-center gap-1">
            {appointments.length > 8 ? `Tümünü Gör (${appointments.length})` : 'Tümü'}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((apt) => {
            const status = statusConfig[apt.status] ?? { label: apt.status, variant: 'info' as const }
            return (
              <div key={apt.id} className="rounded-xl border p-3.5 transition-colors hover:bg-accent/50">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                    {apt.customerName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || 'W'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{apt.customerName}</p>
                    <p className="truncate text-xs text-muted-foreground">{apt.customerPhone}</p>
                  </div>
                </div>
                <div className="mt-2.5 space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5 truncate">
                    <Scissors className="h-3 w-3 shrink-0" /> {apt.selectedService || '—'}
                  </p>
                  <p className="flex items-center gap-1.5 truncate">
                    <Clock className="h-3 w-3 shrink-0" /> {apt.selectedSlot || '—'}
                  </p>
                </div>
                <div className="mt-2.5">
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const business = useAppSelector((s) => s.business.business)
  const { data: stats, isLoading } = useDashboardStats()
  const { hasBilling, hasCard } = useBillingCompleteness()
  const missingItems = [...(!hasBilling ? ['Fatura adresi'] : []), ...(!hasCard ? ['Ödeme yöntemi'] : [])]

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Günaydın'
    if (h < 18) return 'İyi günler'
    return 'İyi akşamlar'
  }

  const weeklyChartData = stats?.weeklyStats?.map(w => ({
    day: w.day,
    count: w.appointments,
  })) ?? []

  const monthlyChartData = stats?.monthlyStats?.map(m => ({
    month: m.month,
    revenue: m.revenue,
  })) ?? []

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={`${greeting()}, ${business?.name ?? 'İşletme'}! 👋`}
        description="İşletmenizin güncel durumuna genel bakış"
      >
        <Button asChild size="sm" variant="outline">
          <Link to="/calendar">
            <Calendar className="h-4 w-4" />
            Takvimi Aç
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link to="/calendar?new=true">
            <Plus className="h-4 w-4" />
            Randevu Ekle
          </Link>
        </Button>
      </PageHeader>

      {/* Billing completeness warning */}
      {missingItems.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div className="flex-1 text-sm">
            <span className="font-medium text-amber-900">Eksik profil bilgisi: </span>
            <span className="text-amber-800">{missingItems.join(' ve ')} eklenmeden paket değişikliği yapılamaz.</span>
          </div>
          <Link
            to="/settings/profile"
            className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
          >
            <FileText className="h-3.5 w-3.5" />
            Profili Tamamla
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Bugünkü Randevular"
          value={String(stats?.todayAppointments ?? 0)}
          change={0}
          changeLabel="bugün"
          icon={<CalendarCheck className="h-full w-full" />}
          color="blue"
        />
        <StatCard
          title="Toplam Müşteri"
          value={String(stats?.totalCustomers ?? 0)}
          change={0}
          changeLabel="toplam"
          icon={<Users className="h-full w-full" />}
          color="green"
        />
        <StatCard
          title="Aylık Gelir"
          value={`₺${(stats?.monthRevenue ?? 0).toLocaleString('tr-TR')}`}
          change={0}
          changeLabel="bu ay"
          icon={<CreditCard className="h-full w-full" />}
          color="purple"
        />
        <StatCard
          title="Doluluk Oranı"
          value={`%${Math.round(stats?.occupancyRate ?? 0)}`}
          change={0}
          changeLabel="bu hafta"
          icon={<TrendingUp className="h-full w-full" />}
          color="orange"
        />
      </div>

      {/* WhatsApp bookings */}
      <WhatsAppBookingsSection />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Haftalık Randevu Dağılımı</CardTitle>
            <CardDescription>Bu haftaki günlük randevu sayıları</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyChartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                  formatter={(value: number) => [`${value} randevu`, 'Adet']}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aylık Gelir</CardTitle>
            <CardDescription>Son 6 ay gelir trendi</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                  formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Gelir']}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's appointments */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle>Bugünkü Randevular</CardTitle>
              <CardDescription>Günün randevu programı</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/appointments" className="flex items-center gap-1">
                Tümü <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0 divide-y">
              {(stats?.todayAppointmentList ?? []).length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">Bugün randevu yok</p>
              ) : (stats?.todayAppointmentList ?? []).map((apt) => {
                const status = statusConfig[apt.status] ?? { label: apt.status, variant: 'info' as const }
                const timeStr = new Date(apt.startTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                return (
                  <div key={apt.id} className="flex items-center gap-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {apt.customerName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{apt.customerName}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {apt.serviceName} · {apt.employeeName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeStr}
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map(({ label, icon: Icon, to, color }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex flex-col items-center gap-2 rounded-xl border p-3 text-center hover:bg-accent transition-colors"
                  >
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium leading-tight">{label}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Sistem Durumu</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {[
                { label: 'Online Rezervasyon', status: true },
                { label: 'SMS Bildirimleri', status: false },
                { label: 'Otomatik Hatırlatma', status: true },
                { label: 'Ödeme Sistemi', status: true },
              ].map(({ label, status }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <span
                    className={cn(
                      'flex items-center gap-1 text-xs font-medium',
                      status ? 'text-emerald-600' : 'text-muted-foreground'
                    )}
                  >
                    <div className={cn('h-1.5 w-1.5 rounded-full', status ? 'bg-emerald-500' : 'bg-gray-300')} />
                    {status ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

