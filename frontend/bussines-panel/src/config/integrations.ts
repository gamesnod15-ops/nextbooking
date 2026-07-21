export type IntegrationType = 'oauth' | 'api-key' | 'webhook'

export interface IntegrationConfig {
  key: string
  name: string
  desc: string
  type: IntegrationType
  logo: string
  docsUrl: string
  /** Short, scannable checklist of what the user needs to have ready before starting. */
  requirements: string[]
}

export const INTEGRATIONS: IntegrationConfig[] = [
  {
    key: 'google-cal',
    name: 'Google Takvim',
    desc: 'Randevularınızı Google Takvim ile otomatik senkronize edin',
    type: 'oauth',
    logo: '📅',
    docsUrl: 'https://developers.google.com/calendar',
    requirements: [
      'Bir Google hesabı (Gmail veya kurumsal Google Workspace)',
      'Takvimlerinizi görüntülemek istediğiniz Google hesabında oturum açabilme',
    ],
  },
  {
    key: 'whatsapp',
    name: 'WhatsApp Business',
    desc: 'WhatsApp Cloud API ile randevu hatırlatması ve bildirim gönderin',
    type: 'api-key',
    logo: '💬',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    requirements: [
      'Onaylı bir Meta Business hesabı',
      'Meta Developers portalında oluşturulmuş bir WhatsApp uygulaması',
      'Uygulamanın "Telefon Numarası ID"si (API Setup sayfasında görünür)',
      'Kalıcı erişim token\'ı (System User üzerinden oluşturulmalı — geçici token\'lar 24 saatte sona erer)',
    ],
  },
]
