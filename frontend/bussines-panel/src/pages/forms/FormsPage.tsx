import { useState } from 'react'
import { useForms, useSaveForms, type FormDefinition, type FormField, type FieldType } from '@/hooks/useForms'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn, toLocalDateStr } from '@/lib/utils'
import {
  Plus, FileText, Eye, Pencil, Trash2, Copy, X, ArrowLeft, GripVertical,
  CheckSquare, AlignLeft, Hash, Mail, Phone, Calendar, List, Loader2,
} from 'lucide-react'

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'Metin', textarea: 'Uzun Metin', number: 'Sayı', email: 'E-posta',
  phone: 'Telefon', date: 'Tarih', select: 'Seçim Listesi', checkbox: 'Onay Kutusu', radio: 'Seçenek',
}
const FIELD_ICONS: Record<FieldType, typeof AlignLeft> = {
  text: AlignLeft, textarea: AlignLeft, number: Hash, email: Mail, phone: Phone,
  date: Calendar, select: List, checkbox: CheckSquare, radio: List,
}

function makeField(type: FieldType): FormField {
  return { id: Date.now().toString(), type, label: FIELD_TYPE_LABELS[type], required: false }
}

function makeForm(): FormDefinition {
  return { id: Date.now().toString(), name: 'Yeni Form', description: '', isActive: true, createdAt: toLocalDateStr(), fields: [] }
}

