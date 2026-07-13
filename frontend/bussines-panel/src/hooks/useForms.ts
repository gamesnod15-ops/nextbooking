import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type FieldType = 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'date' | 'select' | 'checkbox' | 'radio'

export interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
}

export interface FormDefinition {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  fields: FormField[]
}

export interface FormSubmission {
  id: string
  formId: string
  submittedAt: string
  customerName?: string
  data: Record<string, string>
}

export interface FormsData {
  forms: FormDefinition[]
  submissions: FormSubmission[]
}

const SETTINGS_KEY = 'forms_config'

async function fetchForms(): Promise<FormsData> {
  const res = await api.get<{ settings: Record<string, string> }>('/business/me')
  const raw = res.data.settings?.[SETTINGS_KEY]
  if (raw) {
    try { return JSON.parse(raw) } catch { /* ignore */ }
  }
  return {
    forms: [
      {
        id: '1',
        name: 'Randevu Başvuru Formu',
        description: 'Müşterilerin online randevu talebi oluşturması için',
        isActive: true,
        createdAt: new Date().toISOString().slice(0, 10),
        fields: [
          { id: 'f1', type: 'text', label: 'Ad Soyad', required: true, placeholder: 'Adınız Soyadınız' },
          { id: 'f2', type: 'phone', label: 'Telefon', required: true, placeholder: '+90 555 000 00 00' },
          { id: 'f3', type: 'email', label: 'E-posta', required: false, placeholder: 'ornek@mail.com' },
          { id: 'f4', type: 'select', label: 'Hizmet', required: true, options: ['Saç Kesim', 'Manikür', 'Masaj', 'Diğer'] },
          { id: 'f5', type: 'date', label: 'Tercih Edilen Tarih', required: true },
          { id: 'f6', type: 'textarea', label: 'Notlar', required: false, placeholder: 'Eklemek istediğiniz notlar...' },
        ],
      },
    ],
    submissions: [],
  }
}

async function saveForms(data: FormsData): Promise<void> {
  await api.patch('/business/me/settings', { [SETTINGS_KEY]: JSON.stringify(data) })
}

export function useForms() {
  return useQuery({
    queryKey: ['forms'],
    queryFn: fetchForms,
    staleTime: 30 * 1000,
  })
}

export function useSaveForms() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveForms,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forms'] })
      qc.invalidateQueries({ queryKey: ['business'] })
    },
  })
}
