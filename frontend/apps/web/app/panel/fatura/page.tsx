'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import axios from '@/lib/axios'

interface BillingAddress {
  id: string
  name: string
  addressLine1: string
  addressLine2: string
  city: string
  postalCode: string
  country: string
  taxNumber: string
  taxOffice: string
  invoiceType: 'bireysel' | 'kurumsal'
  phone: string
}

const LS_KEY = 'rk_billing_addresses'

function loadFromStorage(): BillingAddress[] {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveToStorage(list: BillingAddress[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function mapFromApi(b: any): BillingAddress {
  return {
    id: 'default',
    name: b.settings?.billing_contact_name ?? b.name ?? '',
    addressLine1: b.address ?? '',
    addressLine2: '',
    city: b.city ?? '',
    postalCode: b.postalCode ?? '',
    country: b.country ?? 'Türkiye',
    taxNumber: b.taxNumber ?? '',
    taxOffice: b.taxOffice ?? '',
    invoiceType: b.settings?.billing_invoice_type ?? 'bireysel',
    phone: b.phone ?? '',
  }
}

function mapToPayload(addr: BillingAddress, existing: any) {
  return {
    name: existing.name,
    phone: existing.phone ?? null,
    email: existing.email ?? null,
    address: [addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ') || null,
    city: addr.city || null,
    postalCode: addr.postalCode || null,
    country: addr.country || null,
    taxNumber: addr.taxNumber || null,
    taxOffice: addr.taxOffice || null,
    website: existing.website ?? null,
    description: existing.description ?? null,
    logoUrl: existing.logoUrl ?? null,
    settings: {
      ...(existing.settings ?? {}),
      billing_contact_name: addr.name,
      billing_invoice_type: addr.invoiceType,
    },
  }
}

const EMPTY = (): Omit<BillingAddress, 'id'> => ({
  name: '', addressLine1: '', addressLine2: '', city: '', postalCode: '',
  country: 'Türkiye', taxNumber: '', taxOffice: '', invoiceType: 'bireysel', phone: '',
})

const COUNTRIES = [
  'Türkiye', 'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia',
  'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados',
  'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina',
  'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia',
  'Cameroon', 'Canada', 'Cape Verde', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
  'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark',
  'Djibouti', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Estonia',
  'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',
  'Germany', 'Ghana', 'Greece', 'Guatemala', 'Guinea', 'Guyana', 'Haiti', 'Honduras',
  'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
  'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Liberia', 'Libya', 'Liechtenstein',
  'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali',
  'Malta', 'Mauritania', 'Mauritius', 'Mexico', 'Moldova', 'Monaco', 'Mongolia',
  'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman',
  'Pakistan', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
  'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Somalia', 'South Africa',
  'South Korea', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Trinidad and Tobago',
  'Tunisia', 'Turkmenistan', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen',
  'Zambia', 'Zimbabwe',
]

export default function FaturaPage() {
  const [addresses, setAddresses] = useState<BillingAddress[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<BillingAddress, 'id'>>(EMPTY())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    const stored = loadFromStorage()
    if (stored.length > 0) {
      setAddresses(stored)
      setSelectedId(stored[0].id)
    }

    axios.get('/api/v1/Business/me')
      .then((res: any) => {
        const apiAddr = mapFromApi(res.data)
        const merged = stored.length > 0
          ? stored.map(a => a.id === 'default' ? { ...apiAddr, id: 'default' } : a)
          : [apiAddr]
        if (merged.length === 0) merged.push(apiAddr)
        setAddresses(merged)
        if (!selectedId) setSelectedId(merged[0].id)
        saveToStorage(merged)
      })
      .catch(() => {
        if (stored.length === 0) setError('Fatura adresi yüklenemedi.')
      })
      .finally(() => setLoading(false))
  }, [])

  function openNew() {
    setForm(EMPTY())
    setEditingId(null)
    setFormOpen(true)
  }

  function openEdit(addr: BillingAddress) {
    setForm({
      name: addr.name,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      postalCode: addr.postalCode,
      country: addr.country,
      taxNumber: addr.taxNumber,
      taxOffice: addr.taxOffice,
      invoiceType: addr.invoiceType,
      phone: addr.phone,
    })
    setEditingId(addr.id)
    setFormOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const existing = await axios.get('/api/v1/Business/me').then((r: any) => r.data)
      const payload = mapToPayload(
        { id: editingId ?? `ba-${Date.now()}`, ...form },
        existing
      )
      await axios.put('/api/v1/Business/me', payload)

      const id = editingId ?? `ba-${Date.now()}`
      const updated: BillingAddress = { id, ...form }
      const next = editingId
        ? addresses.map(a => a.id === editingId ? updated : a)
        : [...addresses, updated]
      setAddresses(next)
      if (!selectedId) setSelectedId(id)
      saveToStorage(next)
      setFormOpen(false)
    } catch {
      setError('Fatura adresi kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const existing = await axios.get('/api/v1/Business/me').then((r: any) => r.data)
      const rest = addresses.filter(a => a.id !== id)
      if (rest.length === 0) {
        await axios.put('/api/v1/Business/me', {
          ...existing,
          address: null,
          city: null,
          postalCode: null,
          country: null,
          taxNumber: null,
          taxOffice: null,
          settings: { ...existing.settings, billing_contact_name: null, billing_invoice_type: null },
        })
      } else if (id === selectedId || id === 'default') {
        const nextDefault = rest[0]
        await axios.put('/api/v1/Business/me', mapToPayload(nextDefault, existing))
      }
      setAddresses(rest)
      if (id === selectedId) setSelectedId(rest[0]?.id ?? null)
      saveToStorage(rest)
    } catch {
      setError('Adres silinemedi.')
    }
  }

  async function handleSelect(addr: BillingAddress) {
    setSelectedId(addr.id)
    try {
      const existing = await axios.get('/api/v1/Business/me').then((r: any) => r.data)
      await axios.put('/api/v1/Business/me', mapToPayload(addr, existing))
    } catch {
      /* sessiz */
    }
  }

  if (loading) return <div className="max-w-3xl mx-auto py-12 text-center text-gray-500">Yükleniyor...</div>;

  const selected = addresses.find(a => a.id === selectedId)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/panel" aria-label="Panele dön" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Fatura Bilgisi</h1>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
          <Plus className="h-4 w-4" /> Adres Ekle
        </button>
      </div>

      {error && <div className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</div>}

      <div className="rounded-2xl bg-white border border-gray-100 divide-y divide-gray-50">
        {addresses.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <FileText className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">Henüz fatura adresi eklenmedi.</p>
            <button onClick={openNew}
              className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors">
              İlk Adresi Ekle
            </button>
          </div>
        )}

        {addresses.map((addr) => {
          const isSelected = addr.id === selectedId
          return (
            <div key={addr.id}
              onClick={() => handleSelect(addr)}
              className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                isSelected ? 'bg-brand-50/30' : ''
              }`}>
              <div className="pt-0.5">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-brand-500' : 'border-gray-300'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{addr.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    addr.invoiceType === 'kurumsal'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {addr.invoiceType === 'kurumsal' ? 'Kurumsal' : 'Bireysel'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {[addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')}
                </p>
                <p className="text-xs text-gray-400">
                  {[addr.postalCode, addr.city, addr.country].filter(Boolean).join(' / ')}
                </p>
                {addr.taxNumber && <p className="text-xs text-gray-400 mt-0.5">Vergi No: {addr.taxNumber}</p>}
              </div>
              <div className="flex shrink-0 gap-1 pt-0.5">
                <button onClick={(e) => { e.stopPropagation(); openEdit(addr) }}
                  className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Düzenle" aria-label={`${addr.name} adresini düzenle`}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(addr.id) }}
                  className="rounded-md p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Sil" aria-label={`${addr.name} adresini sil`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selected && (
        <div className="rounded-2xl bg-white border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Seçili Fatura Adresi</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Ad Soyad',      value: selected.name },
              { label: 'Adres',         value: [selected.addressLine1, selected.addressLine2].filter(Boolean).join(', ') || '-' },
              { label: 'Şehir',         value: selected.city || '-' },
              { label: 'Posta Kodu',    value: selected.postalCode || '-' },
              { label: 'Ülke',          value: selected.country || '-' },
              { label: 'Fatura Tipi',   value: selected.invoiceType === 'kurumsal' ? 'Kurumsal' : 'Bireysel' },
              { label: 'Vergi No',      value: selected.taxNumber || '-' },
              { label: 'Vergi Dairesi', value: selected.taxOffice || '-' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-gray-900 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setFormOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-5 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setFormOpen(false)} aria-label="Kapat"
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-gray-900">
              {editingId ? 'Adresi Düzenle' : 'Yeni Fatura Adresi'}
            </h2>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Bu bölüm test aşamasındadır. Gerçek fatura bilgilerinizi girmenize gerek yok — dilediğiniz bilgileri kullanabilirsiniz.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="fatura-name" className="block text-xs font-medium text-gray-600 mb-1.5">Ad Soyad <span className="text-red-500">*</span></label>
                  <input id="fatura-name" required value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="fatura-address1" className="block text-xs font-medium text-gray-600 mb-1.5">Adres Satırı 1</label>
                  <input id="fatura-address1" value={form.addressLine1}
                    onChange={e => setForm(f => ({ ...f, addressLine1: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="fatura-address2" className="block text-xs font-medium text-gray-600 mb-1.5">Adres Satırı 2</label>
                  <input id="fatura-address2" value={form.addressLine2}
                    onChange={e => setForm(f => ({ ...f, addressLine2: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div>
                  <label htmlFor="fatura-city" className="block text-xs font-medium text-gray-600 mb-1.5">Şehir</label>
                  <input id="fatura-city" value={form.city}
                    onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div>
                  <label htmlFor="fatura-postalcode" className="block text-xs font-medium text-gray-600 mb-1.5">Posta Kodu</label>
                  <input id="fatura-postalcode" value={form.postalCode}
                    onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div>
                  <label htmlFor="fatura-country" className="block text-xs font-medium text-gray-600 mb-1.5">Ülke</label>
                  <select id="fatura-country" value={form.country}
                    onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white">
                    <option value="">Seçiniz</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="fatura-invoicetype" className="block text-xs font-medium text-gray-600 mb-1.5">Fatura Tipi</label>
                  <select id="fatura-invoicetype" value={form.invoiceType}
                    onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value as 'bireysel' | 'kurumsal' }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white">
                    <option value="bireysel">Bireysel</option>
                    <option value="kurumsal">Kurumsal</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="fatura-taxnumber" className="block text-xs font-medium text-gray-600 mb-1.5">Vergi No</label>
                  <input id="fatura-taxnumber" value={form.taxNumber}
                    onChange={e => setForm(f => ({ ...f, taxNumber: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
                <div>
                  <label htmlFor="fatura-taxoffice" className="block text-xs font-medium text-gray-600 mb-1.5">Vergi Dairesi</label>
                  <input id="fatura-taxoffice" value={form.taxOffice}
                    onChange={e => setForm(f => ({ ...f, taxOffice: e.target.value }))}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setFormOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  İptal
                </button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