// ─── Field Editor ──────────────────────────────────────────────────────────
function FieldEditor({ field, onChange, onDelete }: { field: FormField; onChange: (f: FormField) => void; onDelete: () => void }) {
  const Icon = FIELD_ICONS[field.type]
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-gray-50/50 px-3 py-2">
      <GripVertical className="mt-1 h-4 w-4 text-gray-300 shrink-0" />
      <Icon className="mt-1 h-4 w-4 text-gray-400 shrink-0" />
      <div className="flex-1 grid grid-cols-2 gap-2">
        <input value={field.label} onChange={e => onChange({ ...field, label: e.target.value })}
          className="rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Alan adı" />
        <input value={field.placeholder ?? ''} onChange={e => onChange({ ...field, placeholder: e.target.value })}
          className="rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Placeholder..." />
        {field.type === 'select' && (
          <div className="col-span-2">
            <input value={(field.options ?? []).join(', ')} onChange={e => onChange({ ...field, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              className="w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30" placeholder="Seçenekler (virgülle ayrın)" />
          </div>
        )}
        <label className="flex items-center gap-1.5 text-xs text-gray-600 col-span-2">
          <input type="checkbox" checked={field.required} onChange={e => onChange({ ...field, required: e.target.checked })} className="rounded" />
          Zorunlu alan
        </label>
      </div>
      <button onClick={onDelete} className="mt-0.5 rounded p-1 hover:bg-red-50 text-red-400"><X className="h-3.5 w-3.5" /></button>
    </div>
  )
}

// ─── Form Builder View ─────────────────────────────────────────────────────
function FormBuilder({ form, onSave, onBack, isSaving, saveError }: {
  form: FormDefinition; onSave: (f: FormDefinition) => void; onBack: () => void; isSaving: boolean; saveError?: string
}) {
  const [local, setLocal] = useState<FormDefinition>({ ...form, fields: [...form.fields] })

  function addField(type: FieldType) {
    setLocal(f => ({ ...f, fields: [...f.fields, makeField(type)] }))
  }
  function updateField(idx: number, field: FormField) {
    setLocal(f => ({ ...f, fields: f.fields.map((fld, i) => i === idx ? field : fld) }))
  }
  function removeField(idx: number) {
    setLocal(f => ({ ...f, fields: f.fields.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Geri
        </button>
        <h2 className="font-bold text-gray-900 flex-1">{local.name}</h2>
        {saveError && <span className="text-sm text-red-500">{saveError}</span>}
        <button onClick={() => onSave(local)} disabled={isSaving}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />} Kaydet
        </button>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">Form Adı</label>
            <input value={local.name} onChange={e => setLocal(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Açıklama</label>
            <textarea value={local.description} onChange={e => setLocal(f => ({ ...f, description: e.target.value }))} rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Alanlar ({local.fields.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {local.fields.map((field, i) => (
            <FieldEditor key={field.id} field={field} onChange={f => updateField(i, f)} onDelete={() => removeField(i)} />
          ))}
          {local.fields.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-6">Henüz alan yok. Aşağıdan ekleyin.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Alan Ekle:</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map(type => {
              const Icon = FIELD_ICONS[type]
              return (
                <button key={type} onClick={() => addField(type)}
                  className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50 hover:border-primary/30">
                  <Icon className="h-3.5 w-3.5 text-gray-400" /> {FIELD_TYPE_LABELS[type]}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── FormsPage ─────────────────────────────────────────────────────────────
export function FormsPage() {
  const { data, isLoading } = useForms()
  const saveMutation = useSaveForms()

  const forms = data?.forms ?? []
  const submissions = data?.submissions ?? []

  const [editingForm, setEditingForm] = useState<FormDefinition | null>(null)
  const [activeTab, setActiveTab] = useState<'forms' | 'submissions'>('forms')
  const [saveError, setSaveError] = useState('')

  async function saveForm(form: FormDefinition) {
    setSaveError('')
    const exists = forms.find(f => f.id === form.id)
    const newForms = exists ? forms.map(f => f.id === form.id ? form : f) : [...forms, form]
    try {
      await saveMutation.mutateAsync({ forms: newForms, submissions })
      setEditingForm(null)
    } catch {
      setSaveError('Form kaydedilemedi. API bağlantısını kontrol edin.')
    }
  }

  async function deleteForm(id: string) {
    await saveMutation.mutateAsync({ forms: forms.filter(f => f.id !== id), submissions }).catch(() => {})
  }

  async function duplicateForm(form: FormDefinition) {
    const copy: FormDefinition = { ...form, id: Date.now().toString(), name: `${form.name} (Kopya)`, createdAt: toLocalDateStr() }
    await saveMutation.mutateAsync({ forms: [...forms, copy], submissions }).catch(() => {})
  }

  async function toggleForm(id: string) {
    await saveMutation.mutateAsync({ forms: forms.map(f => f.id === id ? { ...f, isActive: !f.isActive } : f), submissions }).catch(() => {})
  }

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
  }

  if (editingForm) {
    return <FormBuilder form={editingForm} onSave={saveForm} onBack={() => { setEditingForm(null); setSaveError('') }} isSaving={saveMutation.isPending} saveError={saveError} />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Formlar" description="Müşteri formları ve gönderimleri">
        <Button size="sm" onClick={() => setEditingForm(makeForm())}>
          <Plus className="mr-1 h-4 w-4" /> Yeni Form
        </Button>
      </PageHeader>

      <div className="flex gap-1 border-b">
        {(['forms', 'submissions'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab === 'forms' ? `Formlar (${forms.length})` : `Gönderimleri (${submissions.length})`}
          </button>
        ))}
      </div>

      {activeTab === 'forms' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map(form => (
            <Card key={form.id} className={cn(!form.isActive && 'opacity-70')}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <h3 className="font-semibold text-sm text-gray-900 leading-tight">{form.name}</h3>
                  </div>
                  <Badge variant={form.isActive ? 'default' : 'secondary'} className="text-[10px] shrink-0">{form.isActive ? 'Aktif' : 'Pasif'}</Badge>
                </div>
                {form.description && <p className="text-xs text-gray-500 mb-3">{form.description}</p>}
                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  <span>{form.fields.length} alan</span>
                  <span>·</span>
                  <span>{submissions.filter(s => s.formId === form.id).length} gönderim</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setEditingForm(form)}
                    className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50">
                    <Pencil className="h-3 w-3" /> Düzenle
                  </button>
                  <button onClick={() => duplicateForm(form)}
                    className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50">
                    <Copy className="h-3 w-3" /> Kopyala
                  </button>
                  <button onClick={() => toggleForm(form.id)}
                    className="flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs hover:bg-gray-50">
                    {form.isActive ? 'Durdur' : 'Etkinleştir'}
                  </button>
                  <button onClick={() => deleteForm(form.id)} className="ml-auto rounded-lg border px-2 py-1.5 text-xs text-red-500 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
          {forms.length === 0 && (
            <div className="col-span-3 text-center py-16">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500 font-medium">Henüz form yok</p>
              <p className="text-gray-400 text-sm mt-1">Yeni form oluşturun</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
          {submissions.length === 0 ? (
            <div className="text-center py-16">
              <Eye className="h-12 w-12 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-500">Henüz gönderim yok</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Form</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tarih</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Gönderim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {submissions.map(sub => {
                  const form = forms.find(f => f.id === sub.formId)
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium">{form?.name ?? sub.formId}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(sub.submittedAt).toLocaleString('tr-TR')}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(sub.data).slice(0, 3).map(([k, v]) => (
                            <span key={k} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs"><b>{k}:</b> {v}</span>
                          ))}
                          {Object.keys(sub.data).length > 3 && <span className="text-xs text-gray-400">+{Object.keys(sub.data).length - 3} daha</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

