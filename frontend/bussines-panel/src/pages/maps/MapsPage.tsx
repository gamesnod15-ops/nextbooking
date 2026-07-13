import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useBusiness } from '@/hooks/useBusiness'
import { useBranches } from '@/hooks/useBranches'
import {
  MapPin,
  Navigation,
  Globe,
  Phone,
  Search,
  Building2,
  Loader2,
  ArrowRight,
} from 'lucide-react'

interface BranchLocation {
  id: string
  name: string
  address: string
  city: string
  phone: string
  isMain: boolean
  managerName?: string | null
}

function buildMapQuery(branch: BranchLocation) {
  return [branch.address, branch.city].filter(Boolean).join(' ')
}

function MapEmbed({ branch }: { branch: BranchLocation }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(buildMapQuery(branch))}&output=embed`

  return (
    <iframe
      title={branch.name}
      src={src}
      className="h-72 w-full rounded-lg border border-gray-200"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
    />
  )
}

export function MapsPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState('main')
  const [searchQ, setSearchQ] = useState('')
  const { data: business, isLoading: businessLoading } = useBusiness()
  const { data: branchesData, isLoading: branchesLoading } = useBranches()

  const allBranches = useMemo<BranchLocation[]>(() => {
    const mainBranch: BranchLocation = {
      id: 'main',
      name: business?.name?.trim() || 'Ana Şube',
      address: business?.address?.trim() || 'Adres bilgisi henüz girilmedi',
      city: business?.city?.trim() || '',
      phone: business?.phone?.trim() || '',
      isMain: true,
    }

    const apiBranches = (branchesData?.items ?? []).map((branch) => ({
      id: branch.id,
      name: branch.name,
      address: branch.address?.trim() || 'Adres bilgisi henüz girilmedi',
      city: branch.city?.trim() || '',
      phone: branch.phone?.trim() || '',
      isMain: branch.isMainBranch,
      managerName: branch.managerName,
    }))

    const hasDedicatedMain = apiBranches.some((branch) => branch.isMain)
    return hasDedicatedMain ? apiBranches : [mainBranch, ...apiBranches]
  }, [branchesData?.items, business])

  const filtered = allBranches.filter((branch) => {
    const term = searchQ.toLowerCase()
    return [branch.name, branch.address, branch.city, branch.phone]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term))
  })

  const selected = allBranches.find((branch) => branch.id === selectedId)
    ?? filtered[0]
    ?? allBranches[0]

  function openMaps(branch: BranchLocation) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(buildMapQuery(branch))}`, '_blank')
  }

  function openDirections(branch: BranchLocation) {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(buildMapQuery(branch))}`, '_blank')
  }

  const isLoading = businessLoading || branchesLoading

  return (
    <div className="space-y-6">
      <PageHeader
        title="Haritalar"
        description="Şubelerinizin konumlarını canlı veriden görüntüleyin ve yol tarifi bağlantıları oluşturun"
      >
        <Button variant="outline" onClick={() => navigate('/branches')}>
          <Building2 className="mr-1.5 h-4 w-4" /> Şubeleri Yönet
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Şube veya adres ara..."
              className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{allBranches.length}</div>
                <div className="mt-1 text-xs text-gray-500">Haritada Gösterilen Şube</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-900">{allBranches.filter((branch) => branch.phone).length}</div>
                <div className="mt-1 text-xs text-gray-500">Telefon Bilgisi Tamam</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  Arama kriterine uyan şube bulunamadı.
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => setSelectedId(branch.id)}
                      className={cn(
                        'w-full rounded-xl border p-4 text-left transition-all hover:shadow-sm',
                        selected?.id === branch.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-sm font-semibold text-gray-900">{branch.name}</span>
                            {branch.isMain && <Badge variant="default" className="px-1.5 py-0 text-[10px]">Ana</Badge>}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">{branch.address}</p>
                          {branch.city && <p className="mt-0.5 text-xs text-gray-500">{branch.city}</p>}
                          {branch.managerName && <p className="mt-2 text-xs text-gray-400">Yönetici: {branch.managerName}</p>}
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-gray-300" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {selected ? (
            <>
              <Card>
                <CardContent className="pt-5">
                  <MapEmbed branch={selected} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{selected.name}</CardTitle>
                      <p className="mt-1 text-sm text-gray-500">Bu görünüm işletme ve şube kayıtlarınızdan otomatik üretilir.</p>
                    </div>
                    {selected.isMain && <Badge variant="default">Ana Şube</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Adres</p>
                        <p className="mt-1 text-sm text-gray-500">{selected.address}</p>
                        {selected.city && <p className="text-sm text-gray-500">{selected.city}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Telefon</p>
                        <p className="mt-1 text-sm text-gray-500">{selected.phone || 'Telefon bilgisi yok'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => openDirections(selected)}>
                      <Navigation className="mr-1.5 h-3.5 w-3.5" /> Yol Tarifi Al
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openMaps(selected)}>
                      <Globe className="mr-1.5 h-3.5 w-3.5" /> Google Maps'te Aç
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex min-h-[320px] items-center justify-center p-8 text-center text-sm text-gray-500">
                Harita göstermek için önce işletme adresinizi veya şube kayıtlarınızı tamamlayın.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
