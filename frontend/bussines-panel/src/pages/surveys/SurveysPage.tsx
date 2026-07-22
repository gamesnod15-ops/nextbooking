import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { MobileHeaderActions } from '@/components/ui/MobileHeaderActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import { addSurvey, changeStatus, deleteSurvey, updateSurvey } from '@/store/slices/surveysSlice'
import type { Survey } from '@/store/slices/surveysSlice'
import {
  ClipboardCheck,
  Edit2,
  Eye,
  MessageSquare,
  Plus,
  Star,
  ThumbsUp,
  Trash2,
} from 'lucide-react'

type QuestionType = 'rating' | 'text' | 'nps' | 'multiple_choice'
type TriggerEvent = Survey['trigger']
type SurveyStatus = Survey['status']

const TRIGGER_LABEL: Record<TriggerEvent, string> = {
  after_appointment: 'Randevu Sonrası',
  manual: 'Manuel',
  after_x_visits: '5. Ziyaret Sonrası',
}

const STATUS_COLOR: Record<SurveyStatus, string> = {
  active: 'bg-green-100 text-green-700',
  draft: 'bg-amber-100 text-amber-700',
  archived: 'bg-gray-100 text-gray-500',
}

const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  rating: 'Yıldız',
  nps: 'NPS 0-10',
  text: 'Metin',
  multiple_choice: 'Çoktan Seçmeli',
}

const DEFAULT_QUESTIONS = [
  { id: 'q1', type: 'rating' as const, text: 'Genel deneyiminizi nasıl değerlendirirsiniz?', required: true },
  { id: 'q2', type: 'nps' as const, text: 'Bizi arkadaşlarınıza tavsiye eder misiniz?', required: true },
]

