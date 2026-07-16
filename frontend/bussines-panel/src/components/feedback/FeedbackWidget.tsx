import { useState } from 'react'
import { useSelector } from 'react-redux'
import { MessageSquareHeart, X, Smile, HelpCircle, Lightbulb, Bug, Loader2 } from 'lucide-react'
import { RootState } from '@/store'
import { cn } from '@/lib/utils'
import { useCreateFeedback, type FeedbackCategory } from '@/hooks/useFeedback'
import { showToast } from '@/components/ui/Toast'

const CATEGORIES: Array<{ value: FeedbackCategory; label: string; icon: typeof Smile }> = [
  { value: 'EasyToUse', label: 'Kolay kullandım', icon: Smile },
  { value: 'Confusing', label: 'Anlaşılmadı', icon: HelpCircle },
  { value: 'Suggestion', label: 'Öneri / İstek', icon: Lightbulb },
  { value: 'BugReport', label: 'Hata bildirimi', icon: Bug },
]

export function FeedbackWidget() {
  const accessToken = useSelector((s: RootState) => s.auth.accessToken)
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<FeedbackCategory | null>(null)
  const [message, setMessage] = useState('')
  const { mutate, isPending } = useCreateFeedback()

  if (!accessToken) return null

  function close() {
    setOpen(false)
    setCategory(null)
    setMessage('')
  }

  function submit() {
    if (!category || !message.trim()) return
    mutate(
      { category, message: message.trim() },
      {
        onSuccess: () => {
          showToast('success', 'Teşekkürler!', 'Geri bildiriminiz bize ulaştı.')
          close()
        },
        onError: () => {
          showToast('error', 'Gönderilemedi', 'Geri bildiriminiz gönderilirken bir hata oluştu.')
        },
      }
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Geri bildirim gönder"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg hover:bg-gray-800 hover:-translate-y-0.5 transition-all"
      >
        <MessageSquareHeart className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <button
              onClick={close}
              aria-label="Kapat"
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900">Geri Bildirim Gönder</h2>
              <p className="mt-1 text-sm text-gray-500">
                Uygulamayı kullanırken neyi rahat kullandınız, ne anlaşılmadı ya da ne olsa iyi olur?
              </p>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => {
                  const Icon = c.icon
                  const selected = category === c.value
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      aria-pressed={selected}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium transition-colors',
                        selected
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {c.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4">
                <label htmlFor="feedback-message" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Detay
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  placeholder="Düşüncelerinizi bizimle paylaşın…"
                  className="w-full resize-none rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={!category || !message.trim() || isPending}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 py-3 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {isPending ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
