import { useState, useRef, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { updateSettings } from '@/store/slices/whatsappBotSlice'
import { PageHeader } from '@/components/ui/PageHeader'
import { MobileHeaderActions } from '@/components/ui/MobileHeaderActions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { showToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import {
  useConversations, useConversationMessages, useSendMessage, useResolveConversation, useDeleteConversation,
  useBookingDrafts, useApproveBookingDraft, useRejectBookingDraft,
  type Conversation, type LeadTier, type BookingDraft, type BookingDraftStatus,
} from '@/hooks/useWhatsAppConversations'
import { useWinBackRules, useCreateWinBackRule, useUpdateWinBackRule, useDeleteWinBackRule } from '@/hooks/useWinBackRules'
import { useWhatsAppIntegrationStatus } from '@/hooks/useWhatsAppIntegration'
import { useAiUsage } from '@/hooks/useAiUsage'
import { Link } from 'react-router-dom'
import {
  MessageCircle, Settings2, CalendarCheck, Plus, Trash2,
  RefreshCw, Send, CheckCircle2, XCircle, Bot, Smartphone,
  Clock, Scissors, Phone, Mail, Info, AlertTriangle,
  MessagesSquare, Flame, Snowflake, Sun, Heart, Lock, Loader2, MoreVertical,
} from 'lucide-react'

// ─── WhatsApp Icon ─────────────────────────────────────────────────────────
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

// ─── Booking draft status labels ────────────────────────────────────────────
const draftStatusLabel: Record<BookingDraftStatus, string> = {
  pendingApproval: 'Onay Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
}
const draftStatusColor: Record<BookingDraftStatus, string> = {
  pendingApproval: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
}

// ─── Bot Message bubble ────────────────────────────────────────────────────
type BubbleRole = 'customer' | 'bot' | 'owner'

interface QuickReply { label: string; value: string }

function parseQuickReplies(json?: string | null): QuickReply[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    return Array.isArray(parsed?.quickReplies) ? parsed.quickReplies : []
  } catch {
    return []
  }
}

