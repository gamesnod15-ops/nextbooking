'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ArrowRight, Loader2 } from 'lucide-react'
import { api, ApiError } from '@/lib/api'

// Same list used by the anonymous signup wizard — kept in sync manually
// since it mirrors the backend's BusinessCategory enum.
const BUSINESS_CATEGORIES = [
  { value: 1,  label: 'Güzellik Salonu' },
  { value: 2,  label: 'Kuaför / Berber' },
  { value: 3,  label: 'Klinik' },
  { value: 4,  label: 'Diş Kliniği' },
  { value: 5,  label: 'Fizyoterapi' },
  { value: 6,  label: 'Spor Salonu' },
  { value: 7,  label: 'Kişisel Antrenör' },
  { value: 8,  label: 'Yoga & Pilates' },
  { value: 9,  label: 'Spa & Masaj' },
  { value: 10, label: 'Tırnak Salonu' },
  { value: 11, label: 'Dövme Stüdyosu' },
  { value: 12, label: 'Veteriner' },
  { value: 13, label: 'Oto Servis' },
  { value: 14, label: 'Oto Yıkama' },
  { value: 15, label: 'Teknik Servis' },
  { value: 16, label: 'Danışmanlık' },
  { value: 17, label: 'Psikolog' },
  { value: 18, label: 'Beslenme Uzmanı' },
  { value: 19, label: 'Özel Ders' },
  { value: 20, label: 'Fotoğrafçı' },
  { value: 99, label: 'Diğer' },
]

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

interface FormState {
  businessName: string
  subdomain: string
  businessCategory: string
}

const inputCls =
  'w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20'

export default function CreateBusinessPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({ businessName: '', subdomain: '', businessCategory: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (form.businessName) {
      setForm((prev) => ({ ...prev, subdomain: slugify(form.businessName) }))
    }
  }, [form.businessName])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!form.businessName.trim()) errs.businessName = 'İşletme adı gereklidir.'
    if (!form.subdomain.trim()) errs.subdomain = 'Firma kullanıcı adı gereklidir.'
    else if (!/^[a-z0-9-]{3,50}$/.test(form.subdomain)) errs.subdomain = 'Yalnızca küçük harf, rakam ve tire (-) kullanabilirsiniz (3-50 karakter).'
    if (!form.businessCategory) errs.businessCategory = 'İşletme kategorisi seçiniz.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})
    try {
      const res = await api.post<{
        accessToken: string
        tenantId: string
        userId: string
        role: string
        subdomain: string
      }>('/api/v1/tenants/create-for-current-user', {
        businessName: form.businessName,
        subdomain: form.subdomain,
        businessCategory: parseInt(form.businessCategory),
      })

      localStorage.setItem('accessToken', res.accessToken)
      localStorage.setItem('role', res.role)
      localStorage.setItem('tenantId', res.tenantId)

      router.push('/register/onboarding')
    } catch (err) {
      const apiErr = err as ApiError
      if (apiErr.status === 409) {
        const msg = apiErr.message.toLowerCase()
        if (msg.includes('subdomain')) setErrors({ subdomain: 'Bu firma kullanıcı adı zaten alınmış.' })
        else setErrors({ general: apiErr.message })
      } else {
        setErrors({ general: apiErr.message || 'İşletme oluşturulamadı. Lütfen tekrar deneyin.' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-medium text-gray-900">İşletmenizi Oluşturun</h1>
        <p className="mt-1.5 text-sm text-gray-500">
          Ad, soyad, e-posta ve telefon bilgileriniz hesabınızdan alınacak — sadece işletmenizle ilgili
          birkaç bilgi girmeniz yeterli.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {errors.general && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errors.general}</div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-base font-bold text-gray-900">
            <Building2 className="h-5 w-5 text-brand-500" />
            İşletme Bilgileri
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="businessName" className="mb-1.5 block text-sm font-medium text-gray-700">İşletme Adı</label>
              <input
                id="businessName"
                type="text"
                value={form.businessName}
                onChange={set('businessName')}
                placeholder="Yılmaz Kuaför"
                autoComplete="organization"
                className={inputCls}
              />
              {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>}
            </div>

            <div>
              <label htmlFor="subdomain" className="mb-1.5 block text-sm font-medium text-gray-700">
                Firma Kullanıcı Adı (Subdomain)
              </label>
              <div className="flex overflow-hidden rounded-xl border border-gray-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20">
                <span className="flex items-center whitespace-nowrap border-r border-gray-300 bg-gray-50 px-3 text-xs text-gray-500">
                  jetrandevu.com/
                </span>
                <input
                  id="subdomain"
                  type="text"
                  value={form.subdomain}
                  onChange={set('subdomain')}
                  placeholder="yilmaz-kuafor"
                  className="flex-1 bg-white px-3 py-2.5 text-sm outline-none"
                />
              </div>
              {errors.subdomain && <p className="mt-1 text-xs text-red-500">{errors.subdomain}</p>}
            </div>

            <div>
              <label htmlFor="businessCategory" className="mb-1.5 block text-sm font-medium text-gray-700">İşletme Kategorisi</label>
              <select id="businessCategory" value={form.businessCategory} onChange={set('businessCategory')} className={inputCls}>
                <option value="">Kategori seçin</option>
                {BUSINESS_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              {errors.businessCategory && <p className="mt-1 text-xs text-red-500">{errors.businessCategory}</p>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Oluşturuluyor…</>
          ) : (
            <>İşletmeyi Oluştur <ArrowRight className="h-4 w-4" /></>
          )}
        </button>
      </form>
    </div>
  )
}
