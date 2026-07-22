import { useState } from 'react'
import { Plus, Trash2, Gift, X, Copy, CheckCircle, Search, Loader2 } from 'lucide-react'
import { AxiosError } from 'axios'
import { formatDate, formatCurrency, futureLocalDateStr } from '@/lib/utils'
import {
  useGiftCoupons,
  useCreateGiftCoupon,
  useDeleteGiftCoupon,
  type GiftCoupon,
} from '@/hooks/useGiftCoupons'

const STATUS_LABELS: Record<GiftCoupon['status'], string> = {
  active: 'Aktif',
  used: 'Kullanıldı',
  expired: 'Süresi Doldu',
}

const STATUS_COLORS: Record<GiftCoupon['status'], string> = {
  active: 'bg-green-50 text-green-700 border-green-100',
  used: 'bg-gray-100 text-gray-600 border-gray-200',
  expired: 'bg-red-50 text-red-600 border-red-100',
}

function generateCode() {
  return 'GFT-' + Math.random().toString(36).toUpperCase().slice(2, 8)
}

type ModalData = {
  recipientName: string
  recipientEmail: string
  purchasedBy: string
  amount: number
  expiryDate: string
  message: string
}

const emptyModal: ModalData = {
  recipientName: '',
  recipientEmail: '',
  purchasedBy: '',
  amount: 200,
  expiryDate: futureLocalDateStr(180),
  message: '',
}

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message
  }
  return 'İşlem sırasında bir hata oluştu.'
}

