import api from '@/lib/api'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ChatbotRule {
  id: string
  trigger: string
  response: string
  isActive: boolean
  priority: number
  category: string
}

export type ButtonActionType =
  | 'goto'               // başka düğüme git
  | 'list-appointments'  // randevuları listele
  | 'open-booking'       // randevu takvimini aç
  | 'cancel-appointment' // randevu iptal
  | 'show-services'      // hizmetleri listele
  | 'show-prices'        // fiyatları göster
  | 'show-contact'       // iletişim bilgisi
  | 'human-agent'        // insan desteğe bağla

export const BUTTON_ACTION_LABELS: Record<ButtonActionType, string> = {
  'goto': 'Düğüme Git',
  'list-appointments': 'Randevuları Listele',
  'open-booking': 'Randevu Takvimi Aç',
  'cancel-appointment': 'Randevu İptal',
  'show-services': 'Hizmetleri Göster',
  'show-prices': 'Fiyatları Göster',
  'show-contact': 'İletişim Bilgisi',
  'human-agent': 'İnsan Desteğe Bağla',
}

export interface FlowButton {
  id: string
  label: string
  actionType: ButtonActionType
  nextNodeId?: string // 'goto' aksiyonu için
}

export interface FlowNode {
  id: string
  name: string          // panel'de görünen isim
  message: string       // botun söyleyeceği metin
  buttons: FlowButton[]
  triggers: string[]    // bu düğümü tetikleyen kelimeler
  isWelcome?: boolean   // giriş düğümü mü?
}

export interface ChatbotSettings {
  isEnabled: boolean
  greeting: string
  fallbackMessage: string
  rules: ChatbotRule[]
  nodes: FlowNode[]
}

const SETTINGS_KEY = 'chatbot_config'

export const DEFAULT_NODES: FlowNode[] = [
  {
    id: 'welcome',
    name: 'Karşılama',
    isWelcome: true,
    message: 'Merhaba! 👋 Hoş geldiniz. Size nasıl yardımcı olabilirim?',
    triggers: ['merhaba', 'selam', 'hi', 'hello'],
    buttons: [
      { id: 'b1', label: '📅 Randevu Al', actionType: 'goto', nextNodeId: 'appointment-menu' },
      { id: 'b2', label: '🔍 Randevumu Takip Et', actionType: 'list-appointments' },
      { id: 'b3', label: '💰 Fiyatları Gör', actionType: 'goto', nextNodeId: 'prices' },
      { id: 'b4', label: '💇 Hizmetlerimiz', actionType: 'goto', nextNodeId: 'services' },
      { id: 'b5', label: '📞 Bize Ulaşın', actionType: 'show-contact' },
    ],
  },
  {
    id: 'appointment-menu',
    name: 'Randevu Menüsü',
    message: 'Randevu işleminiz için ne yapmak istersiniz?',
    triggers: ['randevu', 'rezervasyon', 'appointment'],
    buttons: [
      { id: 'b1', label: '📅 Yeni Randevu Al', actionType: 'open-booking' },
      { id: 'b2', label: '🔍 Randevumu Görüntüle', actionType: 'list-appointments' },
      { id: 'b3', label: '❌ Randevumu İptal Et', actionType: 'goto', nextNodeId: 'cancel-confirm' },
      { id: 'b4', label: '↩️ Ana Menü', actionType: 'goto', nextNodeId: 'welcome' },
    ],
  },
  {
    id: 'cancel-confirm',
    name: 'İptal Onayı',
    message: '⚠️ Randevunuzu iptal etmek istediğinize emin misiniz? İptal işlemi geri alınamaz.',
    triggers: ['iptal', 'cancel'],
    buttons: [
      { id: 'b1', label: '✅ Evet, İptal Et', actionType: 'cancel-appointment' },
      { id: 'b2', label: '↩️ Geri Dön', actionType: 'goto', nextNodeId: 'appointment-menu' },
    ],
  },
  {
    id: 'prices',
    name: 'Fiyatlar',
    message: 'Hangi hizmetin fiyatını öğrenmek istersiniz?',
    triggers: ['fiyat', 'ücret', 'ne kadar', 'kaç lira', 'para'],
    buttons: [
      { id: 'b1', label: '📋 Tüm Fiyat Listesi', actionType: 'show-prices' },
      { id: 'b2', label: '📅 Randevu Al', actionType: 'open-booking' },
      { id: 'b3', label: '↩️ Ana Menü', actionType: 'goto', nextNodeId: 'welcome' },
    ],
  },
  {
    id: 'services',
    name: 'Hizmetler',
    message: 'Sunduğumuz hizmetleri aşağıda bulabilirsiniz. Detay görmek istediğiniz hizmeti seçin:',
    triggers: ['hizmet', 'ne yapıyorsunuz', 'servis', 'işlem'],
    buttons: [
      { id: 'b1', label: '📋 Tüm Hizmetler', actionType: 'show-services' },
      { id: 'b2', label: '📅 Randevu Al', actionType: 'open-booking' },
      { id: 'b3', label: '↩️ Ana Menü', actionType: 'goto', nextNodeId: 'welcome' },
    ],
  },
]

async function fetchChatbotSettings(): Promise<ChatbotSettings> {
  const res = await api.get<{ settings: Record<string, string> }>('/business/me')
  const raw = res.data.settings?.[SETTINGS_KEY]
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as ChatbotSettings
      // Migrate: ensure nodes exists
      if (!parsed.nodes) parsed.nodes = DEFAULT_NODES
      return parsed
    } catch { /* ignore */ }
  }
  return {
    isEnabled: true,
    greeting: 'Merhaba! Size nasıl yardımcı olabilirim?',
    fallbackMessage: 'Üzgünüm, bu konuda yardımcı olamıyorum. Bir temsilciyle görüşmek ister misiniz?',
    rules: [],
    nodes: DEFAULT_NODES,
  }
}

async function saveChatbotSettings(settings: ChatbotSettings): Promise<void> {
  const biz = await api.get<{ name: string; phone: string | null; email: string | null; address: string | null; city: string | null; description: string | null }>('/business/me')
  const { name, phone, email, address, city, description } = biz.data
  await api.put('/business/me', {
    name,
    phone,
    email,
    address,
    city,
    description,
    settings: { [SETTINGS_KEY]: JSON.stringify(settings) },
  })
}

export function useChatbotSettings() {
  return useQuery({
    queryKey: ['chatbot-settings'],
    queryFn: fetchChatbotSettings,
    staleTime: 30 * 1000,
  })
}

export function useSaveChatbotSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: saveChatbotSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chatbot-settings'] })
      qc.invalidateQueries({ queryKey: ['business'] })
    },
  })
}
