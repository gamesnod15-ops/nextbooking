import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { store } from '@/store'

export type SearchResultCategory =
  | 'pages'
  | 'appointments'
  | 'customers'
  | 'services'
  | 'employees'
  | 'payments'
  | 'reports'
  | 'settings'
  | 'plugins'
  | 'notifications'
  | 'forms'
  | 'messages'

export interface SearchResult {
  id: string
  title: string
  subtitle?: string
  category: SearchResultCategory
  icon: string
  to: string
  meta?: string
}

export interface SearchResultGroup {
  category: SearchResultCategory
  label: string
  icon: string
  results: SearchResult[]
}

const PAGE_RESULTS: SearchResult[] = [
  { id: 'p-dashboard', title: 'Gösterge Paneli', subtitle: 'Ana panel & istatistikler', category: 'pages', icon: '🏠', to: '/dashboard' },
  { id: 'p-appointments', title: 'Randevular', subtitle: 'Randevu listesi & yönetimi', category: 'pages', icon: '📅', to: '/appointments' },
  { id: 'p-calendar', title: 'Takvim', subtitle: 'Takvim görünümü', category: 'pages', icon: '🗓️', to: '/calendar' },
  { id: 'p-services', title: 'Hizmetler', subtitle: 'Hizmet tanımları & fiyatlar', category: 'pages', icon: '✂️', to: '/services' },
  { id: 'p-packages', title: 'Paketler', subtitle: 'Hizmet paketleri', category: 'pages', icon: '📦', to: '/packages' },
  { id: 'p-employees', title: 'Çalışanlar', subtitle: 'Personel yönetimi', category: 'pages', icon: '👥', to: '/employees' },
  { id: 'p-customers', title: 'Müşteriler', subtitle: 'Müşteri rehberi & CRM', category: 'pages', icon: '👤', to: '/customers' },
  { id: 'p-payments', title: 'Ödemeler', subtitle: 'Ödeme geçmişi & faturalar', category: 'pages', icon: '💳', to: '/payments' },
  { id: 'p-campaigns', title: 'Kampanyalar', subtitle: 'Pazarlama kampanyaları', category: 'pages', icon: '🏷️', to: '/campaigns' },
  { id: 'p-discounts', title: 'İndirimler', subtitle: 'İndirim kuponları', category: 'pages', icon: '%', to: '/discounts' },
  { id: 'p-reports', title: 'Raporlar', subtitle: 'Analitik & raporlama', category: 'reports', icon: '📊', to: '/reports' },
  { id: 'p-notifications', title: 'Bildirimler', subtitle: 'Sistem bildirimleri', category: 'notifications', icon: '🔔', to: '/notifications' },
  { id: 'p-plugins', title: 'Eklentiler', subtitle: 'Modül & plugin yönetimi', category: 'plugins', icon: '🔌', to: '/plugins' },
  { id: 'p-forms', title: 'Formlar', subtitle: 'Müşteri formları', category: 'forms', icon: '📋', to: '/forms' },
  { id: 'p-chatbot', title: 'Canlı Chatbot', subtitle: 'Chatbot yönetimi', category: 'messages', icon: '🤖', to: '/chatbot' },
  { id: 'p-settings', title: 'Genel Ayarlar', subtitle: 'İşletme bilgileri', category: 'settings', icon: '⚙️', to: '/settings/general' },
  { id: 'p-settings-hours', title: 'Çalışma Saatleri', subtitle: 'Vardiya & saat ayarları', category: 'settings', icon: '🕐', to: '/settings/hours' },
  { id: 'p-settings-notif', title: 'Bildirim Ayarları', subtitle: 'SMS, e-posta bildirimleri', category: 'settings', icon: '📢', to: '/settings/notifications' },
  { id: 'p-settings-security', title: 'Güvenlik', subtitle: 'Şifre & oturum ayarları', category: 'settings', icon: '🔒', to: '/settings/security' },
  { id: 'p-subscription', title: 'Abonelik', subtitle: 'Plan ve modül erişimi', category: 'settings', icon: '💰', to: '/subscription' },
  { id: 'p-settings-integrations', title: 'Entegrasyonlar', subtitle: 'API & 3. parti bağlantılar', category: 'settings', icon: '🔗', to: '/settings/integrations' },
  { id: 'p-error-monitor', title: 'Hata İzleme', subtitle: 'Sistem hataları & izleme', category: 'settings', icon: '🛡️', to: '/error-monitor' },
]