export function GiftCouponsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | GiftCoupon['status']>('all')
  const [modal, setModal] = useState<{ open: boolean; data: ModalData } | null>(null)
  const [deleteCoupon, setDeleteCoupon] = useState<GiftCoupon | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useGiftCoupons({ pageNumber: 1, pageSize: 100 })
  const createMutation = useCreateGiftCoupon()
  const deleteMutation = useDeleteGiftCoupon()

  const coupons = data?.items ?? []
  const filtered = coupons.filter((coupon) => {
    const query = search.toLowerCase()
    const matchFilter = filter === 'all' || coupon.status === filter
    const matchSearch =
      coupon.code.toLowerCase().includes(query) ||
      coupon.recipientName.toLowerCase().includes(query) ||
      coupon.purchasedBy.toLowerCase().includes(query)

    return matchFilter && matchSearch
  })

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {})
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  async function create() {
    if (!modal) return
    if (!modal.data.recipientName.trim()) { setActionError('Alıcı adı zorunludur'); return }
    if (!modal.data.purchasedBy.trim()) { setActionError('Gönderen adı zorunludur'); return }

    setActionError(null)

    try {
      await createMutation.mutateAsync({
        code: generateCode(),
        amount: modal.data.amount,
        recipientName: modal.data.recipientName,
        recipientEmail: modal.data.recipientEmail || null,
        purchasedBy: modal.data.purchasedBy,
        expiryDate: modal.data.expiryDate || null,
        message: modal.data.message || null,
      })
      setModal(null)
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError))
    }
  }

  async function removeCoupon() {
    if (!deleteCoupon) return

    setActionError(null)

    try {
      await deleteMutation.mutateAsync(deleteCoupon.id)
      setDeleteCoupon(null)
    } catch (mutationError) {
      setActionError(getErrorMessage(mutationError))
    }
  }

  const totalActive = coupons.filter((coupon) => coupon.status === 'active').length
  const totalValue = coupons
    .filter((coupon) => coupon.status === 'active')
    .reduce((sum, coupon) => sum + (coupon.amount - coupon.usedAmount), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Hediye Kuponları</h1>
          <p className="hidden text-sm text-gray-500 lg:block">Kuponlar canlı API verisinden yüklenir ve doğrudan kaydedilir</p>
        </div>
        <button
          onClick={() => {
            setActionError(null)
            setModal({ open: true, data: { ...emptyModal } })
          }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Yeni Kupon
        </button>
      </div>

      {actionError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Toplam Kupon', value: data?.totalCount ?? coupons.length },
          { label: 'Aktif', value: totalActive },
          { label: 'Kalan Değer', value: formatCurrency(totalValue) },
          { label: 'Kullanılan', value: coupons.filter((coupon) => coupon.status === 'used').length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xl font-bold text-gray-900">{stat.value}</div>
            <div className="mt-0.5 text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Kod, alıcı veya gönderen ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'used', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === status ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {status === 'all' ? 'Tümü' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
          {getErrorMessage(error)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((coupon) => {
            const remaining = coupon.amount - coupon.usedAmount
            const progress = coupon.amount > 0 ? (coupon.usedAmount / coupon.amount) * 100 : 0

            return (
              <div key={coupon.id} className={`rounded-xl border bg-white p-5 shadow-sm transition-all hover:shadow-md ${coupon.status !== 'active' ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Gift className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[coupon.status]}`}>{STATUS_LABELS[coupon.status]}</span>
                    <button onClick={() => setDeleteCoupon(coupon)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-gray-50 px-2 py-1.5 text-sm font-mono font-bold tracking-wider text-gray-800">{coupon.code}</code>
                  <button onClick={() => copyCode(coupon.code)} className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100">
                    {copied === coupon.code ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Değer</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-gray-900">{formatCurrency(remaining)}</span>
                      {coupon.usedAmount > 0 && <span className="ml-1 text-xs text-gray-400">/ {formatCurrency(coupon.amount)}</span>}
                    </div>
                  </div>
                  {coupon.usedAmount > 0 && (
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                      <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <div><span className="font-medium text-gray-700">Alıcı:</span> {coupon.recipientName}</div>
                  <div><span className="font-medium text-gray-700">Gönderen:</span> {coupon.purchasedBy}</div>
                  <div><span className="font-medium text-gray-700">Satın Alma:</span> {formatDate(coupon.purchaseDate)}</div>
                  <div><span className="font-medium text-gray-700">Son kullanım:</span> {coupon.expiryDate ? formatDate(coupon.expiryDate) : 'Süresiz'}</div>
                  {coupon.message && <div className="italic text-gray-400">"{coupon.message}"</div>}
                </div>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="col-span-full rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-400">
              Kupon bulunamadı
            </div>
          )}
        </div>
      )}

      {modal?.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">Yeni Hediye Kuponu</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Alıcı Adı</label>
                  <input value={modal.data.recipientName} onChange={(e) => setModal((current) => current && ({ ...current, data: { ...current.data, recipientName: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ad Soyad" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Alıcı E-posta</label>
                  <input value={modal.data.recipientEmail} onChange={(e) => setModal((current) => current && ({ ...current, data: { ...current.data, recipientEmail: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="email@ornek.com" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Gönderen</label>
                  <input value={modal.data.purchasedBy} onChange={(e) => setModal((current) => current && ({ ...current, data: { ...current.data, purchasedBy: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Gönderen adı" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Kupon Değeri (₺)</label>
                  <input type="number" value={modal.data.amount} onChange={(e) => setModal((current) => current && ({ ...current, data: { ...current.data, amount: Number(e.target.value) } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Son Kullanım Tarihi</label>
                  <input type="date" value={modal.data.expiryDate} onChange={(e) => setModal((current) => current && ({ ...current, data: { ...current.data, expiryDate: e.target.value } }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Mesaj (opsiyonel)</label>
                  <textarea value={modal.data.message} onChange={(e) => setModal((current) => current && ({ ...current, data: { ...current.data, message: e.target.value } }))} rows={2} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Kişisel mesaj..." />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button onClick={create} disabled={!modal.data.recipientName || !modal.data.purchasedBy || createMutation.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {createMutation.isPending ? 'Kaydediliyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100"><Trash2 className="h-5 w-5 text-red-500" /></div>
            <h3 className="mt-3 text-center text-base font-bold text-gray-900">Kuponu Sil</h3>
            <p className="mt-1 text-center text-sm text-gray-500">{deleteCoupon.code} kodlu kupon kalıcı olarak silinecek.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setDeleteCoupon(null)} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">İptal</button>
              <button onClick={removeCoupon} disabled={deleteMutation.isPending} className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                {deleteMutation.isPending ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}