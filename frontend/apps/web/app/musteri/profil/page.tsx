'use client'

import { useEffect, useState } from 'react'
import axios from '@/lib/axios'
import { User, Mail, Phone, Save, Loader2, CheckCircle, AlertCircle, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

function formatPhoneDisplay(raw: string) {
  const digits = raw.replace(/\D/g, '')
  const local = digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits
  const d = local.slice(0, 10)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`
  if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`
}

export default function MusteriProfilPage() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    axios.get('/api/v1/Users/me')
      .then((res: any) => {
        setForm({
          firstName: res.data.firstName || '',
          lastName:  res.data.lastName  || '',
          email:     res.data.email     || '',
          phone:     res.data.phone     || '',
        })
      })
      .catch(() => setError('Profil bilgileri alınamadı.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      await axios.put('/api/v1/Users/me', {
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        phone:     form.phone,
      })
      localStorage.setItem('fullName', `${form.firstName} ${form.lastName}`)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Profil güncellenirken bir hata oluştu.')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    ;['accessToken', 'userId', 'fullName', 'role', 'tenantId', 'profile_avatar'].forEach(k => localStorage.removeItem(k))
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Profilim</h1>
        <p className="text-sm text-gray-500 mt-1">Kişisel bilgilerinizi görüntüleyin ve düzenleyin.</p>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-xl font-bold text-black">
            {(form.firstName.charAt(0) + form.lastName.charAt(0)).toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-base font-bold text-gray-900">{form.firstName} {form.lastName}</p>
            <p className="text-sm text-gray-500">{form.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="profil-firstname" className="mb-1.5 block text-sm font-medium text-gray-700">Ad</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input id="profil-firstname" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
            </div>
          </div>
          <div>
            <label htmlFor="profil-lastname" className="mb-1.5 block text-sm font-medium text-gray-700">Soyad</label>
            <input id="profil-lastname" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 py-2.5 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </div>

        <div>
          <label htmlFor="profil-email" className="mb-1.5 block text-sm font-medium text-gray-700">E-posta</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input id="profil-email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20" />
          </div>
        </div>

        <div>
          <label htmlFor="profil-phone" className="mb-1.5 block text-sm font-medium text-gray-700">Telefon</label>
          <div className="flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-colors">
            <span className="flex shrink-0 select-none items-center gap-1.5 border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500">
              +90
            </span>
            <input
              id="profil-phone"
              type="tel"
              value={formatPhoneDisplay(form.phone)}
              onChange={e => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                setForm(p => ({ ...p, phone: digits ? `+90${digits}` : '' }))
              }}
              placeholder="555 000 00 00"
              autoComplete="tel"
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4 shrink-0" /> Bilgileriniz güncellendi.
          </div>
        )}

        <button type="submit" disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-sm font-bold text-black hover:bg-brand-600 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Kaydediliyor...' : 'Bilgileri Kaydet'}
        </button>
      </form>

      <div className="mt-6">
        <button onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors">
          <LogOut className="h-4 w-4" /> Çıkış Yap
        </button>
      </div>
    </div>
  )
}
