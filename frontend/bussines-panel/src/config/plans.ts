import type { Module, PlanId } from '@/types'

export interface PlanConfig {
  id: PlanId
  name: string
  badgeLabel: string
  price: string
  description: string
  ctaLabel: string
  accentClassName: string
  features: string[]
}

export const PLAN_CONFIGS: PlanConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    badgeLabel: 'Başlangıç',
    price: '₺299 / ay',
    description: 'Temel operasyonları hızlıca başlatın.',
    ctaLabel: 'Startera Geç',
    accentClassName: 'text-slate-700 bg-slate-100 border-slate-200',
    features: [
      'Temel randevu, takvim ve müşteri yönetimi',
      'Ödeme takibi ve temel raporlar',
      'Formlar ve paket satışı',
      'Tek şube ile hızlı başlangıç',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    badgeLabel: 'Büyüme',
    price: '₺599 / ay',
    description: 'Pazarlama akışlarını ve çoklu şube operasyonlarını yönetin.',
    ctaLabel: 'Businessa Geç',
    accentClassName: 'text-cyan-700 bg-cyan-50 border-cyan-200',
    features: [
      'Kampanya, kupon ve indirim yönetimi',
      'Online rezervasyon ve bekleme listesi',
      'Sadakat programı ve yorum toplama',
      'Çoklu Şube Yönetimi',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    badgeLabel: 'Otomasyon',
    price: '₺999 / ay',
    description: 'Stok, finans ve ekip performansını tek yerden yönetin.',
    ctaLabel: 'Professionala Geç',
    accentClassName: 'text-blue-700 bg-blue-50 border-blue-200',
    features: [
      'Ürün satışı ve stok yönetimi',
      'Cari alacak ve taksit takibi',
      'Personel performans takibi',
      'Prim, hak ediş, borç ve ödeme takibi',
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    badgeLabel: 'Kurumsal',
    price: 'Özel fiyat',
    description: 'Kuruma özel kurgu, özel akışlar ve genişleme paketi.',
    ctaLabel: 'Satış Ekibiyle Görüş',
    accentClassName: 'text-amber-700 bg-amber-50 border-amber-200',
    features: [
      'Tüm Professional özellikleri',
      'Canlı chatbot ve walk-in sıra yönetimi',
      'Özel entegrasyon ve onboarding',
      'Kuruma özel modül kurgusu ve destek',
    ],
  },
]

export const PLAN_ORDER: PlanId[] = ['starter', 'business', 'professional', 'custom']

export function normalizePlanId(plan?: string | null): PlanId {
  switch (plan) {
    case 'business':
    case 'professional':
    case 'custom':
    case 'starter':
      return plan
    case 'enterprise':
      return 'custom'
    default:
      return 'starter'
  }
}

export function planAllows(currentPlan: PlanId, requiredPlan?: PlanId): boolean {
  if (!requiredPlan) return true
  return PLAN_ORDER.indexOf(currentPlan) >= PLAN_ORDER.indexOf(requiredPlan)
}

export function getPlanConfig(plan: PlanId): PlanConfig {
  return PLAN_CONFIGS.find((item) => item.id === plan) ?? PLAN_CONFIGS[0]
}

export function getNextPlan(currentPlan: PlanId): PlanConfig | null {
  const idx = PLAN_ORDER.indexOf(currentPlan)
  return idx >= 0 && idx < PLAN_ORDER.length - 1 ? getPlanConfig(PLAN_ORDER[idx + 1]) : null
}

export function splitModulesByPlan(modules: Module[], plan: PlanId) {
  return {
    available: modules.filter((module) => planAllows(plan, module.requiredPlan)),
    unavailable: modules.filter((module) => !planAllows(plan, module.requiredPlan)),
  }
}