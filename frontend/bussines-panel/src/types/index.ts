// ─── Business / Tenant ───────────────────────────────────────────────────────
export interface Business {
  id: string
  name: string
  slug: string
  logo?: string
  category?: string
  phone?: string
  email?: string
  address?: string
  timezone: string
  currency: string
  plan: 'starter' | 'business' | 'professional' | 'custom'
  isActive: boolean
}

// ─── Module ──────────────────────────────────────────────────────────────────
export type ModuleId =
  | 'appointments'
  | 'calendar'
  | 'services'
  | 'employees'
  | 'customers'
  | 'packages'
  | 'payments'
  | 'reports'
  | 'notifications'
  | 'campaigns'
  | 'gift-coupons'
  | 'discounts'
  | 'reviews'
  | 'online-booking'
  | 'website-builder'
  | 'pos'
  | 'sms-marketing'
  | 'email-marketing'
  | 'inventory'
  | 'analytics-advanced'
  | 'chatbot'
  | 'forms'
  | 'maps'
  | 'walkin-queue'
  | 'loyalty'
  | 'waiting-list'
  | 'social-media'
  | 'surveys'
  | 'products'
  | 'receivables'
  | 'performance'
  | 'commissions'
  | 'debts'
  | 'branches'
  | 'whatsapp-bot'
  | 'advertisements'
  | 'recommendations'
  | 'no-show-prediction'
  | 'deposits'
  | 'smart-schedule'

export type PlanId = 'starter' | 'business' | 'professional' | 'custom'

export interface Module {
  id: ModuleId
  name: string
  description: string
  icon: string
  category: 'core' | 'marketing' | 'finance' | 'communication' | 'advanced'
  isEnabled: boolean
  isBuiltIn: boolean
  isPremium: boolean
  requiredPlan?: PlanId
  version: string
}

// ─── Permission ───────────────────────────────────────────────────────────────
export type Permission =
  | 'appointments:read'
  | 'appointments:write'
  | 'appointments:delete'
  | 'services:read'
  | 'services:write'
  | 'employees:read'
  | 'employees:write'
  | 'customers:read'
  | 'customers:write'
  | 'payments:read'
  | 'reports:read'
  | 'settings:read'
  | 'settings:write'
  | 'plugins:manage'

export type Role = 'owner' | 'admin' | 'manager' | 'staff' | 'receptionist'

// ─── Notification ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'appointment_new'
  | 'appointment_cancelled'
  | 'appointment_reminder'
  | 'payment_received'
  | 'review_new'
  | 'system'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: string
  link?: string
  metadata?: Record<string, unknown>
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export interface NavItem {
  id: string
  label: string
  to: string
  icon: string
  badge?: number | string
  moduleId?: ModuleId
  permissions?: Permission[]
  children?: NavItem[]
}

export interface NavGroup {
  id: string
  label: string
  icon?: string
  items: NavItem[]
  isCollapsible?: boolean
  defaultOpen?: boolean
}

// ─── KPI ──────────────────────────────────────────────────────────────────────
export interface KpiMetric {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: string
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal'
}

// ─── API ──────────────────────────────────────────────────────────────────────
export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  errors?: Record<string, string[]>
}
