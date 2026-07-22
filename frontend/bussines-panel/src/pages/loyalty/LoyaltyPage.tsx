import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import {
  useLoyaltyOverview, useLoyaltyTiers, useLoyaltyMembers, useCreateLoyaltyMember,
  useLoyaltyRewards, useCreateLoyaltyReward, useToggleLoyaltyReward, useDeleteLoyaltyReward,
  useRedeemReward,
} from '@/hooks/useLoyalty'
import type { LoyaltyTier, LoyaltyMember, LoyaltyReward, LoyaltyRewardCategory } from '@/hooks/useLoyalty'
import {
  Award, Star, Gift, Users, TrendingUp, Plus, Trash2,
  Crown, Zap, Heart, ChevronRight, UserPlus,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PhoneInput } from '@/components/ui/PhoneInput'

const tierIconMap: Record<string, LucideIcon> = { Star, Zap, Crown, Heart }

export function LoyaltyPage() {
  const { data: overview } = useLoyaltyOverview()
  const { data: tiers = [] } = useLoyaltyTiers()
  const { data: memberList } = useLoyaltyMembers({ pageNumber: 1, pageSize: 200 })
  const { data: rewards = [] } = useLoyaltyRewards()
  const members = memberList?.items ?? []

  const createMember = useCreateLoyaltyMember()
  const createReward = useCreateLoyaltyReward()
  const toggleReward = useToggleLoyaltyReward()
  const deleteReward = useDeleteLoyaltyReward()
  const redeemReward = useRedeemReward()

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'rewards' | 'tiers'>('overview')
  const [showAddReward, setShowAddReward] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [deleteRewardId, setDeleteRewardId] = useState<string | null>(null)
  const [rewardForm, setRewardForm] = useState({ name: '', description: '', pointCost: '', category: 'discount' as LoyaltyRewardCategory })
  const [memberForm, setMemberForm] = useState({ name: '', phone: '', points: '' })
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null)
  const [redeemPickerMemberId, setRedeemPickerMemberId] = useState<string | null>(null)
  const [rewardErrors, setRewardErrors] = useState<{ name?: string; pointCost?: string }>({})
  const [memberErrors, setMemberErrors] = useState<{ name?: string; phone?: string }>({})

  function tierOf(tierId: string): LoyaltyTier | undefined {
    return tiers.find((t) => t.id === tierId)
  }

  function handleAddReward() {
    const e: { name?: string; pointCost?: string } = {}
    if (!rewardForm.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    if (!rewardForm.pointCost) e.pointCost = 'Bu bölüm boş bırakılamaz.'
    else if (Number(rewardForm.pointCost) <= 0) e.pointCost = 'Puan sıfırdan büyük olmalı.'
    setRewardErrors(e)
    if (Object.keys(e).length > 0) return
    createReward.mutate({
      name: rewardForm.name,
      description: rewardForm.description,
      pointCost: Number(rewardForm.pointCost),
      category: rewardForm.category,
    })
    setRewardForm({ name: '', description: '', pointCost: '', category: 'discount' })
    setRewardErrors({})
    setShowAddReward(false)
  }

  function handleAddMember() {
    const e: { name?: string; phone?: string } = {}
    if (!memberForm.name.trim()) e.name = 'Bu bölüm boş bırakılamaz.'
    if (!memberForm.phone) e.phone = 'Bu bölüm boş bırakılamaz.'
    else if (!/^\+905\d{9}$/.test(memberForm.phone)) e.phone = 'Telefon formatı: +90 5XX XXX XX XX'
    setMemberErrors(e)
    if (Object.keys(e).length > 0) return
    createMember.mutate({
      name: memberForm.name,
      phone: memberForm.phone,
      startingPoints: Number(memberForm.points) || 0,
    })
    setMemberForm({ name: '', phone: '', points: '' })
    setMemberErrors({})
    setShowAddMember(false)
  }

  const tabs = [
    { id: 'overview', label: 'Genel Bakış' },
    { id: 'members', label: `Üyeler (${members.length})` },
    { id: 'rewards', label: 'Ödüller' },
    { id: 'tiers', label: 'Seviyeler' },
  ] as const

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sadakat Programı"
        description="Puan sistemi ve ödüller ile müşteri bağlılığını artırın"
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
          <Button variant="outline" size="sm" onClick={() => { setActiveTab('members'); setShowAddMember(true) }}>
            <UserPlus className="h-4 w-4 mr-1.5" /> Üye Ekle
          </Button>
          <Button onClick={() => { setActiveTab('rewards'); setShowAddReward(true) }}>
            <Plus className="h-4 w-4 mr-1.5" /> Ödül Ekle
          </Button>
        </div>
      </PageHeader>

      {/* Tabs */}
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

      {/* Overview */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Toplam Üye', value: overview.totalMembers, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Dağıtılan Puan', value: overview.totalPointsDistributed.toLocaleString('tr'), icon: Star, color: 'text-amber-600 bg-amber-50' },
              { label: 'Ort. Puan', value: overview.averagePoints.toLocaleString('tr'), icon: TrendingUp, color: 'text-green-600 bg-green-50' },
              { label: 'Kullanılan Ödül', value: overview.totalRedemptions, icon: Gift, color: 'text-purple-600 bg-purple-50' },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2 rounded-lg', s.color)}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {overview.totalMembers === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Henüz üye yok</p>
                <p className="text-gray-400 text-sm mt-1">Sadakat programına ilk üyenizi ekleyin.</p>
                <Button className="mt-4" onClick={() => { setActiveTab('members'); setShowAddMember(true) }}>
                  <UserPlus className="h-4 w-4 mr-1.5" /> İlk Üyeyi Ekle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-sm">Seviye Dağılımı</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {overview.tierDistribution.map((tc) => {
                    const TierIcon = tierIconMap[tc.iconName] ?? Star
                    return (
                      <div key={tc.tierId} className="flex items-center gap-3">
                        <div className={cn('flex items-center gap-2 rounded-lg border px-3 py-1.5 w-28 shrink-0', tc.color)}>
                          <TierIcon className="h-3.5 w-3.5" />
                          <span className="text-xs font-semibold">{tc.tierName}</span>
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${overview.totalMembers ? (tc.count / overview.totalMembers) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-6 text-right">{tc.count}</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-sm">En Sadık Üyeler</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {overview.topMembers.map((m, idx) => {
                    const tier = tierOf(m.tierId)
                    const TierIcon = tier ? (tierIconMap[tier.iconName] ?? Star) : Star
                    return (
                      <div key={m.memberId} className="flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4">{idx + 1}.</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.visits} ziyaret</p>
                        </div>
                        <div className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', tier?.color)}>
                          <TierIcon className="h-3 w-3" />
                          {m.tierName}
                        </div>
                        <span className="text-sm font-semibold text-gray-800">{m.points.toLocaleString('tr')} p</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Members */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          {showAddMember && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Yeni Üye</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <input value={memberForm.name} onChange={(e) => setMemberForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ad Soyad *" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    {memberErrors.name && <div className="text-xs text-red-500 mt-1">{memberErrors.name}</div>}
                  </div>
                  <div>
                    <PhoneInput value={memberForm.phone} onChange={(v) => setMemberForm((f) => ({ ...f, phone: v }))} />
                    {memberErrors.phone && <div className="text-xs text-red-500 mt-1">{memberErrors.phone}</div>}
                  </div>
                  <input value={memberForm.points} onChange={(e) => setMemberForm((f) => ({ ...f, points: e.target.value }))}
                    placeholder="Başlangıç puanı" type="number" className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddMember}>Ekle</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddMember(false)}>İptal</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {members.length === 0 && !showAddMember ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Üye bulunamadı</p>
                <p className="text-gray-400 text-sm mt-1">Sadakat programına ilk üyenizi ekleyin.</p>
                <Button className="mt-4" onClick={() => setShowAddMember(true)}>
                  <UserPlus className="h-4 w-4 mr-1.5" /> Üye Ekle
                </Button>
              </CardContent>
            </Card>
          ) : members.map((m) => {
            const tier = tierOf(m.tierId)
            const TierIcon = tier ? (tierIconMap[tier.iconName] ?? Star) : Star
            const tierIdx = tiers.findIndex((t) => t.id === m.tierId)
            const nextTier = tierIdx >= 0 ? tiers[tierIdx + 1] : undefined
            const progress = nextTier && tier
              ? Math.round(((m.points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100)
              : 100
            const activeRewards = rewards.filter((r) => r.isActive)
            return (
              <Card key={m.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setSelectedMember(selectedMember?.id === m.id ? null : m)}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-bold text-sm">{m.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                        <div className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', tier?.color)}>
                          <TierIcon className="h-3 w-3" />
                          {tier?.name}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{m.phone} · {m.visits} ziyaret · Son: {m.lastVisit ? new Date(m.lastVisit).toLocaleDateString('tr') : '-'}</p>
                      {nextTier && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-400">{nextTier.minPoints - m.points} p → {nextTier.name}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-gray-900">{m.points.toLocaleString('tr')}</p>
                      <p className="text-xs text-gray-400">puan</p>
                    </div>
                    <ChevronRight className={cn('h-4 w-4 text-gray-400 transition-transform', selectedMember?.id === m.id && 'rotate-90')} />
                  </div>
                  {selectedMember?.id === m.id && (
                    <div className="mt-4 pt-4 border-t space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{m.totalSpent.toLocaleString('tr')} ₺</p>
                          <p className="text-xs text-gray-400">Toplam Harcama</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{m.visits}</p>
                          <p className="text-xs text-gray-400">Ziyaret Sayısı</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{new Date(m.joinedAt).toLocaleDateString('tr')}</p>
                          <p className="text-xs text-gray-400">Katılım Tarihi</p>
                        </div>
                      </div>

                      <div onClick={(e) => e.stopPropagation()}>
                        {redeemPickerMemberId === m.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {activeRewards.length === 0 ? (
                              <span className="text-xs text-gray-400">Aktif ödül yok.</span>
                            ) : activeRewards.map((r) => (
                              <button
                                key={r.id}
                                disabled={m.points < r.pointCost || redeemReward.isPending}
                                onClick={() => {
                                  redeemReward.mutate({ rewardId: r.id, memberId: m.id })
                                  setRedeemPickerMemberId(null)
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {r.name} <span className="text-gray-400">({r.pointCost}p)</span>
                              </button>
                            ))}
                            <button onClick={() => setRedeemPickerMemberId(null)} className="text-xs text-gray-400 hover:text-gray-600">İptal</button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setRedeemPickerMemberId(m.id)}>
                            <Gift className="h-3.5 w-3.5 mr-1.5" /> Ödül Kullan
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Rewards */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          {showAddReward && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Yeni Ödül</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input value={rewardForm.name} onChange={(e) => setRewardForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ödül adı *" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    {rewardErrors.name && <div className="text-xs text-red-500 mt-1">{rewardErrors.name}</div>}
                  </div>
                  <div>
                    <input value={rewardForm.pointCost} onChange={(e) => setRewardForm((f) => ({ ...f, pointCost: e.target.value }))}
                      placeholder="Gereken puan *" type="number" className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                    {rewardErrors.pointCost && <div className="text-xs text-red-500 mt-1">{rewardErrors.pointCost}</div>}
                  </div>
                  <input value={rewardForm.description} onChange={(e) => setRewardForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Açıklama" className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  <select value={rewardForm.category} onChange={(e) => setRewardForm((f) => ({ ...f, category: e.target.value as LoyaltyRewardCategory }))}
                    className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="discount">İndirim</option>
                    <option value="freeService">Ücretsiz Hizmet</option>
                    <option value="gift">Hediye</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddReward}>Ekle</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddReward(false)}>İptal</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {rewards.length === 0 && !showAddReward ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Gift className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Ödül bulunamadı</p>
                <p className="text-gray-400 text-sm mt-1">Müşterileriniz için ödüller oluşturun.</p>
                <Button className="mt-4" onClick={() => setShowAddReward(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Ödül Ekle
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((r: LoyaltyReward) => (
                <Card key={r.id} className={cn(!r.isActive && 'opacity-60')}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleReward.mutate(r.id)}
                          title={r.isActive ? 'Pasif yap' : 'Aktif yap'}
                          className={cn('relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors focus-visible:outline-none', r.isActive ? 'bg-primary' : 'bg-gray-200')}
                        >
                          <span className={cn('absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform', r.isActive ? 'translate-x-4' : 'translate-x-0.5')} />
                        </button>
                        <div className="w-px h-4 bg-gray-200 shrink-0" />
                        <button
                          onClick={() => setDeleteRewardId(r.id)}
                          title="Sil"
                          className="flex items-center justify-center h-6 w-6 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm">{r.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 text-amber-600">
                        <Star className="h-3.5 w-3.5" />
                        <span className="text-sm font-bold">{r.pointCost}</span>
                        <span className="text-xs text-gray-400">puan</span>
                      </div>
                      <span className="text-xs text-gray-400">{r.redeemCount}x kullanıldı</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tiers */}
      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiers.map((tier) => {
            const TierIcon = tierIconMap[tier.iconName] ?? Star
            return (
              <Card key={tier.id}>
                <CardContent className="pt-5">
                  <div className={cn('inline-flex items-center gap-2 rounded-xl border px-4 py-2 mb-4', tier.color)}>
                    <TierIcon className="h-5 w-5" />
                    <span className="font-bold">{tier.name}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    Min. Puan: <span className="font-semibold text-gray-900">{tier.minPoints.toLocaleString('tr')}</span>
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    Puan Çarpanı: <span className="font-semibold text-gray-900">×{tier.multiplier}</span>
                  </p>
                  <div className="space-y-1.5">
                    {tier.benefits.map((b) => (
                      <div key={b} className="flex items-center gap-2 text-sm text-gray-700">
                        <Award className="h-3.5 w-3.5 text-primary shrink-0" />
                        {b}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {deleteRewardId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-semibold mb-2">Ödül silinsin mi?</h3>
            <p className="text-sm text-gray-600 mb-4">Bu ödülü silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteRewardId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button
                onClick={() => {
                  deleteReward.mutate(deleteRewardId)
                  setDeleteRewardId(null)
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
