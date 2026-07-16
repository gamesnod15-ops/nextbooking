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
  {
    key: 'iyzico',
    name: 'Iyzico',
    desc: 'Online ödeme alın — kredi kartı, 3D Secure ve taksit desteği',
    type: 'api-key',
    logo: '💳',
    docsUrl: 'https://dev.iyzipay.com',
    requirements: [
      'Onaylı bir Iyzico Merchant (üye işyeri) hesabı',
      'Merchant Portal > Ayarlar > API Anahtarları sayfasından alınan API Anahtarı ve Gizli Anahtar',
    ],
  },
  {
    key: 'zoom',
    name: 'Zoom',
    desc: 'Online hizmetler için otomatik Zoom toplantısı oluşturun',
    type: 'oauth',
    logo: '📹',
    docsUrl: 'https://marketplace.zoom.us/docs/api-reference',
    requirements: [
      'Bir Zoom hesabı (Pro plan ve üzeri önerilir)',
      'Zoom App Marketplace\'te oluşturulmuş bir OAuth uygulaması',
      'Uygulamanın Client ID ve Client Secret bilgileri',
    ],
  },
  {
    key: 'slack',
    name: 'Slack',
    desc: 'Yeni randevu ve önemli olayları Slack kanalınıza bildirin',
    type: 'webhook',
    logo: '💼',
    docsUrl: 'https://api.slack.com/messaging/webhooks',
    requirements: [
      'Bir Slack workspace\'inde yönetici izni (webhook eklemek için)',
      'Apps > Incoming Webhooks üzerinden oluşturulmuş bir webhook URL\'i',
    ],
  },
]
