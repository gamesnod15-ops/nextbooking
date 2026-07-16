'use client'

import Link from 'next/link'
import { ArrowLeft, CreditCard, Plus, Trash2, CheckCircle2, ShieldCheck, X, Pencil } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import axios from '@/lib/axios'

function detectBrand(number: string): string {
  const cleaned = number.replace(/\s/g, '')
  if (/^4/.test(cleaned)) return 'Visa'
  if (/^5[1-5]/.test(cleaned) || /^2(?:2[2-9][1-9]|[3-6]\d{2}|7[01]\d|720)/.test(cleaned)) return 'Mastercard'
  return ''
}

function formatCardNumber(value: string): string {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string): string {
  let digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 2) {
    const month = parseInt(digits.slice(0, 2))
    if (month > 12) digits = '12' + digits.slice(2)
  }
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

function maskNumber(value: string): string {
  const cleaned = value.replace(/\s/g, '')
  if (cleaned.length <= 4) return cleaned
  const last4 = cleaned.slice(-4)
  const masked = '•'.repeat(Math.min(cleaned.length - 4, 12))
  const grouped = (masked + last4).replace(/(.{4})/g, '$1 ').trim()
  return grouped
}

const BRAND_COLOR: Record<string, string> = {
  Visa:       'bg-blue-600',
  Mastercard: 'bg-red-600',
}

const BRAND_GRADIENT: Record<string, string> = {
  Visa:       'from-yellow-600 to-red-600',
  Mastercard: 'from-yellow-600 to-red-600',
}