export function SurveysPage() {
  const dispatch = useAppDispatch()
  const surveys = useAppSelector((state) => state.surveys.surveys)

  const [activeTab, setActiveTab] = useState<'surveys' | 'responses' | 'analytics'>('surveys')
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null)
  const [showAddSurvey, setShowAddSurvey] = useState(false)
  const [deleteSurveyId, setDeleteSurveyId] = useState<string | null>(null)
  const [editSurveyId, setEditSurveyId] = useState<string | null>(null)
  const [newSurveyName, setNewSurveyName] = useState('')
  const [newSurveyTrigger, setNewSurveyTrigger] = useState<TriggerEvent>('after_appointment')
  const [editSurveyName, setEditSurveyName] = useState('')
  const [editSurveyTrigger, setEditSurveyTrigger] = useState<TriggerEvent>('after_appointment')
  const [surveyNameError, setSurveyNameError] = useState('')

  function createSurvey() {
    if (!newSurveyName.trim()) {
      setSurveyNameError('Bu bölüm boş bırakılamaz.')
      return
    }
    setSurveyNameError('')
    dispatch(addSurvey({
      name: newSurveyName.trim(),
      status: 'draft',
      trigger: newSurveyTrigger,
      questions: DEFAULT_QUESTIONS,
    }))

    setNewSurveyName('')
    setNewSurveyTrigger('after_appointment')
    setShowAddSurvey(false)
  }

  function openEditSurvey(survey: Survey) {
    setEditSurveyId(survey.id)
    setEditSurveyName(survey.name)
    setEditSurveyTrigger(survey.trigger)
  }

  function saveSurveyChanges() {
    if (!editSurveyId || !editSurveyName.trim()) return
    const existing = surveys.find((survey) => survey.id === editSurveyId)
    if (!existing) return
    dispatch(updateSurvey({
      ...existing,
      name: editSurveyName.trim(),
      trigger: editSurveyTrigger,
    }))
    setEditSurveyId(null)
  }

  const totalResponses = surveys.reduce((sum, survey) => sum + survey.responseCount, 0)
  const ratedSurveys = surveys.filter((survey) => survey.avgRating > 0)
  const avgRating = ratedSurveys.length
    ? Number((ratedSurveys.reduce((sum, survey) => sum + survey.avgRating, 0) / ratedSurveys.length).toFixed(1))
    : 0
  const satisfactionRate = ratedSurveys.length
    ? Math.round((ratedSurveys.filter((survey) => survey.avgRating >= 4).length / ratedSurveys.length) * 100)
    : 0

  const tabs = [
    { id: 'surveys', label: 'Anketler' },
    { id: 'responses', label: `Yanıtlar (${totalResponses})` },
    { id: 'analytics', label: 'Analitik' },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anket & Feedback"
        description="Müşteri memnuniyetini ölçün, geri bildirimleri analiz edin"
      >
        <div className="hidden lg:block">
          <Button onClick={() => setShowAddSurvey(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Yeni Anket
          </Button>
        </div>
        <MobileHeaderActions
          actions={[{ label: 'Yeni Anket', icon: <Plus className="h-4 w-4" />, onClick: () => setShowAddSurvey(true) }]}
        />
      </PageHeader>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'surveys' && (
        <div className="space-y-4">
          {showAddSurvey && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Yeni Anket Oluştur</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      value={newSurveyName}
                      onChange={(event) => { setNewSurveyName(event.target.value); if (surveyNameError) setSurveyNameError('') }}
                      placeholder="Anket adı *"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {surveyNameError && <div className="text-xs text-red-500 mt-1">{surveyNameError}</div>}
                  </div>
                  <select
                    value={newSurveyTrigger}
                    onChange={(event) => setNewSurveyTrigger(event.target.value as TriggerEvent)}
                    className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="after_appointment">Randevu Sonrası</option>
                    <option value="manual">Manuel Gönder</option>
                    <option value="after_x_visits">5. Ziyaret Sonrası</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={createSurvey}>Oluştur</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddSurvey(false)}>İptal</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {surveys.length === 0 && !showAddSurvey && (
            <Card>
              <CardContent className="py-16 text-center">
                <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Henüz anket yok</p>
                <p className="text-gray-400 text-sm mt-1">İlk anketinizi oluşturup geri bildirim toplamaya başlayın.</p>
                <Button className="mt-4" onClick={() => setShowAddSurvey(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> İlk Anketi Oluştur
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {surveys.map((survey) => (
              <Card key={survey.id} className={cn(selectedSurveyId === survey.id && 'ring-1 ring-primary/30')}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{survey.name}</span>
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full', STATUS_COLOR[survey.status])}>
                          {survey.status === 'active' ? 'Aktif' : survey.status === 'draft' ? 'Taslak' : 'Arşiv'}
                        </span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {TRIGGER_LABEL[survey.trigger]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {survey.responseCount} yanıt
                        </span>
                        {survey.avgRating > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            {survey.avgRating}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{survey.questions.length} soru</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => dispatch(changeStatus({ id: survey.id, status: survey.status === 'active' ? 'draft' : 'active' }))}
                        className={cn(
                          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                          survey.status === 'active' ? 'bg-primary' : 'bg-gray-200',
                        )}
                        title={survey.status === 'active' ? 'Taslağa al' : 'Aktif et'}
                      >
                        <span
                          className={cn(
                            'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                            survey.status === 'active' ? 'translate-x-4' : 'translate-x-0',
                          )}
                        />
                      </button>
                      <button
                        onClick={() => openEditSurvey(survey)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                        title="Düzenle"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedSurveyId(selectedSurveyId === survey.id ? null : survey.id)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
                        title="Detay"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteSurveyId(survey.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        title="Sil"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {selectedSurveyId === survey.id && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Sorular:</p>
                      {survey.questions.map((question, index) => (
                        <div key={question.id} className="flex items-start gap-2 text-xs">
                          <span className="text-gray-400 shrink-0">{index + 1}.</span>
                          <div>
                            <span className="text-gray-700">{question.text}</span>
                            <span className="ml-2 text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                              {QUESTION_TYPE_LABEL[question.type as QuestionType]}
                            </span>
                            {!question.required && <span className="ml-1 text-[10px] text-gray-400">(opsiyonel)</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'responses' && (
        <Card>
          <CardContent className="py-16 text-center">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Henüz yanıt yok</p>
            <p className="text-gray-400 text-sm mt-1">Yanıtlar geldikçe burada listelenecek.</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Toplam Yanıt', value: totalResponses, icon: MessageSquare, color: 'text-blue-600 bg-blue-50' },
              { label: 'Ort. Puan', value: avgRating, icon: Star, color: 'text-amber-600 bg-amber-50' },
              { label: 'Memnuniyet', value: `%${satisfactionRate}`, icon: ThumbsUp, color: 'text-green-600 bg-green-50' },
              { label: 'Aktif Anket', value: surveys.filter((survey) => survey.status === 'active').length, icon: ClipboardCheck, color: 'text-purple-600 bg-purple-50' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', stat.color)}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                      <p className="text-xs text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-sm">Anket Dağılımı</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Aktif', count: surveys.filter((survey) => survey.status === 'active').length, color: 'bg-green-400' },
                  { label: 'Taslak', count: surveys.filter((survey) => survey.status === 'draft').length, color: 'bg-amber-300' },
                  { label: 'Arşiv', count: surveys.filter((survey) => survey.status === 'archived').length, color: 'bg-gray-300' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 w-24">{item.label}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className={cn('h-2 rounded-full transition-all', item.color)}
                        style={{ width: `${surveys.length ? (item.count / surveys.length) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-6 text-right">{item.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Durum</CardTitle></CardHeader>
              <CardContent className="py-16 text-center">
                <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Gerçek yanıt verisi bekleniyor</p>
                <p className="text-gray-400 text-sm mt-1">Analitik kartları artık yalnızca kaydedilmiş anket verilerinden hesaplanıyor.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {deleteSurveyId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Anket silinsin mi?</h3>
            <p className="text-sm text-gray-600 mb-4">Bu anketi silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteSurveyId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button
                onClick={() => {
                  dispatch(deleteSurvey(deleteSurveyId))
                  if (selectedSurveyId === deleteSurveyId) setSelectedSurveyId(null)
                  setDeleteSurveyId(null)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {editSurveyId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
            <div className="p-5 border-b"><h2 className="font-semibold text-lg">Anket Düzenle</h2></div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Anket Adı *</label>
                <input
                  value={editSurveyName}
                  onChange={(event) => setEditSurveyName(event.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Tetikleyici</label>
                <select
                  value={editSurveyTrigger}
                  onChange={(event) => setEditSurveyTrigger(event.target.value as TriggerEvent)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="after_appointment">Randevu Sonrası</option>
                  <option value="manual">Manuel Gönder</option>
                  <option value="after_x_visits">5. Ziyaret Sonrası</option>
                </select>
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setEditSurveyId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button onClick={saveSurveyChanges} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