function ChatBubble({ role, text, quickReplies, onQuickReply }: {
  role: BubbleRole; text: string; quickReplies?: QuickReply[]; onQuickReply?: (value: string) => void
}) {
  const isCustomer = role === 'customer'
  const isOwner = role === 'owner'
  return (
    <div className={cn('flex gap-2 max-w-xs', isCustomer ? 'self-end flex-row-reverse' : 'self-start')}>
      {!isCustomer && (
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isOwner ? 'bg-blue-500' : 'bg-green-500'
        )}>
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div className="space-y-2">
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
            isCustomer
              ? 'bg-green-500 text-white rounded-tr-sm'
              : isOwner
                ? 'bg-blue-50 border border-blue-200 text-blue-900 rounded-tl-sm'
                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
          )}
        >
          {text}
        </div>
        {quickReplies && quickReplies.length > 0 && onQuickReply && (
          <div className="flex flex-wrap gap-1.5">
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => onQuickReply(qr.value)}
                className="rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors shadow-sm"
              >
                {qr.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Simulator Tab ─────────────────────────────────────────────────────────
interface SimMessage { id: string; role: BubbleRole; text: string; extractedDataJson?: string | null }

function randomTestPhone() {
  return `0500${Math.floor(1000000 + Math.random() * 8999999)}`
}

const leadTierMeta: Record<LeadTier, { label: string; className: string; icon: typeof Flame }> = {
  hot: { label: 'Sıcak', className: 'bg-red-50 text-red-700 border-red-200', icon: Flame },
  warm: { label: 'Ilık', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: Sun },
  cold: { label: 'Soğuk', className: 'bg-blue-50 text-blue-700 border-blue-200', icon: Snowflake },
}

function SimulatorTab() {
  const settings = useAppSelector(s => s.whatsappBot.settings)
  const sendMessage = useSendMessage()

  const [testPhone, setTestPhone] = useState(randomTestPhone)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SimMessage[]>([{
    id: 'welcome',
    role: 'bot',
    text: `${settings.welcomeMessage}\n\n*${settings.businessName}*'e hoş geldiniz! Bir mesaj yazarak başlayabilirsiniz.`,
  }])
  const [lastResult, setLastResult] = useState<{ status: string; leadScore: number; leadTier: LeadTier } | null>(null)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleReset() {
    setTestPhone(randomTestPhone())
    setConversationId(null)
    setLastResult(null)
    setMessages([{
      id: 'welcome',
      role: 'bot',
      text: `${settings.welcomeMessage}\n\n*${settings.businessName}*'e hoş geldiniz! Bir mesaj yazarak başlayabilirsiniz.`,
    }])
  }

  function handleSend(overrideText?: string) {
    const text = (overrideText ?? input).trim()
    if (!text || sendMessage.isPending) return
    if (overrideText === undefined) setInput('')
    setMessages(prev => [...prev, { id: `local_${Date.now()}`, role: 'customer', text }])

    sendMessage.mutate({
      conversationId,
      customerPhone: testPhone,
      customerName: 'Test Müşteri',
      text,
      role: 'customer',
      businessName: settings.businessName,
      welcomeMessage: settings.welcomeMessage,
      services: settings.services,
      workingHours: settings.workingSlots.map(s => `${s.day}: ${s.hours}`),
    }, {
      onSuccess: (result) => {
        setConversationId(result.conversationId)
        setLastResult({ status: result.status, leadScore: result.leadScore, leadTier: result.leadTier })
        const botReply = result.newMessages.find(m => m.role === 'bot')
        if (botReply) {
          setMessages(prev => [...prev, { id: botReply.id, role: 'bot', text: botReply.text, extractedDataJson: botReply.extractedDataJson }])
        }
      },
      onError: () => {
        showToast('error', 'Yanıt alınamadı', 'Bot şu anda yanıt veremedi, lütfen tekrar deneyin.')
      },
    })
  }

  const tier = lastResult ? leadTierMeta[lastResult.leadTier] : null

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Phone Frame */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">Claude destekli bot ile serbest metin yazarak test edin — sabit menü yok, ne yazarsanız yanıtlar.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sıfırla
          </Button>
        </div>

        {/* WhatsApp UI */}
        <div className="flex-1 flex flex-col border rounded-2xl overflow-hidden shadow-lg bg-gray-50">
          {/* Header */}
          <div className="bg-green-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-400 flex items-center justify-center">
              <WhatsAppIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{settings.businessName}</p>
              <p className="text-xs text-green-200">WhatsApp Bot • Çevrimiçi</p>
            </div>
          </div>

          {/* Messages */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
            style={{ backgroundImage: 'radial-gradient(#e5ddd5 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          >
            {messages.map((msg, i) => (
              <ChatBubble
                key={msg.id}
                role={msg.role}
                text={msg.text}
                quickReplies={i === messages.length - 1 ? parseQuickReplies(msg.extractedDataJson) : undefined}
                onQuickReply={value => handleSend(value)}
              />
            ))}
            {sendMessage.isPending && (
              <div className="self-start flex items-center gap-2 text-xs text-gray-400 pl-10">
                <RefreshCw className="h-3 w-3 animate-spin" /> yazıyor...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t px-3 py-2 flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Bir mesaj yazın..."
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-green-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || sendMessage.isPending}
              className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center disabled:opacity-40 hover:bg-green-600 transition-colors"
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="w-56 flex-shrink-0 space-y-4">
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bu Konuşma</p>
            {tier ? (
              <>
                <div className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold', tier.className)}>
                  <tier.icon className="h-3.5 w-3.5" />
                  {tier.label} müşteri adayı
                </div>
                <p className="text-xs text-gray-500">Lead skoru: <span className="font-semibold text-gray-700">{lastResult?.leadScore}/100</span></p>
                {lastResult?.status === 'escalated' && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-xs font-medium text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    İnsan devraldı bekliyor
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs text-gray-400">Bir mesaj gönderince burada AI değerlendirmesi görünecek.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">İpucu</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Bot, işletme bilgilerinizin (Ayarlar sekmesi) dışına çıkan bir talep (fiyat pazarlığı, şikayet vb.) gelirse otomatik olarak "İnsan devralsın" durumuna geçer — bu konuşmalar Konuşmalar sekmesinde görünür.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ─── Settings Tab ───────────────────────────────────────────────────────────
function SettingsTab() {
  const dispatch = useAppDispatch()
  const settings = useAppSelector(s => s.whatsappBot.settings)
  const [newService, setNewService] = useState('')
  const [newSlotDay, setNewSlotDay] = useState('')
  const [newSlotHours, setNewSlotHours] = useState('')
  const [newRuleDays, setNewRuleDays] = useState('')
  const [newRuleMessage, setNewRuleMessage] = useState('')
  const { data: winBackRules } = useWinBackRules()
  const createWinBackRule = useCreateWinBackRule()
  const updateWinBackRule = useUpdateWinBackRule()
  const deleteWinBackRule = useDeleteWinBackRule()

  function addWinBackRule() {
    const days = parseInt(newRuleDays, 10)
    if (!days || days <= 0 || !newRuleMessage.trim()) return
    createWinBackRule.mutate({ daysSinceLastVisit: days, messageTemplate: newRuleMessage.trim() })
    setNewRuleDays('')
    setNewRuleMessage('')
  }

  function addService() {
    if (!newService.trim()) return
    dispatch(updateSettings({ services: [...settings.services, newService.trim()] }))
    setNewService('')
  }

  function removeService(idx: number) {
    dispatch(updateSettings({ services: settings.services.filter((_, i) => i !== idx) }))
  }

  function addSlot() {
    if (!newSlotDay.trim() || !newSlotHours.trim()) return
    dispatch(updateSettings({ workingSlots: [...settings.workingSlots, { day: newSlotDay.trim(), hours: newSlotHours.trim() }] }))
    setNewSlotDay('')
    setNewSlotHours('')
  }

  function removeSlot(idx: number) {
    dispatch(updateSettings({ workingSlots: settings.workingSlots.filter((_, i) => i !== idx) }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-green-600" />
            Genel Ayarlar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">WhatsApp Bot</p>
              <p className="text-xs text-gray-500">Botu aktif/pasif yapın</p>
            </div>
            <button
              onClick={() => dispatch(updateSettings({ isEnabled: !settings.isEnabled }))}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                settings.isEnabled ? 'bg-green-500' : 'bg-gray-300'
              )}
            >
              <span className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                settings.isEnabled ? 'translate-x-6' : 'translate-x-1'
              )} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">İşletme Adı</label>
            <input
              value={settings.businessName}
              onChange={e => dispatch(updateSettings({ businessName: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">Karşılama Mesajı</label>
            <textarea
              value={settings.welcomeMessage}
              onChange={e => dispatch(updateSettings({ welcomeMessage: e.target.value }))}
              rows={3}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-400 resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">WhatsApp Numarası</label>
            <div className="mt-1">
              <PhoneInput value={settings.phoneNumber} onChange={(v) => dispatch(updateSettings({ phoneNumber: v }))} />
            </div>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
            <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Gerçek WhatsApp entegrasyonu için Meta Business API veya Twilio hesabı gereklidir. Şu an simülasyon modundadır.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600" />
            Çalışma Günleri & Saatleri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {settings.workingSlots.map((slot, idx) => (
              <div key={idx} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                <span className="text-xs font-medium text-gray-700 w-24 shrink-0">{slot.day}</span>
                <span className="text-xs text-gray-500 flex-1">{slot.hours}</span>
                <button onClick={() => removeSlot(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              value={newSlotDay}
              onChange={e => setNewSlotDay(e.target.value)}
              placeholder="Gün (örn: Pazartesi)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-green-400"
            />
            <input
              value={newSlotHours}
              onChange={e => setNewSlotHours(e.target.value)}
              placeholder="Saat (09:00 – 18:00)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-green-400"
            />
            <button
              onClick={addSlot}
              className="rounded-lg bg-green-500 px-3 text-white hover:bg-green-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Scissors className="h-4 w-4 text-green-600" />
            Hizmetler (Bot'ta listelenecek)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {settings.services.map((svc, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-medium text-green-700"
              >
                {svc}
                <button onClick={() => removeService(idx)} className="hover:text-red-600">
                  <XCircle className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newService}
              onChange={e => setNewService(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addService()}
              placeholder="Yeni hizmet ekle..."
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-400"
            />
            <Button size="sm" onClick={addService} className="gap-1.5 bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4" />
              Ekle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Win-back rules */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-green-600" />
            Otomatik Geri Kazanım Mesajları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500">
            Belirli bir süre randevu almayan müşterilere otomatik olarak SMS/e-posta ile hatırlatma gönderilir. Mesajınızda <code className="rounded bg-gray-100 px-1">{'{customerName}'}</code> yazarsanız müşteri adıyla değiştirilir.
          </p>
          <div className="space-y-2">
            {(winBackRules ?? []).map((rule) => (
              <div key={rule.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
                <span className="shrink-0 rounded-full bg-white border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {rule.daysSinceLastVisit} gün
                </span>
                <span className="flex-1 truncate text-xs text-gray-600">{rule.messageTemplate}</span>
                <button
                  onClick={() => updateWinBackRule.mutate({ id: rule.id, daysSinceLastVisit: rule.daysSinceLastVisit, messageTemplate: rule.messageTemplate, isActive: !rule.isActive })}
                  className={cn(
                    'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
                    rule.isActive ? 'bg-green-500' : 'bg-gray-300'
                  )}
                  title={rule.isActive ? 'Aktif' : 'Pasif'}
                >
                  <span className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform',
                    rule.isActive ? 'translate-x-4' : 'translate-x-1'
                  )} />
                </button>
                <button onClick={() => deleteWinBackRule.mutate(rule.id)} className="shrink-0 text-red-400 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {(winBackRules ?? []).length === 0 && (
              <p className="text-xs text-gray-400 py-2">Henüz bir kural eklenmedi.</p>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            <input
              value={newRuleDays}
              onChange={e => setNewRuleDays(e.target.value.replace(/\D/g, ''))}
              placeholder="Gün (örn: 30)"
              className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-green-400"
            />
            <input
              value={newRuleMessage}
              onChange={e => setNewRuleMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addWinBackRule()}
              placeholder="Mesaj (örn: Merhaba {customerName}, sizi özledik!)"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs outline-none focus:border-green-400"
            />
            <button
              onClick={addWinBackRule}
              disabled={createWinBackRule.isPending}
              className="rounded-lg bg-green-500 px-3 text-white hover:bg-green-600 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* AI usage */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Bot className="h-4 w-4 text-green-600" />
            AI Kullanımı
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AiUsageCard />
        </CardContent>
      </Card>
    </div>
  )
}

function AiUsageCard() {
  const { data: usage } = useAiUsage()
  if (!usage) return <p className="text-xs text-gray-400">Yükleniyor...</p>

  const pct = Math.min(100, Math.round((usage.messageCount / usage.freeLimit) * 100))
  const exhausted = usage.messageCount >= usage.freeLimit

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Bu ay {usage.messageCount}/{usage.freeLimit} AI mesajı kullanıldı</span>
        <span className="text-xs text-gray-400">≈ ${usage.estimatedCostUsd.toFixed(2)}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100">
        <div
          className={cn('h-2 rounded-full transition-all', exhausted ? 'bg-red-500' : 'bg-green-500')}
          style={{ width: `${pct}%` }}
        />
      </div>
      {exhausted && (
        <p className="text-xs text-amber-600">
          Ücretsiz AI kotanız doldu — yeni mesajlar, gerçek hizmet ve müsaitlik verilerinizi kullanan otomatik randevu akışıyla yanıtlanıyor.
        </p>
      )}
    </div>
  )
}

// ─── Appointments Tab (WhatsApp booking drafts awaiting owner approval) ────
function AppointmentsTab() {
  const [filter, setFilter] = useState<'all' | BookingDraftStatus>('all')
  const [actingId, setActingId] = useState<string | null>(null)
  const { data, isLoading } = useBookingDrafts({ pageSize: 100, status: filter === 'all' ? undefined : filter })
  const approveDraft = useApproveBookingDraft()
  const rejectDraft = useRejectBookingDraft()

  const drafts = data?.items ?? []

  const counts = {
    all: data?.totalCount ?? drafts.length,
    pendingApproval: drafts.filter(d => d.status === 'pendingApproval').length,
    approved: drafts.filter(d => d.status === 'approved').length,
    rejected: drafts.filter(d => d.status === 'rejected').length,
  }

  async function handleApprove(draft: BookingDraft) {
    setActingId(draft.id)
    try {
      await approveDraft.mutateAsync(draft.id)
      showToast('success', 'Randevu onaylandı', `${draft.serviceName} için randevu oluşturuldu — Randevular ve Takvim sayfalarında görünür.`)
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { message?: string; detail?: string } } }
      showToast(
        'error',
        anyErr?.response?.status === 409 ? 'Saat dolu' : 'Randevu onaylanamadı',
        anyErr?.response?.data?.message ?? anyErr?.response?.data?.detail ?? 'Lütfen tekrar deneyin.'
      )
    } finally {
      setActingId(null)
    }
  }

  async function handleReject(draft: BookingDraft) {
    setActingId(draft.id)
    try {
      await rejectDraft.mutateAsync({ id: draft.id })
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Toplam', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
          { key: 'pendingApproval', label: 'Onay Bekliyor', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { key: 'approved', label: 'Onaylandı', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { key: 'rejected', label: 'Reddedildi', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as typeof filter)}
            className={cn(
              'rounded-xl border p-3 text-left transition-all',
              item.bg,
              filter === item.key ? 'ring-2 ring-offset-1 ring-green-400' : 'hover:opacity-80'
            )}
          >
            <p className={cn('text-2xl font-bold', item.color)}>{counts[item.key as keyof typeof counts]}</p>
            <p className={cn('text-xs', item.color)}>{item.label}</p>
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-300" />
        </div>
      ) : drafts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <MessageCircle className="h-10 w-10" />
          <p className="text-sm">Henüz WhatsApp randevu talebi yok</p>
          <p className="text-xs text-gray-400">Simülatör sekmesinden test randevusu oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map(draft => (
            <Card key={draft.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <WhatsAppIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{draft.customerName}</span>
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', draftStatusColor[draft.status])}>
                        {draftStatusLabel[draft.status]}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {new Date(draft.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <DetailItem icon={<Phone className="h-3.5 w-3.5" />} label={draft.customerPhone} />
                      <DetailItem icon={<Mail className="h-3.5 w-3.5" />} label={draft.customerEmail || '—'} />
                      <DetailItem icon={<CalendarCheck className="h-3.5 w-3.5" />} label={`${draft.date} ${draft.time.slice(0, 5)}`} />
                      <DetailItem icon={<Scissors className="h-3.5 w-3.5" />} label={draft.serviceName} />
                    </div>
                    {draft.createdAppointmentId && (
                      <p className="text-[11px] text-emerald-600">✓ Randevular &amp; Takvim sayfalarına kaydedildi</p>
                    )}
                  </div>
                  {draft.status === 'pendingApproval' && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(draft)}
                        disabled={actingId === draft.id}
                        title="Onayla ve sisteme kaydet"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {actingId === draft.id
                          ? <RefreshCw className="h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleReject(draft)}
                        disabled={actingId === draft.id}
                        title="Reddet"
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function DetailItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 min-w-0">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  )
}

// ─── Conversations Tab ──────────────────────────────────────────────────────
function ConversationRow({ conv, active, onClick, onRequestDelete }: {
  conv: Conversation; active: boolean; onClick: () => void; onRequestDelete: () => void
}) {
  const tier = leadTierMeta[conv.leadTier]
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative w-full cursor-pointer rounded-xl border p-3 transition-colors',
        active ? 'border-green-300 bg-green-50/50' : 'border-gray-100 bg-white hover:border-gray-200'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-gray-900 truncate">{conv.customerName || conv.customerPhone}</span>
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn('flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold', tier.className)}>
            <tier.icon className="h-2.5 w-2.5" />
            {tier.label}
          </span>
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o) }}
            className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Konuşma seçenekleri"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-gray-500 truncate">{conv.lastMessagePreview || '—'}</p>
      {conv.status === 'escalated' && (
        <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-700">
          <AlertTriangle className="h-3 w-3" /> İnsan devralması bekleniyor
        </div>
      )}
      {menuOpen && (
        <div
          onClick={e => e.stopPropagation()}
          className="absolute right-2 top-9 z-10 w-32 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
        >
          <button
            onClick={() => { setMenuOpen(false); onRequestDelete() }}
            className="flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Sil
          </button>
        </div>
      )}
    </div>
  )
}

function ConversationsTab() {
  const settings = useAppSelector(s => s.whatsappBot.settings)
  const [statusFilter, setStatusFilter] = useState<'all' | 'escalated'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [ownerReply, setOwnerReply] = useState('')
  const [deleteConversationId, setDeleteConversationId] = useState<string | null>(null)

  const { data, isLoading } = useConversations({
    pageSize: 50,
    status: statusFilter === 'escalated' ? 'escalated' : undefined,
  })
  const { data: messages } = useConversationMessages(selectedId)
  const sendMessage = useSendMessage()
  const resolveConversation = useResolveConversation()
  const deleteConversation = useDeleteConversation()

  const conversations = data?.items ?? []
  const selected = conversations.find(c => c.id === selectedId) ?? null

  function handleOwnerReply() {
    const text = ownerReply.trim()
    if (!text || !selected || sendMessage.isPending) return
    setOwnerReply('')
    sendMessage.mutate({
      conversationId: selected.id,
      customerPhone: selected.customerPhone,
      customerName: selected.customerName,
      text,
      role: 'owner',
      businessName: settings.businessName,
      welcomeMessage: settings.welcomeMessage,
      services: settings.services,
      workingHours: settings.workingSlots.map(s => `${s.day}: ${s.hours}`),
    })
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr] h-[600px]">
      {/* List */}
      <div className="flex flex-col gap-3 overflow-hidden">
        <div className="flex gap-1.5">
          {(['all', 'escalated'] as const).map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium border transition-colors',
                statusFilter === f ? 'bg-green-500 text-white border-green-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'
              )}
            >
              {f === 'all' ? 'Tümü' : 'İnsan bekleyenler'}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-5 w-5 animate-spin text-gray-300" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
              <MessagesSquare className="h-8 w-8" />
              <p className="text-sm">Henüz konuşma yok</p>
            </div>
          ) : (
            conversations.map(conv => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                active={conv.id === selectedId}
                onClick={() => setSelectedId(conv.id)}
                onRequestDelete={() => setDeleteConversationId(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Thread */}
      <div className="flex flex-col border rounded-2xl overflow-hidden shadow-sm bg-gray-50">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-400">
            <MessagesSquare className="h-8 w-8" />
            <p className="text-sm">Bir konuşma seçin</p>
          </div>
        ) : (
          <>
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{selected.customerName || selected.customerPhone}</p>
                <p className="text-xs text-gray-400">{selected.customerPhone}</p>
              </div>
              {selected.status === 'escalated' && (
                <Button size="sm" onClick={() => resolveConversation.mutate(selected.id)} className="gap-1.5 text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Çözüldü
                </Button>
              )}
            </div>
            <div
              className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
              style={{ backgroundImage: 'radial-gradient(#e5ddd5 1px, transparent 1px)', backgroundSize: '20px 20px' }}
            >
              {(messages ?? []).map(m => (
                <ChatBubble key={m.id} role={m.role} text={m.text} />
              ))}
            </div>
            <div className="bg-white border-t px-3 py-2 flex items-center gap-2">
              <input
                value={ownerReply}
                onChange={e => setOwnerReply(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOwnerReply()}
                placeholder="İşletme sahibi olarak yanıtla..."
                className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-blue-400"
              />
              <button
                onClick={handleOwnerReply}
                disabled={!ownerReply.trim() || sendMessage.isPending}
                className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center disabled:opacity-40 hover:bg-blue-600 transition-colors"
              >
                <Send className="h-4 w-4 text-white" />
              </button>
            </div>
          </>
        )}
      </div>

      {deleteConversationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold mb-2">Konuşma silinsin mi?</h3>
            <p className="text-sm text-gray-600 mb-4">Bu konuşma ve tüm mesajları kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConversationId(null)} className="px-4 py-2 border rounded-lg text-sm">İptal</button>
              <button
                onClick={() => {
                  deleteConversation.mutate(deleteConversationId, {
                    onSuccess: () => {
                      if (selectedId === deleteConversationId) setSelectedId(null)
                    },
                  })
                  setDeleteConversationId(null)
                }}
                disabled={deleteConversation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
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

// ─── Main Page ──────────────────────────────────────────────────────────────
type Tab = 'settings' | 'simulator' | 'appointments' | 'conversations'

export function WhatsAppBotPage() {
  const [tab, setTab] = useState<Tab>(() => {
    const param = new URLSearchParams(window.location.search).get('tab')
    return param === 'appointments' || param === 'settings' || param === 'simulator' ? param : 'conversations'
  })
  const isEnabled = useAppSelector(s => s.whatsappBot.settings.isEnabled)
  const { data: pendingDrafts } = useBookingDrafts({ status: 'pendingApproval', pageSize: 1 })
  const pendingCount = pendingDrafts?.totalCount ?? 0
  const { data: escalatedData } = useConversations({ status: 'escalated', pageSize: 1 })
  const escalatedCount = escalatedData?.totalCount ?? 0
  const { data: waStatus, isLoading: waLoading } = useWhatsAppIntegrationStatus()

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'simulator', label: 'Konuşma Simülatörü', icon: <Smartphone className="h-4 w-4" /> },
    { id: 'conversations', label: 'Konuşmalar', icon: <MessagesSquare className="h-4 w-4" /> },
    { id: 'appointments', label: 'WhatsApp Randevuları', icon: <CalendarCheck className="h-4 w-4" /> },
    { id: 'settings', label: 'Bot Ayarları', icon: <Settings2 className="h-4 w-4" /> },
  ]

  if (waLoading) {
    return (
      <div className="flex items-center justify-center p-16">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!waStatus?.isConnected && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Lock className="h-5 w-5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Test Modu — WhatsApp Business henüz bağlı değil</p>
            <p className="text-xs text-amber-700">
              Gerçek müşteri mesajları alınmıyor, ama Konuşma Simülatörü ile botu (AI ve otomasyon dahil) uçtan uca test edebilirsiniz.
            </p>
          </div>
          <Link to="/settings/integrations">
            <Button size="sm" variant="outline" className="shrink-0 border-amber-300 bg-white text-amber-700 hover:bg-amber-100">
              Bağlantı Kur
            </Button>
          </Link>
        </div>
      )}
      <PageHeader
        title="WhatsApp Bot"
        description="Müşterileriniz WhatsApp'tan otomatik randevu alabilsin."
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border',
            isEnabled
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          )}>
            <div className={cn('w-2 h-2 rounded-full', isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400')} />
            {isEnabled ? 'Bot Aktif' : 'Bot Pasif'}
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-medium text-amber-700">
              {pendingCount} onay bekleyen randevu talebi
            </div>
          )}
          {escalatedCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1 text-xs font-medium text-red-700">
              <AlertTriangle className="h-3.5 w-3.5" />
              {escalatedCount} kişi insana devredildi
            </div>
          )}
        </div>
      </PageHeader>

      {/* Tabs — full bar on desktop, current tab + kebab switcher on mobile */}
      <div className="flex items-center justify-between lg:hidden">
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          {tabs.find(x => x.id === tab)?.icon}
          {tabs.find(x => x.id === tab)?.label}
        </span>
        <MobileHeaderActions
          actions={tabs.map(t => ({ label: t.label, icon: t.icon, onClick: () => setTab(t.id) }))}
        />
      </div>
      <div className="hidden gap-1 border-b lg:flex">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-green-500 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            {t.icon}
            {t.label}
            {t.id === 'appointments' && pendingCount > 0 && (
              <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
                {pendingCount}
              </span>
            )}
            {t.id === 'conversations' && escalatedCount > 0 && (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white leading-none">
                {escalatedCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'simulator' && <SimulatorTab />}
      {tab === 'conversations' && <ConversationsTab />}
      {tab === 'appointments' && <AppointmentsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}
