import { useState } from 'react'
import type { ComponentType } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useAppDispatch, useAppSelector } from '@/store'
import { updatePlatform } from '@/store/slices/socialMediaSlice'
import type { PostTemplate } from '@/store/slices/socialMediaSlice'
import {
  CheckCheck,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Share2,
} from 'lucide-react'

const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
)

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const GoogleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
)

type PlatformVisual = {
  icon: ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

const PLATFORM_VISUALS: Record<string, PlatformVisual> = {
  instagram: { icon: InstagramIcon, color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-200' },
  facebook: { icon: FacebookIcon, color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  google: { icon: GoogleIcon, color: 'text-red-500', bgColor: 'bg-red-50 border-red-200' },
  whatsapp: { icon: WhatsAppIcon, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
}

function getPlatformVisual(platformId: string): PlatformVisual {
  return PLATFORM_VISUALS[platformId] ?? PLATFORM_VISUALS.instagram
}

export function SocialMediaPage() {
  const dispatch = useAppDispatch()
  const platforms = useAppSelector((state) => state.socialMedia.platforms)
  const templates = useAppSelector((state) => state.socialMedia.templates)
  const business = useAppSelector((state) => state.business.business)

  const [activeTab, setActiveTab] = useState<'connect' | 'booking-links' | 'templates'>('connect')
  const [editPlatformId, setEditPlatformId] = useState<string | null>(null)
  const [editUrl, setEditUrl] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null)

  const bookingLink = `https://randevumkolay.com/randevu/${business?.slug ?? 'isletmeniz'}`

  function connect(id: string) {
    const platform = platforms.find((item) => item.id === id)
    if (!platform) return

    dispatch(updatePlatform({
      ...platform,
      isConnected: true,
      profileUrl: editUrl,
    }))
    setEditPlatformId(null)
    setEditUrl('')
  }

  function disconnect(id: string) {
    const platform = platforms.find((item) => item.id === id)
    if (!platform) return

    dispatch(updatePlatform({
      ...platform,
      isConnected: false,
      profileUrl: '',
      bookingEnabled: false,
    }))
  }

  function toggleBooking(id: string) {
    const platform = platforms.find((item) => item.id === id)
    if (!platform) return

    dispatch(updatePlatform({
      ...platform,
      bookingEnabled: !platform.bookingEnabled,
    }))
  }

  function copyLink(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  function copyTemplate(text: string, id: string) {
    navigator.clipboard.writeText(text)
    setCopiedTemplate(id)
    setTimeout(() => setCopiedTemplate(null), 2000)
  }

  const tabs = [
    { id: 'connect', label: 'Hesaplar' },
    { id: 'booking-links', label: 'Rezervasyon Linkleri' },
    { id: 'templates', label: 'Paylaşım Şablonları' },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sosyal Medya"
        description="Sosyal medya hesaplarınızı bağlayın, rezervasyon linklerini yönetin"
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map(tab => (
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

      {/* Connect */}
      {activeTab === 'connect' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {platforms.map((platform) => {
            const visual = getPlatformVisual(platform.id)
            const PlatformIcon = visual.icon

            return (
            <Card key={platform.id}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-4">
                  <div className={cn('p-2.5 rounded-xl border', visual.bgColor)}>
                    <PlatformIcon className={cn('h-6 w-6', visual.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900 text-sm">{platform.name}</h3>
                      <Badge className={cn('text-[10px]', platform.isConnected ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-100')}>
                        {platform.isConnected ? 'Bağlı' : 'Bağlı Değil'}
                      </Badge>
                    </div>

                    {platform.isConnected ? (
                      <div className="mt-2 space-y-2">
                        {platform.profileUrl && (
                          <p className="text-xs text-gray-500 truncate">{platform.profileUrl}</p>
                        )}
                        {platform.followers !== undefined && (
                          <p className="text-xs text-gray-500">{platform.followers.toLocaleString('tr')} takipçi</p>
                        )}
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                            <input type="checkbox" checked={platform.bookingEnabled} onChange={() => toggleBooking(platform.id)} className="rounded" />
                            Rezervasyon Butonu
                          </label>
                        </div>
                        <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => disconnect(platform.id)}>
                          Bağlantıyı Kes
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        {editPlatformId === platform.id ? (
                          <div className="space-y-2">
                            <input
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              placeholder="Profil URL veya kullanıcı adı"
                              className="w-full rounded border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => connect(platform.id)}>Bağla</Button>
                              <Button size="sm" variant="outline" onClick={() => setEditPlatformId(null)}>İptal</Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => { setEditPlatformId(platform.id); setEditUrl('') }}>
                            <Link2 className="h-3.5 w-3.5 mr-1.5" /> Bağla
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            )})}
        </div>
      )}

      {/* Booking Links */}
      {activeTab === 'booking-links' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4" /> Ana Rezervasyon Linki</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2.5">
                <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="flex-1 text-sm text-gray-700 truncate">{bookingLink}</span>
                <button onClick={() => copyLink(bookingLink, 'main')} className="shrink-0 flex items-center gap-1 text-xs text-primary hover:text-primary/70">
                  {copied === 'main' ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied === 'main' ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.open(bookingLink, '_blank')}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Önizle
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { id: 'instagram', label: 'Instagram Bio Linki', platform: 'Instagram', desc: 'Profil biyografisi için kısa link', color: 'text-pink-600 bg-pink-50' },
              { id: 'whatsapp', label: 'WhatsApp Randevu', platform: 'WhatsApp', desc: 'Müşteriler tıklayınca direkt mesaj gönderir', color: 'text-green-600 bg-green-50' },
              { id: 'facebook', label: 'Facebook Sayfa Butonu', platform: 'Facebook', desc: 'Facebook sayfanıza eklenecek rezervasyon butonu', color: 'text-blue-600 bg-blue-50' },
              { id: 'qr', label: 'QR Kodu', platform: 'Tüm Platformlar', desc: 'Yazılı materyallerde kullanmak için QR kod', color: 'text-purple-600 bg-purple-50' },
            ].map(item => {
              const link = item.id === 'whatsapp'
                ? `https://wa.me/905001234567?text=Randevu%20almak%20istiyorum`
                : `${bookingLink}?ref=${item.id}`
              return (
                <Card key={item.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-1.5 rounded-lg text-xs font-bold', item.color)}>
                        <Share2 className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500 mb-2">{item.desc}</p>
                        <div className="flex items-center gap-2 rounded border bg-gray-50 px-2 py-1.5">
                          <span className="flex-1 text-xs text-gray-600 truncate">{link}</span>
                          <button onClick={() => copyLink(link, item.id)} className="shrink-0">
                            {copied === item.id ? <CheckCheck className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-gray-400 hover:text-primary" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Bu şablonları kopyalayıp sosyal medya hesaplarınızda kullanın. Süslü parantez içindeki alanları düzenleyin.</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {templates.map((t: PostTemplate) => (
              <Card key={t.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900">{t.title}</h3>
                    <div className="flex gap-1">
                      {t.platform.map((p) => {
                        const pl = platforms.find((item) => item.id === p)
                        if (!pl) return null
                        const visual = getPlatformVisual(pl.id)
                        const PlatformIcon = visual.icon
                        return <PlatformIcon key={p} className={cn('h-4 w-4', visual.color)} />
                      })}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 border p-3 mb-3">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">{t.content.replace(/\{booking_link\}/g, bookingLink)}</pre>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copyTemplate(t.content.replace(/\{booking_link\}/g, bookingLink), t.id)}>
                    {copiedTemplate === t.id ? (
                      <><CheckCheck className="h-3.5 w-3.5 mr-1.5 text-green-500" /> Kopyalandı</>
                    ) : (
                      <><Copy className="h-3.5 w-3.5 mr-1.5" /> Şablonu Kopyala</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
