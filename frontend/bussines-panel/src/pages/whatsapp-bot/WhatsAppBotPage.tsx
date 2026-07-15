import { useState, useRef, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import {
  updateSettings, resetSimulator, addSimMessage,
  setSimStep, updateSimDraft, confirmSimAppointment,
  updateAppointmentStatus, deleteAppointment,
  type ChatMessage, type BotStep,
} from '@/store/slices/whatsappBotSlice'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PhoneInput } from '@/components/ui/PhoneInput'
import { showToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useServices } from '@/hooks/useServices'
import { useEmployees } from '@/hooks/useEmployees'
import type { WhatsAppAppointment } from '@/store/slices/whatsappBotSlice'
import {
  MessageCircle, Settings2, CalendarCheck, Plus, Trash2,
  RefreshCw, Send, CheckCircle2, XCircle, Bot, Smartphone,
  Clock, Scissors, Phone, Mail, MapPin, Info,
} from 'lucide-react'

// ─── WhatsApp Icon ─────────────────────────────────────────────────────────
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

// ─── Status Labels ──────────────────────────────────────────────────────────
const statusLabel: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  cancelled: 'İptal',
}
const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

// ─── Bot Message bubble ────────────────────────────────────────────────────
function ChatBubble({ msg, onQuickReply }: { msg: ChatMessage; onQuickReply?: (r: string) => void }) {
  const isBot = msg.role === 'bot'
  return (
    <div className={cn('flex gap-2 max-w-xs', isBot ? 'self-start' : 'self-end flex-row-reverse')}>
      {isBot && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}
      <div className="space-y-2">
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap',
            isBot
              ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
              : 'bg-green-500 text-white rounded-tr-sm'
          )}
        >
          {msg.text}
        </div>
        {isBot && msg.quickReplies && (
          <div className="flex flex-col gap-1.5">
            {msg.quickReplies.map(r => (
              <button
                key={r}
                onClick={() => onQuickReply?.(r)}
                className="rounded-full border border-green-500 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors text-left"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Simulator Tab ─────────────────────────────────────────────────────────
function SimulatorTab() {
  const dispatch = useAppDispatch()
  const { settings, simMessages, simStep, simDraft } = useAppSelector(s => s.whatsappBot)
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [simMessages])

  function botMsg(text: string, quickReplies?: string[]): ChatMessage {
    return { id: `bot_${Date.now()}`, role: 'bot', text, timestamp: new Date().toISOString(), quickReplies }
  }
  function userMsg(text: string): ChatMessage {
    return { id: `user_${Date.now()}`, role: 'user', text, timestamp: new Date().toISOString() }
  }

  function handleQuickReply(reply: string) {
    dispatch(addSimMessage(userMsg(reply)))
    processReply(reply, simStep)
  }

  function handleSend() {
    const txt = input.trim()
    if (!txt) return
    setInput('')
    dispatch(addSimMessage(userMsg(txt)))
    processInput(txt, simStep)
  }

  function processReply(reply: string, step: BotStep) {
    setTimeout(() => {
      if (step === 'welcome') {
        const low = reply.toLowerCase()
        if (reply.includes('Randevu') || low.includes('randevu') || reply.startsWith('1')) {
          const serviceList = settings.services.map((s, i) => `${i + 1}. ${s}`).join('\n')
          dispatch(addSimMessage(botMsg(
            `Harika! Öncelikle hangi hizmeti almak istersiniz?\n\n${serviceList}`,
            settings.services.map(s => `✂️ ${s}`)
          )))
          dispatch(setSimStep('select_service'))
        } else if (reply.includes('Çalışma') || low.includes('çalışma') || low.includes('saat') || reply.startsWith('2')) {
          const slotList = settings.workingSlots
            .map(s => `• ${s.day}: ${s.hours}`)
            .join('\n')
          dispatch(addSimMessage(botMsg(
            `Çalışma saatlerimiz:\n\n${slotList}\n\nBaşka bir konuda yardımcı olabilir miyim?`,
            ['📅 Randevu almak istiyorum', '✂️ Hizmetler neler?']
          )))
          dispatch(setSimStep('welcome'))
        } else if (reply.includes('Hizmet') || low.includes('hizmet') || reply.startsWith('3')) {
          const serviceList = settings.services.map(s => `• ${s}`).join('\n')
          dispatch(addSimMessage(botMsg(
            `Sunduğumuz hizmetler:\n\n${serviceList}\n\nBaşka bir konuda yardımcı olabilir miyim?`,
            ['📅 Randevu almak istiyorum', '🕐 Çalışma saatlerini öğrenmek istiyorum']
          )))
          dispatch(setSimStep('welcome'))
        }
      } else if (step === 'select_service') {
        const serviceName = reply.replace('✂️ ', '').trim()
        const matched = settings.services.find(s => s.toLowerCase() === serviceName.toLowerCase())
          ?? settings.services.find(s => serviceName.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(serviceName.toLowerCase()))
        if (matched) {
          dispatch(updateSimDraft({ selectedService: matched }))
          const slotList = settings.workingSlots
            .map((s, i) => `${i + 1}. ${s.day}: ${s.hours}`)
            .join('\n')
          dispatch(addSimMessage(botMsg(
            `*${matched}* için uygun günlerimiz:\n\n${slotList}\n\nHangi güne randevu almak istersiniz?`,
            settings.workingSlots.map(s => `📅 ${s.day}`)
          )))
          dispatch(setSimStep('select_slot'))
        } else {
          dispatch(addSimMessage(botMsg(
            'Bu hizmeti bulamadım. Lütfen aşağıdaki seçeneklerden birini seçiniz:',
            settings.services.map(s => `✂️ ${s}`)
          )))
        }
      } else if (step === 'select_slot') {
        const dayName = reply.replace('📅 ', '')
        const slot = settings.workingSlots.find(s => s.day === dayName)
        if (slot) {
          dispatch(updateSimDraft({ selectedSlot: `${slot.day} ${slot.hours}` }))
          dispatch(addSimMessage(botMsg(
            `${slot.day} günü ${slot.hours} saatleri arasında randevunuzu ayarlayabiliriz.\n\nLütfen adınızı ve soyadınızı yazınız:`
          )))
          dispatch(setSimStep('ask_name'))
        }
      }
    }, 600)
  }

  function processInput(text: string, step: BotStep) {
    setTimeout(() => {
      if (step === 'welcome' || step === 'select_option') {
        // Route typed text through the same option logic as quick replies
        processReply(text, 'welcome')
      } else if (step === 'select_service' || step === 'select_slot') {
        processReply(text, step)
      } else if (step === 'ask_name') {
        dispatch(updateSimDraft({ customerName: text }))
        dispatch(addSimMessage(botMsg('Telefon numaranızı paylaşır mısınız? (örn: 05XX XXX XX XX)')))
        dispatch(setSimStep('ask_phone'))
      } else if (step === 'ask_phone') {
        dispatch(updateSimDraft({ customerPhone: text }))
        dispatch(addSimMessage(botMsg('Hangi şehirde bulunuyorsunuz?')))
        dispatch(setSimStep('ask_city'))
      } else if (step === 'ask_city') {
        dispatch(updateSimDraft({ customerCity: text }))
        dispatch(addSimMessage(botMsg('Gmail adresinizi paylaşır mısınız? (onay maili gönderilecek)')))
        dispatch(setSimStep('ask_email'))
      } else if (step === 'ask_email') {
        const updatedDraft = { ...simDraft, customerEmail: text }
        dispatch(updateSimDraft({ customerEmail: text }))
        dispatch(addSimMessage(botMsg(
          `✅ *Randevunuz başarıyla alınmıştır!*\n\n` +
          `👤 Ad Soyad: ${updatedDraft.customerName}\n` +
          `📞 Telefon: ${updatedDraft.customerPhone}\n` +
          `🏙️ Şehir: ${updatedDraft.customerCity}\n` +
          `📧 E-posta: ${text}\n` +
          `✂️ Hizmet: ${updatedDraft.selectedService || '—'}\n` +
          `📅 Tarih: ${updatedDraft.selectedSlot}\n\n` +
          `Randevunuzu hatırlatmak için size e-posta göndereceğiz. Görüşürüz! 🙏`,
          ['📅 Yeni randevu almak istiyorum']
        )))
        dispatch(confirmSimAppointment())
        dispatch(setSimStep('confirmed'))
      }
    }, 600)
  }

  return (
    <div className="flex gap-6 h-[600px]">
      {/* Phone Frame */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">WhatsApp konuşma simülasyonu — botun müşteri ile nasıl iletişim kurduğunu görmek için aşağıdaki seçeneklere tıklayın.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch(resetSimulator())}
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
            {simMessages.map(msg => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                onQuickReply={handleQuickReply}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="bg-white border-t px-3 py-2 flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={
                simStep === 'select_service' ? 'Hizmet adını yazın...' :
                simStep === 'ask_name' ? 'Adınızı ve soyadınızı yazın...' :
                simStep === 'ask_phone' ? 'Telefon numaranızı yazın...' :
                simStep === 'ask_city' ? 'Şehrinizi yazın...' :
                simStep === 'ask_email' ? 'Gmail adresinizi yazın...' :
                'Bir mesaj yazın...'
              }
              className="flex-1 rounded-full border border-gray-200 px-4 py-2 text-sm outline-none focus:border-green-400"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
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
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bot Akışı</p>
            {[
              { step: 'welcome', label: '1. Karşılama & Seçenekler' },
              { step: 'select_service', label: '2. Hizmet Seçimi' },
              { step: 'select_slot', label: '3. Gün Seçimi' },
              { step: 'ask_name', label: '4. Ad Soyad' },
              { step: 'ask_phone', label: '5. Telefon' },
              { step: 'ask_city', label: '6. Şehir' },
              { step: 'ask_email', label: '7. Gmail' },
              { step: 'confirmed', label: '8. Onay' },
            ].map(item => (
              <div
                key={item.step}
                className={cn(
                  'flex items-center gap-2 text-xs rounded-lg px-2 py-1.5',
                  simStep === item.step
                    ? 'bg-green-50 text-green-700 font-semibold'
                    : 'text-gray-500'
                )}
              >
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  simStep === item.step ? 'bg-green-500' : 'bg-gray-300'
                )} />
                {item.label}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">İpucu</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Simülatörde hızlı yanıt butonlarına tıklayarak veya alt kısma yazarak bot akışını test edebilirsiniz.
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
    </div>
  )
}

// ─── Sync helpers: turn a WhatsApp booking into a real customer + appointment ─

const TR_DAY_INDEX: Record<string, number> = {
  'pazar': 0, 'pazartesi': 1, 'salı': 2, 'sali': 2, 'çarşamba': 3, 'carsamba': 3,
  'perşembe': 4, 'persembe': 4, 'cuma': 5, 'cumartesi': 6,
}

/** "Pazartesi 09:00 – 18:00" → next occurrence of that weekday at the slot's
 *  start hour. Falls back to tomorrow 09:00 when the slot can't be parsed. */
function slotToDate(selectedSlot: string): Date {
  const now = new Date()
  const lower = selectedSlot.toLowerCase()
  // Longest names first: "pazartesi" must not match its prefix "pazar",
  // and "cumartesi" must not match "cuma".
  const dayEntry = Object.entries(TR_DAY_INDEX)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([name]) => lower.includes(name))
  const timeMatch = selectedSlot.match(/(\d{1,2}):(\d{2})/)
  const hour = timeMatch ? parseInt(timeMatch[1]) : 9
  const minute = timeMatch ? parseInt(timeMatch[2]) : 0

  const result = new Date(now)
  result.setHours(hour, minute, 0, 0)
  if (dayEntry) {
    const target = dayEntry[1]
    let diff = (target - now.getDay() + 7) % 7
    if (diff === 0 && result <= now) diff = 7
    result.setDate(now.getDate() + diff)
  } else if (result <= now) {
    result.setDate(now.getDate() + 1)
  }
  return result
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ─── Appointments Tab ───────────────────────────────────────────────────────
function AppointmentsTab() {
  const dispatch = useAppDispatch()
  const qc = useQueryClient()
  const appointments = useAppSelector(s => s.whatsappBot.appointments)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')
  const [approving, setApproving] = useState<string | null>(null)
  const { data: svcData } = useServices({ pageNumber: 1, pageSize: 100 })
  const { data: empData } = useEmployees({ pageNumber: 1, pageSize: 100 })

  /** Approve = create the real appointment via the booking API (the backend
   *  finds or creates the customer by phone itself), so the booking shows up
   *  in Randevular, Takvim and Müşteriler — then mark the WhatsApp card confirmed. */
  async function approveAppointment(apt: WhatsAppAppointment) {
    const services = svcData?.items ?? []
    const employees = (empData?.items ?? []).filter(e => e.isActive)

    const service =
      services.find(s => s.name.toLowerCase().trim() === apt.selectedService.toLowerCase().trim()) ??
      services.find(s => s.isActive) ?? services[0]
    if (!service) {
      showToast('error', 'Hizmet bulunamadı', 'Randevuyu aktarabilmek için önce Hizmetler sayfasından bir hizmet ekleyin.')
      return
    }

    // Prefer an employee who offers this service; the backend can also
    // auto-assign (or create the owner employee) when null is sent.
    const employee = employees.find(e => e.serviceIds.includes(service.id)) ?? employees[0] ?? null

    setApproving(apt.id)
    try {
      const d = slotToDate(apt.selectedSlot)
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

      const nameParts = apt.customerName.trim().split(/\s+/)
      const firstName = nameParts[0] || 'Müşteri'
      const lastName = nameParts.slice(1).join(' ') || '-'
      const phone = apt.customerPhone.replace(/[\s-]/g, '')
      // Email is required by the booking API — fall back to a per-customer
      // placeholder when the bot collected an invalid/missing address.
      const email = EMAIL_RE.test(apt.customerEmail.trim())
        ? apt.customerEmail.trim()
        : `wa${phone.replace(/\D/g, '') || Date.now()}@nextbooking.app`

      const { data: created } = await api.post<{ id: string }>('/appointments', {
        serviceId: service.id,
        employeeId: employee?.id ?? null,
        date,
        time,
        firstName,
        lastName,
        phone,
        email,
        city: apt.customerCity || null,
        notes: `WhatsApp bot randevusu · ${apt.selectedService || service.name} · ${apt.selectedSlot}`,
        source: 'whatsapp',
      })

      qc.invalidateQueries({ queryKey: ['appointments'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] })

      dispatch(updateAppointmentStatus({ id: apt.id, status: 'confirmed', syncedAppointmentId: created?.id }))
      showToast('success', 'Randevu onaylandı', `${date} ${time} için randevu oluşturuldu — Randevular ve Takvim sayfalarında görünür.`)
    } catch (err: unknown) {
      const anyErr = err as { response?: { status?: number; data?: { message?: string; detail?: string; errors?: Record<string, string[]> } } }
      const valErrors = anyErr?.response?.data?.errors
      const firstValError = valErrors ? Object.values(valErrors).flat()[0] : undefined
      showToast(
        'error',
        anyErr?.response?.status === 409 ? 'Saat dolu' : 'Randevu aktarılamadı',
        firstValError ?? anyErr?.response?.data?.message ?? anyErr?.response?.data?.detail ?? 'Lütfen tekrar deneyin.'
      )
    } finally {
      setApproving(null)
    }
  }

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter)

  const counts = {
    all: appointments.length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'all', label: 'Toplam', color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
          { key: 'pending', label: 'Beklemede', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
          { key: 'confirmed', label: 'Onaylandı', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
          { key: 'cancelled', label: 'İptal', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
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
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
          <MessageCircle className="h-10 w-10" />
          <p className="text-sm">Henüz WhatsApp randevusu yok</p>
          <p className="text-xs text-gray-400">Simülatör sekmesinden test randevusu oluşturabilirsiniz.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(apt => (
            <Card key={apt.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <WhatsAppIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">{apt.customerName}</span>
                      <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium', statusColor[apt.status])}>
                        {statusLabel[apt.status]}
                      </span>
                      <span className="ml-auto text-xs text-gray-400">
                        {new Date(apt.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <DetailItem icon={<Phone className="h-3.5 w-3.5" />} label={apt.customerPhone} />
                      <DetailItem icon={<MapPin className="h-3.5 w-3.5" />} label={apt.customerCity || '—'} />
                      <DetailItem icon={<Mail className="h-3.5 w-3.5" />} label={apt.customerEmail || '—'} />
                      <DetailItem icon={<CalendarCheck className="h-3.5 w-3.5" />} label={apt.selectedSlot || '—'} />
                      <DetailItem icon={<Scissors className="h-3.5 w-3.5" />} label={apt.selectedService || '—'} />
                    </div>
                    {apt.syncedAppointmentId && (
                      <p className="text-[11px] text-emerald-600">✓ Randevular &amp; Takvim sayfalarına kaydedildi</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {apt.status === 'pending' && (
                      <button
                        onClick={() => approveAppointment(apt)}
                        disabled={approving === apt.id}
                        title="Onayla ve sisteme kaydet"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {approving === apt.id
                          ? <RefreshCw className="h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="h-4 w-4" />}
                      </button>
                    )}
                    {apt.status !== 'cancelled' && (
                      <button
                        onClick={() => dispatch(updateAppointmentStatus({ id: apt.id, status: 'cancelled' }))}
                        title="İptal Et"
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => dispatch(deleteAppointment(apt.id))}
                      title="Sil"
                      className="rounded-lg border border-gray-200 bg-gray-50 p-1.5 text-gray-500 hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
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

// ─── Main Page ──────────────────────────────────────────────────────────────
type Tab = 'settings' | 'simulator' | 'appointments'

export function WhatsAppBotPage() {
  const [tab, setTab] = useState<Tab>(() => {
    const param = new URLSearchParams(window.location.search).get('tab')
    return param === 'appointments' || param === 'settings' ? param : 'simulator'
  })
  const isEnabled = useAppSelector(s => s.whatsappBot.settings.isEnabled)
  const pendingCount = useAppSelector(s => s.whatsappBot.appointments.filter(a => a.status === 'pending').length)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'simulator', label: 'Konuşma Simülatörü', icon: <Smartphone className="h-4 w-4" /> },
    { id: 'appointments', label: 'WhatsApp Randevuları', icon: <CalendarCheck className="h-4 w-4" /> },
    { id: 'settings', label: 'Bot Ayarları', icon: <Settings2 className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-6">
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
              {pendingCount} bekleyen randevu
            </div>
          )}
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
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
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'simulator' && <SimulatorTab />}
      {tab === 'appointments' && <AppointmentsTab />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  )
}