const CATEGORY_META: Record<SearchResultCategory, { label: string; icon: string }> = {
  pages: { label: 'Sayfalar', icon: '📄' },
  appointments: { label: 'Randevular', icon: '📅' },
  customers: { label: 'Müşteriler', icon: '👤' },
  services: { label: 'Hizmetler', icon: '✂️' },
  employees: { label: 'Personeller', icon: '👥' },
  payments: { label: 'Ödemeler', icon: '💳' },
  reports: { label: 'Raporlar', icon: '📊' },
  settings: { label: 'Ayarlar', icon: '⚙️' },
  plugins: { label: 'Eklentiler', icon: '🔌' },
  notifications: { label: 'Bildirimler', icon: '🔔' },
  forms: { label: 'Formlar', icon: '📋' },
  messages: { label: 'Mesajlar', icon: '💬' },
}

async function searchApi(query: string, tenantId: string | null): Promise<SearchResult[]> {
  if (!tenantId) return []
  const results: SearchResult[] = []

  // Run parallel API queries, gracefully handle failures
  const [appointmentsRes, customersRes, servicesRes, employeesRes] = await Promise.allSettled([
    api.get(`/appointments?search=${encodeURIComponent(query)}&pageSize=3`),
    api.get(`/customers?search=${encodeURIComponent(query)}&pageSize=3`),
    api.get(`/services?search=${encodeURIComponent(query)}&pageSize=3`),
    api.get(`/employees?search=${encodeURIComponent(query)}&pageSize=3`),
  ])

  if (appointmentsRes.status === 'fulfilled') {
    const items = appointmentsRes.value.data?.items ?? appointmentsRes.value.data ?? []
    for (const a of items.slice(0, 3)) {
      results.push({
        id: `apt-${a.id}`,
        title: `${a.customerName ?? 'Müşteri'} - ${a.serviceName ?? 'Hizmet'}`,
        subtitle: a.startTime ? new Date(a.startTime).toLocaleString('tr-TR') : undefined,
        category: 'appointments',
        icon: '📅',
        to: '/appointments',
        meta: a.status,
      })
    }
  }

  if (customersRes.status === 'fulfilled') {
    const items = customersRes.value.data?.items ?? customersRes.value.data ?? []
    for (const c of items.slice(0, 3)) {
      results.push({
        id: `cust-${c.id}`,
        title: c.fullName ?? c.name ?? 'Müşteri',
        subtitle: c.phone ?? c.email,
        category: 'customers',
        icon: '👤',
        to: '/customers',
      })
    }
  }

  if (servicesRes.status === 'fulfilled') {
    const items = servicesRes.value.data?.items ?? servicesRes.value.data ?? []
    for (const s of items.slice(0, 3)) {
      results.push({
        id: `svc-${s.id}`,
        title: s.name,
        subtitle: s.durationMinutes ? `${s.durationMinutes} dk` : undefined,
        category: 'services',
        icon: '✂️',
        to: '/services',
        meta: s.price ? `${s.price} ₺` : undefined,
      })
    }
  }

  if (employeesRes.status === 'fulfilled') {
    const items = employeesRes.value.data?.items ?? employeesRes.value.data ?? []
    for (const e of items.slice(0, 3)) {
      results.push({
        id: `emp-${e.id}`,
        title: e.fullName ?? e.name ?? 'Personel',
        subtitle: e.specialization ?? e.title,
        category: 'employees',
        icon: '👥',
        to: '/employees',
      })
    }
  }

  return results
}

function searchPages(query: string): SearchResult[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return PAGE_RESULTS.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      (p.subtitle ?? '').toLowerCase().includes(q)
  )
}

function groupResults(results: SearchResult[]): SearchResultGroup[] {
  const map = new Map<SearchResultCategory, SearchResult[]>()
  for (const r of results) {
    if (!map.has(r.category)) map.set(r.category, [])
    map.get(r.category)!.push(r)
  }
  return Array.from(map.entries()).map(([category, items]) => ({
    category,
    label: CATEGORY_META[category]?.label ?? category,
    icon: CATEGORY_META[category]?.icon ?? '📄',
    results: items,
  }))
}

export function useGlobalSearch() {
  const [query, setQuery] = useState('')
  const [groups, setGroups] = useState<SearchResultGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigate = useNavigate()

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setGroups([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const tenantId = store.getState().auth.tenantId

      const [pageResults, apiResults] = await Promise.all([
        Promise.resolve(searchPages(q)),
        searchApi(q, tenantId),
      ])

      const combined = [...pageResults, ...apiResults]
      const grouped = groupResults(combined)
      setGroups(grouped)
      setTotalCount(combined.length)
    } catch {
      // Fallback to page search only
      const pageResults = searchPages(q)
      setGroups(groupResults(pageResults))
      setTotalCount(pageResults.length)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (!query.trim()) {
      setGroups([])
      setTotalCount(0)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    debounceTimer.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, search])

  const navigateTo = useCallback(
    (result: SearchResult) => {
      navigate(result.to)
    },
    [navigate]
  )

  return { query, setQuery, groups, isLoading, totalCount, navigateTo }
}
