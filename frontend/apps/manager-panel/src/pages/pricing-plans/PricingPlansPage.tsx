import { useState } from 'react'
import { Loader2, Plus, X, Edit2, Trash2, Star, Check } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { showToast } from '@/components/ui/Toast'
import { formatCurrency } from '@/lib/utils'
import {
  useAdminPricingPlans,
  useAdminPricingPlanSlots,
  useCreatePricingPlan,
  useUpdatePricingPlan,
  useSetPricingPlanActive,
  useDeletePricingPlan,
  useSetPricingPlanSlot,
  type PricingPlan,
  type PricingPlanPayload,
} from '@/hooks/useAdminPricingPlans'

type PlanForm = PricingPlanPayload & { id?: string }

const emptyForm: PlanForm = {
  name: '', badgeLabel: '', description: '', price: null, isCustomPricing: false,
  buttonText: 'Ücretsiz Başla', features: [''], isHighlighted: false, highlightLabel: '', planKey: '',
}

export function PricingPlansPage() {
  const { data: plans, isLoading: plansLoading } = useAdminPricingPlans()
  const { data: slots, isLoading: slotsLoading } = useAdminPricingPlanSlots()
  const createMutation = useCreatePricingPlan()
  const updateMutation = useUpdatePricingPlan()
  const activeMutation = useSetPricingPlanActive()
  const deleteMutation = useDeletePricingPlan()
  const slotMutation = useSetPricingPlanSlot()

  const [modal, setModal] = useState<PlanForm | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openAdd() { setModal({ ...emptyForm, features: [''] }); setErrors({}) }
  function openEdit(p: PricingPlan) {
    setModal({
      id: p.id, name: p.name, badgeLabel: p.badgeLabel, description: p.description, price: p.price,
      isCustomPricing: p.isCustomPricing, buttonText: p.buttonText, features: p.features.length ? p.features : [''],
      isHighlighted: p.isHighlighted, highlightLabel: p.highlightLabel ?? '', planKey: p.planKey ?? '',
    })
    setErrors({})
  }

  function validate(f: PlanForm) {
    const e: Record<string, string> = {}
    if (!f.name.trim()) e.name = 'Zorunlu alan'
    if (!f.badgeLabel.trim()) e.badgeLabel = 'Zorunlu alan'
    if (!f.description.trim()) e.description = 'Zorunlu alan'
    if (!f.buttonText.trim()) e.buttonText = 'Zorunlu alan'
    if (!f.isCustomPricing && (!f.price || f.price <= 0)) e.price = 'Geçerli bir fiyat girin'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function save() {
    if (!modal || !validate(modal)) return
    const payload: PricingPlanPayload = {
      name: modal.name, badgeLabel: modal.badgeLabel, description: modal.description,
      price: modal.isCustomPricing ? null : modal.price, isCustomPricing: modal.isCustomPricing,
      buttonText: modal.buttonText, features: modal.features.map((f) => f.trim()).filter(Boolean),
      isHighlighted: modal.isHighlighted, highlightLabel: modal.highlightLabel || null,
      planKey: modal.planKey || null,
    }
    try {
      if (modal.id) {
        await updateMutation.mutateAsync({ id: modal.id, ...payload })
        showToast('success', 'Güncellendi', 'Paket güncellendi.')
      } else {
        await createMutation.mutateAsync(payload)
        showToast('success', 'Oluşturuldu', 'Yeni paket oluşturuldu.')
      }
      setModal(null)
    } catch {
      showToast('error', 'Hata', 'İşlem gerçekleştirilemedi.')
    }
  }

  async function toggleActive(p: PricingPlan) {
    try {
      await activeMutation.mutateAsync({ id: p.id, isActive: !p.isActive })
    } catch {
      showToast('error', 'Hata', 'İşlem gerçekleştirilemedi.')
    }
  }

  async function confirmDelete() {
    if (!deleteId) return
    try {
      await deleteMutation.mutateAsync(deleteId)
      showToast('success', 'Silindi', 'Paket silindi.')
    } catch {
      showToast('error', 'Hata', 'Paket silinemedi.')
    }
    setDeleteId(null)
  }

  async function assignSlot(slotNumber: number, pricingPlanId: string) {
    try {
      await slotMutation.mutateAsync({ slotNumber, pricingPlanId: pricingPlanId || null })
      showToast('success', 'Güncellendi', `Slot ${slotNumber} güncellendi.`)
    } catch {
      showToast('error', 'Hata', 'Slot güncellenemedi.')
    }
  }

  function updateFeature(idx: number, value: string) {
    setModal((m) => m && ({ ...m, features: m.features.map((f, i) => (i === idx ? value : f)) }))
  }
  function addFeature() {
    setModal((m) => m && ({ ...m, features: [...m.features, ''] }))
  }
  function removeFeature(idx: number) {
    setModal((m) => m && ({ ...m, features: m.features.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Paketler" description="Fiyatlandırma sayfasında gösterilecek paketleri yönetin">
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" /> Paket Ekle
        </button>
      </PageHeader>

      {/* Slots */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-700">Vitrin Slotları (Sabit 4 Konum)</h2>
        {slotsLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {slots?.map((slot) => (
              <div key={slot.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 text-xs font-semibold text-gray-400">Slot {slot.slotNumber}</div>
                <select
                  value={slot.plan?.id ?? ''}
                  onChange={(e) => assignSlot(slot.slotNumber, e.target.value)}
                  className="mb-3 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Boş</option>
                  {plans?.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {slot.plan ? (
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-gray-900">{slot.plan.name}</span>
                      {slot.plan.isHighlighted && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {slot.plan.isCustomPricing ? 'Özel fiyat' : formatCurrency(slot.plan.price ?? 0)}
                      {!slot.plan.isCustomPricing && <span className="text-xs font-normal text-gray-400">/ay</span>}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-300">Paket atanmadı</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plans list */}
      <div>
        <h2 className="mb-3 text-sm font-bold text-gray-700">Tüm Paketler</h2>
        {plansLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : !plans || plans.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-10 text-center text-sm text-gray-400">Henüz paket eklenmemiş</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.id} className={`rounded-2xl border p-5 shadow-sm ${p.isHighlighted ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'} ${!p.isActive ? 'opacity-50' : ''}`}>
                <div className="mb-2 flex items-center justify-between">
                  <Badge variant={p.isHighlighted ? 'default' : 'secondary'}>{p.badgeLabel}</Badge>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(p)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(p.id)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{p.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{p.description}</p>
                <div className="mt-3 text-2xl font-bold text-gray-900">
                  {p.isCustomPricing ? 'Özel fiyat' : <>{formatCurrency(p.price ?? 0)}<span className="text-sm font-normal text-gray-400">/ay</span></>}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />{f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <button
                    onClick={() => toggleActive(p)}
                    className="text-xs font-medium"
                  >
                    <Badge variant={p.isActive ? 'success' : 'destructive'}>{p.isActive ? 'Aktif' : 'Pasif'}</Badge>
                  </button>
                  {p.planKey && <span className="text-[10px] text-gray-400">plan: {p.planKey}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-base font-bold text-gray-900">{modal.id ? 'Paket Düzenle' : 'Yeni Paket'}</h2>
              <button onClick={() => setModal(null)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-4 px-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Paket Adı *</label>
                  <input value={modal.name} onChange={(e) => setModal((m) => m && ({ ...m, name: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Başlangıç" />
                  {errors.name && <div className="text-xs text-red-500 mt-1">{errors.name}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Rozet *</label>
                  <input value={modal.badgeLabel} onChange={(e) => setModal((m) => m && ({ ...m, badgeLabel: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Başlangıç" />
                  {errors.badgeLabel && <div className="text-xs text-red-500 mt-1">{errors.badgeLabel}</div>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Açıklama *</label>
                  <input value={modal.description} onChange={(e) => setModal((m) => m && ({ ...m, description: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Temel operasyonları hızlıca başlatın." />
                  {errors.description && <div className="text-xs text-red-500 mt-1">{errors.description}</div>}
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="customPricing" checked={modal.isCustomPricing} onChange={(e) => setModal((m) => m && ({ ...m, isCustomPricing: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="customPricing" className="text-sm text-gray-700">Özel fiyat (fiyat gösterme, "Özel fiyat" yaz)</label>
                </div>
                {!modal.isCustomPricing && (
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700">Fiyat (₺/ay) *</label>
                    <input type="number" min="0" step="1" value={modal.price ?? ''} onChange={(e) => setModal((m) => m && ({ ...m, price: e.target.value ? Number(e.target.value) : null }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="299" />
                    {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">Buton Metni *</label>
                  <input value={modal.buttonText} onChange={(e) => setModal((m) => m && ({ ...m, buttonText: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ücretsiz Başla" />
                  {errors.buttonText && <div className="text-xs text-red-500 mt-1">{errors.buttonText}</div>}
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">İç Plan Anahtarı (opsiyonel)</label>
                  <input value={modal.planKey ?? ''} onChange={(e) => setModal((m) => m && ({ ...m, planKey: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="starter / business / professional / custom" />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="highlighted" checked={modal.isHighlighted} onChange={(e) => setModal((m) => m && ({ ...m, isHighlighted: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
                  <label htmlFor="highlighted" className="text-sm text-gray-700">Öne çıkan paket (örn. "En Popüler")</label>
                </div>
                {modal.isHighlighted && (
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-700">Öne Çıkan Etiketi</label>
                    <input value={modal.highlightLabel ?? ''} onChange={(e) => setModal((m) => m && ({ ...m, highlightLabel: e.target.value }))} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="En Popüler" />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-700">Özellikler</label>
                  <div className="space-y-2">
                    {modal.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={f} onChange={(e) => updateFeature(i, e.target.value)} className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Özellik metni" />
                        <button onClick={() => removeFeature(i)} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    ))}
                    <button onClick={addFeature} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <Plus className="h-3 w-3" /> Özellik Ekle
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
              <button onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">İptal</button>
              <button
                onClick={save}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto"><Trash2 className="h-5 w-5 text-red-500" /></div>
            <h3 className="mt-3 text-center text-base font-bold text-gray-900">Paketi Sil</h3>
            <p className="mt-1 text-center text-sm text-gray-500">Bu paket kalıcı olarak silinecek ve bir slotta gösteriliyorsa slot boşalacak.</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">İptal</button>
              <button onClick={confirmDelete} disabled={deleteMutation.isPending} className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">Sil</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
