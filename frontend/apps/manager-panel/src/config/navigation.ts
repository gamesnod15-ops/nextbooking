export interface NavItem {
  id: string
  label: string
  to: string
  icon: string
}

export const navigationConfig: NavItem[] = [
  { id: 'dashboard', label: 'Gösterge Paneli', to: '/dashboard', icon: 'LayoutDashboard' },
  { id: 'businesses', label: 'İşletmeler', to: '/businesses', icon: 'Building2' },
  { id: 'pricing-plans', label: 'Paketler', to: '/pricing-plans', icon: 'Tag' },
  { id: 'payments', label: 'Ödemeler', to: '/payments', icon: 'CreditCard' },
  { id: 'feedback', label: 'Geri Bildirimler', to: '/feedback', icon: 'MessageSquare' },
  { id: 'customers', label: 'Müşteriler', to: '/customers', icon: 'UserRound' },
  { id: 'employees', label: 'Personel', to: '/employees', icon: 'UserCheck' },
  { id: 'finance', label: 'Finans Hesaplayıcı', to: '/finance', icon: 'Calculator' },
  { id: 'users', label: 'Yöneticiler', to: '/users', icon: 'Users' },
]
