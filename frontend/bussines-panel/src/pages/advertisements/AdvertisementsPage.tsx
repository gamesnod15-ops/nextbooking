import { useState, useMemo } from 'react'
import { useSelector } from 'react-redux'
import {
  Megaphone,
  Plus,
  Zap,
  Star,
  Crown,
  TrendingUp,
  Eye,
  MousePointerClick,
  Target,
  Clock,
  Pause,
  Play,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  BarChart3,
  ChevronRight,
  Loader2,
  CalendarRange,
  MapPin,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { RootState } from '@/store'
import { normalizePlanId, planAllows } from '@/config/plans'
import { PageHeader } from '@/components/ui/PageHeader'
import {
  useAdvertisements,
  useAdAnalytics,
  useCreateAdvertisement,
  useUpdateAdStatus,
  useDeleteAdvertisement,
  type AdStatus,
  type AdPackageType,
  type AdTargetCategory,
  type CreateAdPayload,
} from '@/hooks/useAdvertisements'

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'my-ads' | 'packages' | 'create' | 'analytics'

interface AdForm {
  title: string
  description: string
  packageType: AdPackageType
  targetCategory: AdTargetCategory
  targetLocation: string
  budget: number | ''
  startDate: string
  endDate: string
}

type FormErrors = Partial<Record<keyof AdForm, string>>

// ─── Constants ───────────────────────────────────────────────────────────────

const AD_PACKAGES: {
  id: AdPackageType
  name: string
  price: string
  priceNote: string
  icon: React.ReactNode
  tagline: string
  color: string
  borderColor: string
  bgGradient: string
  badgeBg: string
  badgeText: string
  requiredPlan: 'business' | 'professional'
  recommended: boolean
  visibility: string
  impressions: string
  features: string[]
  usageHint: string
}[] = [
  {
    id: 'basic_boost',
    name: 'Basic Boost',
    price: '₺99',
    priceNote: '/ 7 gün',
    icon: <Zap size={22} />,
    tagline: 'Yerel görünürlüğünüzü artırın',
    color: 'text-slate-700',
    borderColor: 'border-slate-200',
    bgGradient: 'from-slate-50 to-white',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    requiredPlan: 'business',
    recommended: false,
    visibility: 'Yerel',
    impressions: '500–1.000',
    features: [
      'Kategori listesinde öne çıkma',
      'Yerel arama görünürlüğü',
      '7 günlük aktif süre',
      'Temel performans raporu',
      'Tek hedef kategori',
    ],
    usageHint: 'Yeni işletmeler ve sezonluk tanıtımlar için idealdir.',
  },
  {
    id: 'professional_boost',
    name: 'Professional Boost',
    price: '₺249',
    priceNote: '/ 14 gün',
    icon: <Star size={22} />,
    tagline: 'Daha fazla müşteriye ulaşın',
    color: 'text-blue-700',
    borderColor: 'border-blue-200',
    bgGradient: 'from-blue-50 to-white',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    requiredPlan: 'business',
    recommended: true,
    visibility: 'Bölgesel',
    impressions: '2.000–5.000',
    features: [
      'Ana sayfada öne çıkma',
      'Bölgesel arama önceliği',
      '14 günlük aktif süre',
      'Detaylı analitik rapor',
      'Çoklu hedef kategori',
      'E-posta & bildirim tanıtımı',
    ],
    usageHint: 'Büyümekte olan işletmeler için en popüler seçenek.',
  },
  {
    id: 'premium_spotlight',
    name: 'Premium Spotlight',
    price: '₺599',
    priceNote: '/ 30 gün',
    icon: <Crown size={22} />,
    tagline: 'Maksimum görünürlük ve dönüşüm',
    color: 'text-amber-700',
    borderColor: 'border-amber-300',
    bgGradient: 'from-amber-50 via-orange-50 to-white',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    requiredPlan: 'professional',
    recommended: false,
    visibility: 'Ulusal',
    impressions: '10.000–25.000',
    features: [
      'Premium banner konumu',
      'Ulusal arama önceliği',
      '30 günlük aktif süre',
      'Gelişmiş analitik & ROI raporu',
      'Çoklu lokasyon hedefleme',
      'Sosyal medya entegrasyonu',
      'Özel kampanya desteği',
      'Öncelikli müşteri hizmetleri',
    ],
    usageHint: 'Hızlı büyüme hedefleyen ve maksimum erişim isteyen işletmeler için.',
  },
]

const TARGET_CATEGORIES: { value: AdTargetCategory; label: string }[] = [
  { value: 'all', label: 'Tüm Kategoriler' },
  { value: 'hair', label: 'Saç & Kuaför' },
  { value: 'beauty', label: 'Güzellik & Makyaj' },
  { value: 'nail', label: 'Tırnak & Nail Art' },
  { value: 'wellness', label: 'Wellness & Spa' },
  { value: 'massage', label: 'Masaj & Terapi' },
  { value: 'fitness', label: 'Fitness & Spor' },
  { value: 'healthcare', label: 'Sağlık & Estetik' },
  { value: 'other', label: 'Diğer' },
]

const STATUS_CONFIG: Record<
  AdStatus,
  { label: string; bg: string; text: string; dotColor: string }
> = {
  active: {
    label: 'Aktif',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  pending: {
    label: 'Beklemede',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  expired: {
    label: 'Süresi Doldu',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
  rejected: {
    label: 'Reddedildi',
    bg: 'bg-red-50',
    text: 'text-red-700',
    dotColor: 'bg-red-500',
  },
  paused: {
    label: 'Duraklatıldı',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dotColor: 'bg-blue-500',
  },
}

const PACKAGE_LABELS: Record<AdPackageType, string> = {
  basic_boost: 'Basic Boost',
  professional_boost: 'Professional Boost',
  premium_spotlight: 'Premium Spotlight',
}

// Mock analytics data for demo (used when API returns no data)
function generateMockDailyData() {
  const data = []
  const now = new Date()
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const base = 300 + Math.random() * 400
    data.push({
      date: d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' }),
      impressions: Math.round(base),
      clicks: Math.round(base * (0.04 + Math.random() * 0.06)),
      conversions: Math.round(base * 0.01 + Math.random() * 3),
    })
  }
  return data
}

function generateMockWeeklyData() {
  return [
    { week: '1. Hafta', impressions: 1820, clicks: 94 },
    { week: '2. Hafta', impressions: 2430, clicks: 127 },
    { week: '3. Hafta', impressions: 2180, clicks: 108 },
    { week: '4. Hafta', impressions: 3100, clicks: 172 },
  ]
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AdStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  iconBg,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  sub?: string
  iconBg: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Upgrade Modal ────────────────────────────────────────────────────────────

function UpgradeModal({
  open,
  onClose,
  targetPkg,
}: {
  open: boolean
  onClose: () => void
  targetPkg: (typeof AD_PACKAGES)[number] | null
}) {
  if (!open || !targetPkg) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Crown size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80 uppercase tracking-wider">
                Yükseltme Gerekli
              </p>
              <h2 className="text-xl font-bold">{targetPkg.name}</h2>
            </div>
          </div>
          <p className="text-white/90 text-sm">{targetPkg.tagline}</p>
        </div>

        <div className="p-6 space-y-5">
          {/* Price */}
          <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div>
              <p className="text-xs text-amber-600 font-medium">Paket Fiyatı</p>
              <p className="text-2xl font-bold text-amber-700">
                {targetPkg.price}
                <span className="text-sm font-normal text-amber-500 ml-1">
                  {targetPkg.priceNote}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Görünürlük</p>
              <p className="font-semibold text-slate-700">{targetPkg.impressions} gösterim</p>
            </div>
          </div>

          {/* Features */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Bu pakette neler var?
            </p>
            <ul className="space-y-2">
              {targetPkg.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Plan requirement notice */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <AlertCircle size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <p className="text-xs text-blue-700">
              Bu paket <strong>Professional</strong> veya üzeri plan gerektirmektedir. Planınızı
              yükselterek tüm reklam özelliklerine erişebilirsiniz.
            </p>
          </div>

          {/* CTA */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Şimdi Değil
            </button>
            <a
              href="/subscription"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-semibold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Sparkles size={15} />
              Planı Yükselt
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Packages Tab ─────────────────────────────────────────────────────────────

function PackagesTab({
  currentPlan,
  onSelectPackage,
}: {
  currentPlan: string
  onSelectPackage: (pkg: (typeof AD_PACKAGES)[number]) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Reklam Paketleri</h2>
        <p className="text-sm text-slate-500 mt-1">
          İşletmenize en uygun reklam paketini seçin ve görünürlüğünüzü artırın.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {AD_PACKAGES.map((pkg) => {
          const locked = !planAllows(currentPlan as 'starter', pkg.requiredPlan as 'business')
          return (
            <div
              key={pkg.id}
              className={`relative flex flex-col rounded-2xl border-2 bg-gradient-to-b ${pkg.bgGradient} ${pkg.borderColor} ${pkg.recommended ? 'shadow-lg shadow-blue-100' : 'shadow-sm'} overflow-hidden transition-transform hover:-translate-y-0.5`}
            >
              {pkg.recommended && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold text-center py-1.5 tracking-wide">
                  ★ EN POPÜLER
                </div>
              )}
              {locked && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-800/80 text-white text-xs px-2 py-1 rounded-full">
                  <Lock size={11} />
                  Professional
                </div>
              )}

              <div className={`p-6 ${pkg.recommended ? 'pt-10' : ''}`}>
                {/* Icon & Name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${pkg.badgeBg} ${pkg.color}`}
                  >
                    {pkg.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold text-base ${pkg.color}`}>{pkg.name}</h3>
                    <p className="text-xs text-slate-500">{pkg.tagline}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <span className={`text-3xl font-extrabold ${pkg.color}`}>{pkg.price}</span>
                  <span className="text-sm text-slate-400 ml-1">{pkg.priceNote}</span>
                </div>

                {/* Visibility & Impressions */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className={`rounded-lg p-2.5 text-center ${pkg.badgeBg}`}>
                    <p className="text-xs text-slate-500">Kapsam</p>
                    <p className={`text-sm font-bold ${pkg.color}`}>{pkg.visibility}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 text-center ${pkg.badgeBg}`}>
                    <p className="text-xs text-slate-500">Gösterim</p>
                    <p className={`text-sm font-bold ${pkg.color}`}>{pkg.impressions}</p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Usage hint */}
                <p className="text-xs text-slate-400 italic border-t border-slate-100 pt-3 mb-5">
                  {pkg.usageHint}
                </p>
              </div>

              {/* CTA */}
              <div className="px-6 pb-6 mt-auto">
                <button
                  onClick={() => onSelectPackage(pkg)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    locked
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : pkg.recommended
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:opacity-90 shadow-md shadow-blue-200'
                        : `${pkg.badgeBg} ${pkg.color} hover:opacity-80`
                  }`}
                >
                  {locked ? (
                    <>
                      <Lock size={15} />
                      Planı Yükselt
                    </>
                  ) : (
                    <>
                      <ChevronRight size={15} />
                      Bu Paketle Başla
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Create Ad Tab ────────────────────────────────────────────────────────────

const emptyForm: AdForm = {
  title: '',
  description: '',
  packageType: 'basic_boost',
  targetCategory: 'all',
  targetLocation: '',
  budget: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
}

function CreateAdTab({
  currentPlan,
  preselectedPackage,
  onCreated,
}: {
  currentPlan: string
  preselectedPackage: AdPackageType | null
  onCreated: () => void
}) {
  const [form, setForm] = useState<AdForm>({
    ...emptyForm,
    packageType: preselectedPackage ?? 'basic_boost',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [upgradeTarget, setUpgradeTarget] = useState<(typeof AD_PACKAGES)[number] | null>(null)
  const [success, setSuccess] = useState(false)

  const createMutation = useCreateAdvertisement()

  function patch(key: keyof AdForm, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handlePackageSelect(pkgId: AdPackageType) {
    const pkg = AD_PACKAGES.find((p) => p.id === pkgId)!
    if (!planAllows(currentPlan as 'starter', pkg.requiredPlan as 'business')) {
      setUpgradeTarget(pkg)
      return
    }
    patch('packageType', pkgId)
  }

  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.title.trim()) e.title = 'Başlık zorunludur.'
    if (!form.budget || Number(form.budget) < 1)
      e.budget = 'Geçerli bir bütçe giriniz.'
    if (!form.startDate) e.startDate = 'Başlangıç tarihi seçiniz.'
    if (!form.endDate) e.endDate = 'Bitiş tarihi seçiniz.'
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = 'Bitiş tarihi başlangıçtan sonra olmalıdır.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateAdPayload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      packageType: form.packageType,
      targetCategory: form.targetCategory,
      targetLocation: form.targetLocation.trim() || null,
      budget: Number(form.budget),
      startDate: form.startDate,
      endDate: form.endDate,
    }

    await createMutation.mutateAsync(payload)
    setSuccess(true)
    setForm(emptyForm)
    setTimeout(() => {
      setSuccess(false)
      onCreated()
    }, 1500)
  }

  const selectedPkg = AD_PACKAGES.find((p) => p.id === form.packageType)!

  return (
    <>
      <UpgradeModal
        open={!!upgradeTarget}
        onClose={() => setUpgradeTarget(null)}
        targetPkg={upgradeTarget}
      />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Yeni Reklam Oluştur</h2>
          <p className="text-sm text-slate-500 mt-1">
            Reklam detaylarınızı doldurun ve yayına alın.
          </p>
        </div>

        {success && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
            <CheckCircle2 size={18} />
            <p className="text-sm font-medium">
              Reklamınız oluşturuldu ve incelemeye gönderildi!
            </p>
          </div>
        )}

        {/* Paket Seçimi */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">Reklam Paketi</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {AD_PACKAGES.map((pkg) => {
              const locked = !planAllows(currentPlan as 'starter', pkg.requiredPlan as 'business')
              const selected = form.packageType === pkg.id
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handlePackageSelect(pkg.id)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                    selected
                      ? `${pkg.borderColor} bg-gradient-to-b ${pkg.bgGradient} shadow-sm`
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  } ${locked ? 'opacity-60' : ''}`}
                >
                  {locked && (
                    <Lock
                      size={13}
                      className="absolute top-2 right-2 text-slate-400"
                    />
                  )}
                  <div className={`flex items-center gap-2 mb-1 ${pkg.color}`}>
                    {pkg.icon}
                    <span className="font-semibold text-sm">{pkg.name}</span>
                  </div>
                  <p className="text-xs text-slate-500">{pkg.price} {pkg.priceNote}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{pkg.impressions} gösterim</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Başlık */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Reklam Başlığı <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => patch('title', e.target.value)}
            placeholder="ör. Yaz Kampanyası – %20 İndirim"
            maxLength={100}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow ${errors.title ? 'border-red-400' : 'border-slate-200'}`}
          />
          {errors.title && (
            <p className="text-xs text-red-500">{errors.title}</p>
          )}
        </div>

        {/* Açıklama */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Açıklama</label>
          <textarea
            value={form.description}
            onChange={(e) => patch('description', e.target.value)}
            placeholder="Reklamınız hakkında kısa bir açıklama yazın (opsiyonel)"
            rows={3}
            maxLength={300}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow resize-none"
          />
        </div>

        {/* Hedef Kategori & Lokasyon */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Layers size={14} className="text-slate-400" />
                Hedef Kategori
              </span>
            </label>
            <select
              value={form.targetCategory}
              onChange={(e) => patch('targetCategory', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"
            >
              {TARGET_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-slate-400" />
                Hedef Lokasyon
              </span>
            </label>
            <input
              type="text"
              value={form.targetLocation}
              onChange={(e) => patch('targetLocation', e.target.value)}
              placeholder="ör. İstanbul, Kadıköy"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"
            />
          </div>
        </div>

        {/* Bütçe */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">
            Reklam Bütçesi (₺) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
              ₺
            </span>
            <input
              type="number"
              min={1}
              value={form.budget}
              onChange={(e) => patch('budget', e.target.value)}
              placeholder={selectedPkg.price.replace('₺', '')}
              className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow ${errors.budget ? 'border-red-400' : 'border-slate-200'}`}
            />
          </div>
          {errors.budget && <p className="text-xs text-red-500">{errors.budget}</p>}
        </div>

        {/* Tarihler */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <CalendarRange size={14} className="text-slate-400" />
                Başlangıç Tarihi <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="date"
              value={form.startDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => patch('startDate', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow ${errors.startDate ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.startDate && (
              <p className="text-xs text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <CalendarRange size={14} className="text-slate-400" />
                Bitiş Tarihi <span className="text-red-500">*</span>
              </span>
            </label>
            <input
              type="date"
              value={form.endDate}
              min={form.startDate || new Date().toISOString().slice(0, 10)}
              onChange={(e) => patch('endDate', e.target.value)}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow ${errors.endDate ? 'border-red-400' : 'border-slate-200'}`}
            />
            {errors.endDate && (
              <p className="text-xs text-red-500">{errors.endDate}</p>
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm shadow-blue-200"
          >
            {createMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Megaphone size={16} />
            )}
            Reklamı Yayınla
          </button>
        </div>

        {createMutation.isError && (
          <p className="text-sm text-red-500 flex items-center gap-2">
            <AlertCircle size={15} />
            Reklam oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.
          </p>
        )}
      </form>
    </>
  )
}

// ─── My Ads Tab ────────────────────────────────────────────────────────────────

function MyAdsTab({
  onCreateClick,
}: {
  onCreateClick: () => void
}) {
  const [statusFilter, setStatusFilter] = useState<AdStatus | 'all'>('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filter = statusFilter === 'all' ? {} : { status: statusFilter }
  const { data, isLoading } = useAdvertisements({ pageSize: 50, ...filter })
  const updateStatus = useUpdateAdStatus()
  const deleteMutation = useDeleteAdvertisement()

  const ads = data?.items ?? []

  const stats = useMemo(() => {
    const all = data?.items ?? []
    return {
      total: data?.totalCount ?? 0,
      active: all.filter((a) => a.status === 'active').length,
      totalImpressions: all.reduce((s, a) => s + a.impressions, 0),
      totalClicks: all.reduce((s, a) => s + a.clicks, 0),
    }
  }, [data])

  function getRemainingDays(endDate: string) {
    const diff = new Date(endDate).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86400000))
  }

  async function confirmDelete() {
    if (deleteId) await deleteMutation.mutateAsync(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Megaphone size={20} className="text-blue-600" />}
          label="Toplam Reklam"
          value={stats.total}
          iconBg="bg-blue-50"
        />
        <StatCard
          icon={<Zap size={20} className="text-emerald-600" />}
          label="Aktif Reklam"
          value={stats.active}
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<Eye size={20} className="text-violet-600" />}
          label="Toplam Gösterim"
          value={stats.totalImpressions.toLocaleString('tr-TR')}
          iconBg="bg-violet-50"
        />
        <StatCard
          icon={<MousePointerClick size={20} className="text-amber-600" />}
          label="Toplam Tıklama"
          value={stats.totalClicks.toLocaleString('tr-TR')}
          iconBg="bg-amber-50"
        />
      </div>

      {/* Filters + New Ad button */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'active', 'pending', 'paused', 'expired', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'Tümü' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
        <button
          onClick={onCreateClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Yeni Reklam
        </button>
      </div>

      {/* Ad list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
        </div>
      ) : ads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Megaphone size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Henüz reklam oluşturmadınız</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">
            İlk reklamınızı oluşturarak işletmenizi öne çıkarın.
          </p>
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            Reklam Oluştur
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad) => {
            const pkg = AD_PACKAGES.find((p) => p.id === ad.packageType)
            const remaining = getRemainingDays(ad.endDate)
            const ctr =
              ad.impressions > 0
                ? ((ad.clicks / ad.impressions) * 100).toFixed(1)
                : '0.0'
            return (
              <div
                key={ad.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Package icon */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pkg?.badgeBg ?? 'bg-slate-100'} ${pkg?.color ?? 'text-slate-600'}`}
                >
                  {pkg?.icon ?? <Megaphone size={18} />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 truncate">{ad.title}</h3>
                    <StatusBadge status={ad.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-400 flex-wrap">
                    <span>{PACKAGE_LABELS[ad.packageType]}</span>
                    <span>·</span>
                    <span>
                      {new Date(ad.startDate).toLocaleDateString('tr-TR')} –{' '}
                      {new Date(ad.endDate).toLocaleDateString('tr-TR')}
                    </span>
                    {ad.status === 'active' && remaining > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <Clock size={11} />
                          {remaining} gün kaldı
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center gap-5 text-sm shrink-0">
                  <div className="text-center">
                    <p className="font-bold text-slate-800">
                      {ad.impressions.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-xs text-slate-400">Gösterim</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800">
                      {ad.clicks.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-xs text-slate-400">Tıklama</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-blue-600">{ctr}%</p>
                    <p className="text-xs text-slate-400">CTR</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {ad.status === 'active' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: ad.id, status: 'paused' })}
                      title="Duraklat"
                      className="p-2 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                    >
                      <Pause size={16} />
                    </button>
                  )}
                  {ad.status === 'paused' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: ad.id, status: 'active' })}
                      title="Devam Ettir"
                      className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                    >
                      <Play size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(ad.id)}
                    title="Sil"
                    className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-slate-900 mb-2">Reklamı Sil</h3>
            <p className="text-sm text-slate-500 mb-5">
              Bu reklamı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deleteMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  'Sil'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────

function AnalyticsTab() {
  const { data: analyticsData, isLoading } = useAdAnalytics()

  const isMockData = !analyticsData
  const dailyData = useMemo(
    () => analyticsData?.dailyData ?? generateMockDailyData(),
    [analyticsData],
  )
  const weeklyData = useMemo(
    () => analyticsData?.weeklyData ?? generateMockWeeklyData(),
    [analyticsData],
  )

  const totalImpressions = analyticsData?.totalImpressions ?? dailyData.reduce((s, d) => s + d.impressions, 0)
  const totalClicks = analyticsData?.totalClicks ?? dailyData.reduce((s, d) => s + d.clicks, 0)
  const totalConversions = analyticsData?.totalConversions ?? dailyData.reduce((s, d) => s + d.conversions, 0)
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'
  const convRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Reklam Analitikleri</h2>
          <p className="text-sm text-slate-500 mt-1">
            Reklamlarınızın performansını takip edin.
          </p>
        </div>
        {isMockData && !isLoading && (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 text-xs rounded-full font-medium">
            <BarChart3 size={13} />
            Örnek Veri
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          icon={<Eye size={20} className="text-violet-600" />}
          label="Toplam Gösterim"
          value={totalImpressions.toLocaleString('tr-TR')}
          iconBg="bg-violet-50"
        />
        <StatCard
          icon={<MousePointerClick size={20} className="text-blue-600" />}
          label="Toplam Tıklama"
          value={totalClicks.toLocaleString('tr-TR')}
          iconBg="bg-blue-50"
        />
        <StatCard
          icon={<Target size={20} className="text-emerald-600" />}
          label="Dönüşüm"
          value={totalConversions.toLocaleString('tr-TR')}
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-amber-600" />}
          label="CTR Oranı"
          value={`${ctr}%`}
          sub="Tıklama / Gösterim"
          iconBg="bg-amber-50"
        />
        <StatCard
          icon={<ArrowUpRight size={20} className="text-rose-600" />}
          label="Dönüşüm Oranı"
          value={`${convRate}%`}
          sub="Dönüşüm / Tıklama"
          iconBg="bg-rose-50"
        />
      </div>

      {/* Daily performance line chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-1">Günlük Performans</h3>
        <p className="text-xs text-slate-400 mb-5">Son 14 günün gösterim ve tıklama verileri</p>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={dailyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="impressions"
              name="Gösterim"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="clicks"
              name="Tıklama"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="conversions"
              name="Dönüşüm"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Weekly bar chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-1">Haftalık Karşılaştırma</h3>
        <p className="text-xs text-slate-400 mb-5">Haftalık gösterim ve tıklama karşılaştırması</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Bar
              dataKey="impressions"
              name="Gösterim"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="clicks"
              name="Tıklama"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdvertisementsPage() {
  const planRaw = useSelector((s: RootState) => s.business.business?.plan)
  const currentPlan = normalizePlanId(planRaw)
  const [activeTab, setActiveTab] = useState<TabId>('my-ads')
  const [preselectedPackage, setPreselectedPackage] = useState<AdPackageType | null>(null)
  const [upgradeModal, setUpgradeModal] = useState<(typeof AD_PACKAGES)[number] | null>(null)

  function handleSelectPackage(pkg: (typeof AD_PACKAGES)[number]) {
    if (!planAllows(currentPlan, pkg.requiredPlan)) {
      setUpgradeModal(pkg)
      return
    }
    setPreselectedPackage(pkg.id)
    setActiveTab('create')
  }

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'my-ads', label: 'Reklamlarım', icon: <Megaphone size={16} /> },
    { id: 'packages', label: 'Paketler', icon: <Layers size={16} /> },
    { id: 'create', label: 'Yeni Reklam', icon: <Plus size={16} /> },
    { id: 'analytics', label: 'Analitik', icon: <BarChart3 size={16} /> },
  ]

  return (
    <>
      <UpgradeModal
        open={!!upgradeModal}
        onClose={() => setUpgradeModal(null)}
        targetPkg={upgradeModal}
      />

      <div className="space-y-6">
        <PageHeader
          title="Reklam Yönetimi"
          description="Reklamlarınızı oluşturun, yönetin ve performansını takip edin"
        />

        {/* Tab nav */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'my-ads' && (
          <MyAdsTab onCreateClick={() => setActiveTab('create')} />
        )}
        {activeTab === 'packages' && (
          <PackagesTab
            currentPlan={currentPlan}
            onSelectPackage={handleSelectPackage}
          />
        )}
        {activeTab === 'create' && (
          <CreateAdTab
            currentPlan={currentPlan}
            preselectedPackage={preselectedPackage}
            onCreated={() => setActiveTab('my-ads')}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </>
  )
}
