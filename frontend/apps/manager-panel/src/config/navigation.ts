export interface NavItem {
  id: string
  label: string
  to: string
  icon: string
}

export const navigationConfig: NavItem[] = [
  { id: 'dashboard', label: 'Gösterge Paneli', to: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'businesses', label: 'İşletmeler', to: '/businesses', icon: 'Building2' },
  { id: 'payments', label: 'Ödemeler', to: '/payments', icon: 'CreditCard' },
  { id: 'feedback', label: 'Geri Bildirimler', to: '/feedback', icon: 'MessageSquare' },
  { id: 'users', label: 'Kullanıcılar', to: '/users', icon: 'Users' },
  { id: 'customers', label: 'Müşteriler', to: '/customers', icon: 'UserRound' },
]
