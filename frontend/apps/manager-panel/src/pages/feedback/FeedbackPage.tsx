import { useState } from 'react'
import { Loader2, MessageSquare } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/lib/utils'
import { useAdminFeedback, type FeedbackCategory } from '@/hooks/useAdminFeedback'

const categoryLabels: Record<FeedbackCategory, string> = {
  easyToUse: 'Kullanımı Kolay',
  confusing: 'Kafa Karıştırıcı',
  suggestion: 'Öneri',
  bugReport: 'Hata Bildirimi',
}

const categoryVariant: Record<FeedbackCategory, 'success' | 'warning' | 'info' | 'destructive'> = {
  easyToUse: 'success',
  confusing: 'warning',
  suggestion: 'info',
  bugReport: 'destructive',
}

export function FeedbackPage() {
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState<FeedbackCategory | ''>('')

  const { data, isLoading } = useAdminFeedback({ pageNumber: page, pageSize: 20, category: category || undefined })
  const items = data?.items ?? []

  return (
    <div className="space-y-5">
      <PageHeader title="Geri Bildirimler" description="İşletme panelinden gönderilen kullanıcı geri bildirimleri" />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setCategory(''); setPage(1) }}
          className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${category === '' ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Tümü
        </button>
        {Object.entries(categoryLabels).map(([k, v]) => (
          <button
            key={k}
            onClick={() => { setCategory(k as FeedbackCategory); setPage(1) }}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${category === k ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {v}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Geri bildirim yok" description="Bu filtreye uyan bir geri bildirim bulunamadı." />
      ) : (
        <div className="space-y-3">
          {items.map((f) => (
            <div key={f.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={categoryVariant[f.category]}>{categoryLabels[f.category]}</Badge>
                    <span className="text-xs text-gray-400">{formatDateTime(f.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-800">{f.message}</p>
                  {f.imageUrls && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {f.imageUrls.split(',').filter(Boolean).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" className="h-16 w-16 rounded-lg object-cover border border-gray-200 hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {f.tenantName ?? 'Bilinmeyen işletme'}
                    {f.userName && ` · ${f.userName}`}
                    {f.userEmail && ` (${f.userEmail})`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(data?.totalPages ?? 1) > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Önceki</button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {data?.totalPages}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= (data?.totalPages ?? 1)} className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40">Sonraki</button>
        </div>
      )}
    </div>
  )
}
