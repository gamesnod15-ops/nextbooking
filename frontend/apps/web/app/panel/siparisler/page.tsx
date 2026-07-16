'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { CheckCircle2, Loader2, XCircle, ArrowLeft, ShoppingBag, X } from 'lucide-react'
import Link from 'next/link'

const API_STATUS_MAP: Record<string, { label: string; icon: any; cls: string }> = {
  Paid:          { label: 'Ödendi',     icon: CheckCircle2, cls: 'bg-green-50 text-green-700 border-green-200' },
  Open:          { label: 'İşlemde',    icon: Loader2,      cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PartiallyPaid: { label: 'Kısmi Ödendi', icon: Loader2,    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Overdue:       { label: 'Gecikmiş',   icon: XCircle,      cls: 'bg-red-50 text-red-600 border-red-200'       },
}

function formatDate(iso?: string | null) {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatAmount(amount?: number | null) {
  if (amount == null) return '-'
  return `₺${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
}

function mapOrder(raw: any) {
  return {
    ...raw,
    _date:       formatDate(raw.createdAt),
    _item:       raw.description || 'Sipariş',
    _amount:     formatAmount(raw.totalAmount),
    _statusCfg:  API_STATUS_MAP[raw.status as keyof typeof API_STATUS_MAP] || API_STATUS_MAP['Open'],
    _customer:   raw.customerName || '-',
    _paymentType: raw.installmentCount && raw.installmentCount > 1 ? 'Taksitli' : 'Peşin',
  }
}

export default function SiparislerPage() {
  const [rawOrders, setRawOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      axios.get('/api/v1/Receivables').then((r: any) => r.data.items || r.data || []),
      axios.get('/api/v1/product-purchases').then((r: any) => r.data || []),
    ])
      .then(([receivables, purchases]) => {
        const purchaseOrders = purchases.map((p: any) => ({
          ...p,
          id: p.id,
          customerName: '-',
          totalAmount: p.amount,
          paidAmount: p.amount,
          createdAt: p.createdAt,
          description: `${p.productType === 'Sponsored' ? 'Sponsorlu' : 'Reklamveren'} — ${p.planName}`,
          status: p.status === 'Active' ? 'Paid' : 'Open',
        }))
        const merged = [...receivables, ...purchaseOrders]
        merged.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setRawOrders(merged)
      })
      .catch(() => setError('Sipariş verileri alınamadı.'))
      .finally(() => setLoading(false))
  }, [])

  const orders = rawOrders.map(mapOrder)
  const selected = rawOrders.find(o => o.id === selectedId)
  const selectedMapped = selected ? mapOrder(selected) : null

  if (loading) return <div className="max-w-3xl mx-auto py-12 text-center text-gray-500">Yükleniyor...</div>;
  if (error)   return <div className="max-w-3xl mx-auto py-12 text-center text-red-500">{error}</div>;

  const counts = {
    total: orders.length,
    open: orders.filter(o => o.status === 'Open' || o.status === 'PartiallyPaid').length,
    paid: orders.filter(o => o.status === 'Paid').length,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/panel" aria-label="Panele dön" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Siparişler</h1>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Toplam',      value: counts.total, cls: 'text-gray-900' },
          { label: 'İşlemde',     value: counts.open,  cls: 'text-amber-600' },
          { label: 'Ödenen',      value: counts.paid,  cls: 'text-green-600' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-2xl bg-white border border-gray-100 px-5 py-4 text-center">
            <p className={`text-2xl font-extrabold ${cls}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-brand-500" />
          <h2 className="font-semibold text-gray-900">Sipariş Geçmişi</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {orders.map((o) => {
            const { label, icon: Icon, cls } = o._statusCfg
            return (
              <button key={o.id} onClick={() => setSelectedId(o.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left">
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.id.slice(0, 8)}…</p>
                  <p className="text-xs text-gray-400 mt-0.5">{o._date}</p>
                </div>
                <div className="flex-1 px-4 hidden sm:block">
                  <p className="text-sm text-gray-700 truncate">{o._item}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-900">{o._amount}</span>
                  <span className={`flex items-center gap-1 text-xs border px-2.5 py-1 rounded-full font-medium ${cls}`}>
                    <Icon className="h-3 w-3" /> {label}
                  </span>
                </div>
              </button>
            )
          })}
          {orders.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-400">Henüz sipariş bulunmuyor.</div>
          )}
        </div>
      </div>

      {selectedMapped && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelectedId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedId(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="text-lg font-bold text-gray-900">Sipariş Detayı</h2>
              <p className="text-sm text-gray-400 mt-0.5">{selectedMapped.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Tarih',        value: selectedMapped._date },
                { label: 'Ürün / Hizmet', value: selectedMapped._item },
                { label: 'Tutar',         value: selectedMapped._amount },
                { label: 'Durum',         value: selectedMapped._statusCfg.label },
                { label: 'Müşteri',       value: selectedMapped._customer },
                { label: 'Ödeme Tipi',    value: selectedMapped._paymentType },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-medium text-gray-900 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {selectedMapped.description && (
              <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                <p className="text-xs text-gray-400 mb-1">Açıklama</p>
                <p className="text-gray-700">{selectedMapped.description}</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setSelectedId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
