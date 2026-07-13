import { useState } from 'react'
import { Sparkles, Search, RefreshCw, Loader2, Eye } from 'lucide-react'
import { useCustomers } from '@/hooks/useCustomers'
import {
  useAllRecommendations,
  useServiceRecommendations,
  useProductRecommendations,
  useTimelyRecommendations,
  useMarkRecommendationViewed,
  useGenerateRecommendations,
  type Recommendation,
} from '@/hooks/useRecommendations'

type Tab = 'all' | 'services' | 'products' | 'timely'

export function RecommendationsPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)

  const { data: customersData } = useCustomers({ pageSize: 50, search: search || undefined })
  const customers = customersData?.items ?? []

  const allRecs = useAllRecommendations(selectedCustomerId ?? undefined)
  const serviceRecs = useServiceRecommendations(selectedCustomerId ?? undefined)
  const productRecs = useProductRecommendations(selectedCustomerId ?? undefined)
  const timelyRecs = useTimelyRecommendations(selectedCustomerId ?? undefined)
  const markViewed = useMarkRecommendationViewed()
  const generateRecs = useGenerateRecommendations()

  const getRecommendations = (): Recommendation[] => {
    switch (tab) {
      case 'services': return serviceRecs.data ?? []
      case 'products': return productRecs.data ?? []
      case 'timely': return timelyRecs.data ?? []
      default: return allRecs.data ?? []
    }
  }

  const isLoading = allRecs.isLoading || serviceRecs.isLoading || productRecs.isLoading || timelyRecs.isLoading
  const recommendations = getRecommendations()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">AI Öneri Motoru</h1>
          <p className="text-sm text-gray-500">Yapay zeka destekli kişiselleştirilmiş öneriler</p>
        </div>
        {selectedCustomerId && (
          <button
            onClick={() => generateRecs.mutate(selectedCustomerId)}
            disabled={generateRecs.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            {generateRecs.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Önerileri Yenile
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Müşteri ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {customers.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customers.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCustomerId(c.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCustomerId === c.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {selectedCustomerId && (
        <>
          <div className="flex gap-1 border-b border-gray-200">
            {(['all', 'services', 'products', 'timely'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  tab === t
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'all' ? 'Tümü' : t === 'services' ? 'Hizmetler' : t === 'products' ? 'Ürünler' : 'Zamanı Geldi'}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="col-span-full text-center py-16 text-gray-400">
                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>Henüz öneri bulunamadı</p>
                <p className="text-xs mt-1">Müşteri seçin veya önerileri yenileyin</p>
              </div>
            ) : recommendations.map(rec => (
              <div
                key={rec.id}
                className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${
                  rec.isViewed ? 'border-gray-200 bg-white' : 'border-primary/30 bg-primary/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{rec.title}</h3>
                    {rec.description && (
                      <p className="mt-1 text-xs text-gray-500 line-clamp-2">{rec.description}</p>
                    )}
                    {rec.reason && (
                      <p className="mt-2 text-xs text-gray-400 italic">{rec.reason}</p>
                    )}
                  </div>
                  <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    rec.relevanceScore >= 0.8 ? 'bg-green-100 text-green-700' :
                    rec.relevanceScore >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    %{Math.round(rec.relevanceScore * 100)}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    {rec.type === 'Timely' ? 'Zamanı Geldi' :
                     rec.type === 'CrossSell' ? 'Çapraz Satış' :
                     rec.type === 'Seasonal' ? 'Mevsimsel' :
                     rec.type === 'Service' ? 'Hizmet' : 'Ürün'}
                  </span>
                  {!rec.isViewed && (
                    <button
                      onClick={() => markViewed.mutate(rec.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Eye className="h-3 w-3" /> Görüldü işaretle
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!selectedCustomerId && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Sparkles className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">AI Öneri Motoru</p>
          <p className="text-sm mt-1">Yukarıdan bir müşteri seçerek kişiselleştirilmiş önerileri görüntüleyin</p>
        </div>
      )}
    </div>
  )
}
