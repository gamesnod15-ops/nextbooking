import { useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { showToast } from '@/components/ui/Toast'
import { useMyProfile, useUpdateMyProfile } from '@/hooks/useProfile'

export function ProfilePage() {
  const { data, isLoading } = useMyProfile()
  const updateMutation = useUpdateMyProfile()

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (data) {
      setForm({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone ?? '',
        jobTitle: data.jobTitle ?? '',
      })
    }
  }, [data])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.firstName.trim()) e.firstName = 'Zorunlu alan'
    if (!form.lastName.trim()) e.lastName = 'Zorunlu alan'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Geçerli bir e-posta girin'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!validate()) return
    try {
      await updateMutation.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || null,
        jobTitle: form.jobTitle || null,
      })
      showToast('success', 'Kaydedildi', 'Profil bilgileriniz güncellendi.')
    } catch {
      showToast('error', 'Hata', 'Profil güncellenemedi.')
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Profilim" description="Kendi hesap bilgilerinizi düzenleyin" />

      <div className="max-w-lg rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="space-y-4 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Ad *</label>
              <input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              {errors.firstName && <div className="text-xs text-red-500 mt-1">{errors.firstName}</div>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Soyad *</label>
              <input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              {errors.lastName && <div className="text-xs text-red-500 mt-1">{errors.lastName}</div>}
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-700">E-posta *</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              {errors.email && <div className="text-xs text-red-500 mt-1">{errors.email}</div>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Telefon</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="+90 5XX XXX XX XX" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Unvan</label>
              <input value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Örn. Operasyon Müdürü" />
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            onClick={save}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