export default function OdemeYontemleriPage() {
  const [cards, setCards] = useState<any[]>([])
  const [nextPayment, setNextPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState({ cardHolder: '', cardNumber: '', expiry: '', cvv: '', brand: '' })
  const [adding, setAdding] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [editOpen, setEditOpen] = useState(false)
  const [editCard, setEditCard] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ cardHolder: '', expiry: '' })
  const [editing, setEditing] = useState(false)

  const fetchCards = () => {
    setLoading(true)
    setError(null)
    Promise.all([
      axios.get('/api/v1/Payments/cards'),
      axios.get('/api/v1/Payments'),
    ])
      .then(([cardsRes, paymentsRes]) => {
        setCards(cardsRes.data || [])
        setNextPayment((paymentsRes.data.items && paymentsRes.data.items[0]) || null)
      })
      .catch(() => setError('Ödeme verileri alınamadı.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCards() }, [])

  const handleCardNumberChange = useCallback((value: string) => {
    const formatted = formatCardNumber(value)
    const brand = detectBrand(formatted)
    setAddForm((p) => ({ ...p, cardNumber: formatted, brand }))
  }, [])

  const handleExpiryChange = useCallback((value: string) => {
    const formatted = formatExpiry(value)
    setAddForm((p) => ({ ...p, expiry: formatted }))
  }, [])

  const handleCvvChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 3)
    setAddForm((p) => ({ ...p, cvv: digits }))
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      await axios.post('/api/v1/Payments/cards', addForm)
      setAddOpen(false)
      setAddForm({ cardHolder: '', cardNumber: '', expiry: '', cvv: '', brand: '' })
      fetchCards()
    } catch {
      setError('Kart eklenemedi.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(true)
    try {
      await axios.delete(`/api/v1/Payments/cards/${id}`)
      setDeleteId(null)
      fetchCards()
    } catch {
      setError('Kart silinemedi.')
    } finally {
      setDeleting(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await axios.put(`/api/v1/Payments/cards/${id}/default`, {})
      fetchCards()
    } catch {
      setError('Varsayılan kart değiştirilemedi.')
    }
  }

  const openEdit = (card: any) => {
    setEditCard(card)
    setEditForm({ cardHolder: card.cardHolder, expiry: card.expiry })
    setEditOpen(true)
  }

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCard) return
    setEditing(true)
    try {
      await axios.put(`/api/v1/Payments/cards/${editCard.id}`, {
        id: editCard.id,
        cardHolder: editForm.cardHolder,
        expiry: editForm.expiry,
      })
      setEditOpen(false)
      setEditCard(null)
      fetchCards()
    } catch {
      setError('Kart güncellenemedi.')
    } finally {
      setEditing(false)
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto py-12 text-center text-gray-500">Yükleniyor...</div>;
  if (error && cards.length === 0) return <div className="max-w-3xl mx-auto py-12 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/panel" aria-label="Panele dön" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Ödeme Yöntemleri</h1>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Ödeme bilgileriniz 256-bit SSL ile şifrelenerek güvenle saklanmaktadır.
      </div>

      {error && <div className="text-sm text-red-500">{error}</div>}

      <div className="space-y-3">
        {cards.map((card: any) => (
          <div key={card.id} className="flex items-center justify-between rounded-2xl bg-white border border-gray-100 px-5 py-4">
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-14 items-center justify-center rounded-lg text-white text-xs font-bold ${BRAND_COLOR[card.brand] ?? 'bg-gray-700'}`}>
                {card.brand}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">**** **** **** {card.lastFour}</p>
                <p className="text-xs text-gray-400">Son Kullanma: {card.expiry}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {card.default ? (
                <span className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-medium">
                  <CheckCircle2 className="h-3 w-3" /> Varsayılan
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(card.id)}
                  className="text-xs text-brand-500 hover:text-brand-600 font-medium transition-colors"
                >
                  Varsayılan Yap
                </button>
              )}
              <button
                onClick={() => openEdit(card)}
                title="Kartı düzenle"
                aria-label={`**** ${card.lastFour} kartını düzenle`}
                className="text-gray-300 hover:text-brand-500 transition-colors"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDeleteId(card.id)}
                title="Kartı sil"
                aria-label={`**** ${card.lastFour} kartını sil`}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-500 hover:border-brand-300 hover:text-brand-500 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Yeni Kart Ekle
      </button>

      <div className="rounded-2xl bg-white border border-gray-100 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-brand-500" />
          <h2 className="font-semibold text-gray-900">Bir Sonraki Ödeme</h2>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">{nextPayment?.description || '-'}</span>
          <span className="font-bold text-gray-900">{nextPayment?.amount || '-'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Tahsilat Tarihi</span>
          <span className="text-gray-700">{nextPayment?.date || '-'}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Ödeme Yöntemi</span>
          <span className="text-gray-700">{nextPayment?.method || '-'}</span>
        </div>
      </div>

      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setAddOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setAddOpen(false)}
              aria-label="Kapat"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Yeni Kart Ekle</h2>

            {/* Kart Görseli */}
            <div
              style={{ width: '390px', height: '14rem' }}
              className={`relative rounded-xl pt-4 px-4 pb-3 text-white bg-gradient-to-br shadow-md select-none flex flex-col justify-between ${
                BRAND_GRADIENT[addForm.brand] || 'from-yellow-600 to-red-600'
              }`}
            >
              {/* Üst: Chip + Marka */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <div className="w-7 h-5 rounded bg-yellow-400/90" />
                  <div className="w-7 h-5 rounded bg-red-500/60" />
                </div>
                <p className="text-[11px] font-bold tracking-wider">DEBIT CARD</p>
              </div>
              {/* Alt: Kart no + isim + skt + cvv */}
              <div>
                <p className="text-lg tracking-[3px] font-mono mb-5 text-left">
                  {addForm.cardNumber
                    ? maskNumber(addForm.cardNumber)
                    : '••••  ••••  ••••  ••••'}
                </p>
                <div className="flex justify-between items-end">
                  <div className="min-w-0 flex-1">
                    <p className="text-[8px] opacity-70 leading-none">KART SAHİBİ</p>
                    <p className="text-xs font-medium truncate uppercase tracking-wider leading-tight">
                      {addForm.cardHolder || 'AD SOYAD'}
                    </p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-[8px] opacity-70 leading-none">SON KULL.</p>
                    <p className="text-xs font-mono leading-tight">{addForm.expiry || 'AA/YY'}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-[8px] opacity-70 leading-none">CVV</p>
                    <p className="text-xs font-mono leading-tight">{addForm.cvv || '•••'}</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label htmlFor="odeme-add-cardholder" className="block text-xs font-medium text-gray-600 mb-1.5">Kart Üzerindeki İsim</label>
                <input
                  id="odeme-add-cardholder"
                  type="text"
                  value={addForm.cardHolder}
                  onChange={(e) => setAddForm((p) => ({ ...p, cardHolder: e.target.value }))}
                  onFocus={() => setFocusedField('cardHolder')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
                  placeholder="Ad Soyad"
                  required
                />
              </div>

              <div>
                <label htmlFor="odeme-add-cardnumber" className="block text-xs font-medium text-gray-600 mb-1.5">Kart Numarası</label>
                <input
                  id="odeme-add-cardnumber"
                  type="text"
                  value={addForm.cardNumber}
                  onChange={(e) => handleCardNumberChange(e.target.value)}
                  onFocus={() => setFocusedField('cardNumber')}
                  onBlur={() => setFocusedField(null)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 tracking-[2px] font-mono"
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="odeme-add-expiry" className="block text-xs font-medium text-gray-600 mb-1.5">Son Kullanma</label>
                  <input
                    id="odeme-add-expiry"
                    type="text"
                    value={addForm.expiry}
                    onChange={(e) => handleExpiryChange(e.target.value)}
                    onFocus={() => setFocusedField('expiry')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono"
                    placeholder="AA/YY"
                    inputMode="numeric"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="odeme-add-cvv" className="block text-xs font-medium text-gray-600 mb-1.5">CVV</label>
                  <input
                    id="odeme-add-cvv"
                    type="text"
                    value={addForm.cvv}
                    onChange={(e) => handleCvvChange(e.target.value)}
                    onFocus={() => setFocusedField('cvv')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono"
                    placeholder="•••"
                    inputMode="numeric"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">3 haneli güvenlik kodu</p>
                </div>
              </div>

              <input type="hidden" name="brand" value={addForm.brand} />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={adding || !addForm.brand}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-black text-sm font-semibold rounded-lg transition-colors"
                >
                  {adding ? 'Ekleniyor...' : 'Ekle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-5 relative" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">Kartı Sil</h2>
            <p className="text-sm text-gray-600">Bu kartı silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={deleting}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-black text-sm font-semibold rounded-lg transition-colors"
              >
                {deleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && editCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setEditOpen(false); setEditCard(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => { setEditOpen(false); setEditCard(null) }}
              aria-label="Kapat"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900">Kartı Düzenle</h2>
            <p className="text-sm text-gray-500">**** **** **** {editCard.lastFour} - {editCard.brand}</p>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label htmlFor="odeme-edit-cardholder" className="block text-xs font-medium text-gray-600 mb-1.5">Kart Üzerindeki İsim</label>
                <input
                  id="odeme-edit-cardholder"
                  type="text"
                  value={editForm.cardHolder}
                  onChange={(e) => setEditForm((p) => ({ ...p, cardHolder: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
                  required
                />
              </div>
              <div>
                <label htmlFor="odeme-edit-expiry" className="block text-xs font-medium text-gray-600 mb-1.5">Son Kullanma</label>
                <input
                  id="odeme-edit-expiry"
                  type="text"
                  value={editForm.expiry}
                  onChange={(e) => setEditForm((p) => ({ ...p, expiry: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 font-mono"
                  placeholder="AA/YY"
                  inputMode="numeric"
                  required
                />
              </div>

              {error && <div className="text-sm text-red-500">{error}</div>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setEditOpen(false); setEditCard(null) }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-black text-sm font-semibold rounded-lg transition-colors"
                >
                  {editing ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
