'use client'

import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight, BookOpen, Code, Settings, HelpCircle, FileText, Video, Download, ExternalLink, Sparkles, X } from 'lucide-react'

interface DocItem {
  id: string
  title: string
  desc: string
  icon: typeof BookOpen
  href?: string
  content?: string
}

interface DocCategory {
  title: string
  color: string
  items: DocItem[]
}

const docContents: Record<string, string> = {
  baslangic: `
# Başlangıç Kılavuzu

BookingAi ile işletmenizi dijital dünyaya taşımak çok kolay.

## Hızlı Kurulum

1. **Hesap Oluşturun** — BookingAi'a ücretsiz kaydolun.
2. **İşletme Profilinizi Oluşturun** — İşletme adı, adres, iletişim bilgilerini ekleyin.
3. **Hizmetlerinizi Tanımlayın** — Sunduğunuz hizmetleri, sürelerini ve fiyatlarını belirleyin.
4. **Çalışma Takviminizi Ayarlayın** — Çalışma günleri ve saatlerinizi tanımlayın.
5. **Randevu Almaya Başlayın** — Müşterileriniz 7/24 online randevu alabilir.

## Önemli İpuçları

- Profil fotoğrafı eklemek güven oluşturur.
- Hizmet açıklamalarını detaylı yazın.
- Müsaitlik takviminizi düzenli güncelleyin.
  `,
  hesap: `
# Hesap Oluşturma

## Üyelik Türleri

- **İşletme Hesabı** — İşletmenizi yönetmek için.
- **Müşteri Hesabı** — Randevu almak için.

## Kayıt Adımları

1. Kayıt formunu doldurun (ad, soyad, e-posta, şifre).
2. E-posta adresinize gelen doğrulama linkine tıklayın.
3. Profil bilgilerinizi tamamlayın.

## Profil Yönetimi

Panelden profilinizi düzenleyebilir, şifrenizi değiştirebilir ve hesap ayarlarınızı yönetebilirsiniz.
  `,
  video: `
# Video Eğitimler

Yakında eklenecek. Şu an için aşağıdaki kaynakları kullanabilirsiniz:

- Adım adım kurulum rehberi
- Panel kullanımı tanıtımı
- API entegrasyonu örnekleri

Video eğitimler için bizi takip etmeye devam edin.
  `,
  api: `
# API Dokümantasyonu

BookingAi REST API ile işletmenizi programatik olarak yönetin.

## Temel Bilgiler

- **Base URL**: \\\`https://api.nextbooking.com/api/v1\\\`
- **Auth**: Bearer Token (JWT)
- **Content-Type**: application/json

## Authentication

\\\`\\\`\\\`http
POST /auth/login
{
  "email": "ornek@email.com",
  "password": "şifreniz"
}
\\\`\\\`\\\`

## Randevular

\\\`\\\`\\\`http
GET /appointments
GET /appointments/{id}
POST /appointments
PUT /appointments/{id}
DELETE /appointments/{id}
\\\`\\\`\\\`

## Hata Kodları

- \\\`400\\\` — Geçersiz istek
- \\\`401\\\` — Yetkilendirme hatası
- \\\`404\\\` — Kayıt bulunamadı
- \\\`500\\\` — Sunucu hatası
  `,
  webhook: `
# Webhook Entegrasyonu

Webhook'lar ile gerçek zamanlı bildirimler alın.

## Olaylar

- \\\`appointment.created\\\` — Yeni randevu oluşturuldu
- \\\`appointment.updated\\\` — Randevu güncellendi
- \\\`appointment.cancelled\\\` — Randevu iptal edildi
- \\\`payment.completed\\\` — Ödeme tamamlandı

## Yapılandırma

Panelden \\\`Ayarlar > Webhook\\\` bölümünden webhook URL'inizi tanımlayabilirsiniz.
  `,
  sdk: `
# SDK & Kütüphaneler

Resmi SDK'lar ile entegrasyonu hızlandırın.

## Mevcut SDK'lar

- **JavaScript/TypeScript** — npm: \\\`nextbooking-sdk\\\`
- **Python** — pip: \\\`nextbooking\\\`
- **PHP** — composer: \\\`nextbooking/sdk\\\`
- **C# (.NET)** — NuGet: \\\`BookingAi.SDK\\\`

## Örnek Kullanım (JS)

\\\`\\\`\\\`javascript
import BookingAi from 'nextbooking-sdk'

const client = new BookingAi('API_KEY')
const appointments = await client.appointments.list()
\\\`\\\`\\\`
  `,
  panel: `
# Yönetim Paneli

Panel üzerinden işletmenizin tüm operasyonlarını yönetin.

## Bölümler

- **Dashboard** — Özet istatistikler ve grafikler
- **Randevular** — Tüm randevuları görüntüleyin ve yönetin
- **Müşteriler** — Müşteri listeniz ve geçmişleri
- **Hizmetler** — Hizmetlerinizi tanımlayın
- **Takvim** — Çalışma takviminizi ayarlayın
- **Raporlar** — Gelir ve performans raporları
- **Ayarlar** — Profil ve işletme ayarları
  `,
  raporlama: `
# Raporlama

Gelir ve performans raporları ile işletmenizi analiz edin.

## Rapor Türleri

- **Günlük Rapor** — Günlük randevu ve gelir özeti
- **Haftalık Rapor** — Haftalık performans analizi
- **Aylık Rapor** — Aylık detaylı rapor
- **Özel Tarih Aralığı** — İstediğiniz dönem için rapor

## Metrikler

- Toplam randevu sayısı
- Toplam gelir
- Ortalama randevu değeri
- İptal oranı
- En çok tercih edilen hizmetler
  `,
}

const categories: DocCategory[] = [
  {
    title: 'Başlangıç', color: 'from-brand-500 to-yellow-400',
    items: [
      { id: 'baslangic', title: 'Başlangıç Kılavuzu', desc: 'Hızlı kurulum ve ilk adımlar.', icon: BookOpen },
      { id: 'hesap', title: 'Hesap Oluşturma', desc: 'Üyelik ve işletme profili oluşturma.', icon: FileText },
      { id: 'video', title: 'Video Eğitimler', desc: 'Adım adım video anlatımlar.', icon: Video },
    ],
  },
  {
    title: 'Geliştirici', color: 'from-blue-500 to-cyan-500',
    items: [
      { id: 'api', title: 'API Dokümantasyonu', desc: 'REST API entegrasyon rehberi.', icon: Code },
      { id: 'webhook', title: 'Webhook Entegrasyonu', desc: 'Webhook olayları ve yönetimi.', icon: ExternalLink },
      { id: 'sdk', title: 'SDK & Kütüphaneler', desc: 'Resmi SDK ve kütüphane dokümanları.', icon: Download },
    ],
  },
  {
    title: 'Panel Kullanımı', color: 'from-violet-500 to-purple-500',
    items: [
      { id: 'panel', title: 'Yönetim Paneli', desc: 'Panel kullanım kılavuzu.', icon: Settings },
      { id: 'raporlama', title: 'Raporlama', desc: 'Gelir ve performans raporları.', icon: FileText },
    ],
  },
  {
    title: 'Destek', color: 'from-emerald-500 to-green-500',
    items: [
      { id: 'sss', title: 'SSS', desc: 'Sık karşılaşılan sorunlar ve çözümleri.', icon: HelpCircle, href: '/faq' },
      { id: 'iletisim', title: 'İletişim', desc: 'Destek ekibimize ulaşın.', icon: HelpCircle, href: '/iletisim' },
    ],
  },
]

function DocModal({ id, onClose }: { id: string; onClose: () => void }) {
  const content = docContents[id]
  if (!content) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">
            {Object.values(categories).flatMap(c => c.items).find(i => i.id === id)?.title || id}
          </h2>
          <button onClick={onClose} aria-label="Kapat" className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6 prose prose-sm max-w-none text-gray-700">
          {content.split('\n').map((line, i) => {
            if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-extrabold text-gray-900 mt-6 mb-4">{line.slice(2)}</h1>
            if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-gray-900 mt-5 mb-3">{line.slice(3)}</h2>
            if (line.startsWith('- **')) {
              const match = line.match(/- \*\*(.+?)\*\*(.*)/)
              if (match) return <li key={i} className="ml-4 list-disc text-gray-700 mb-1"><strong>{match[1]}</strong>{match[2]}</li>
            }
            if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-gray-700 mb-1">{line.slice(2)}</li>
            if (line.startsWith('1. ')) return <li key={i} className="ml-4 list-decimal text-gray-700 mb-1">{line.slice(3)}</li>
            if (line.startsWith('```')) return null
            if (line.startsWith('`')) {
              const cleaned = line.replace(/`/g, '')
              return <pre key={i} className="bg-gray-50 rounded-lg px-4 py-3 text-sm font-mono text-gray-800 overflow-x-auto my-2">{cleaned}</pre>
            }
            if (line.trim() === '') return <div key={i} className="h-2" />
            return <p key={i} className="text-gray-700 leading-relaxed mb-2">{line}</p>
          })}
        </div>
      </div>
    </div>
  )
}

export default function DocsPage() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null)

  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[300px] w-[300px] rounded-full bg-blue-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 text-xs font-medium text-brand-500 mb-6">
              <Sparkles className="h-3 w-3" /> Geliştirici ve Kullanıcı Dokümanları
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">Dokümantasyon</h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-300">
              Entegrasyon rehberleri, API dokümanları ve kullanım kılavuzları ile BookingAi&apos;ı en verimli şekilde kullanın.
            </p>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-8 md:grid-cols-2">
              {categories.map((cat) => (
                <div key={cat.title} className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-xl transition-shadow">
                  <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full bg-gradient-to-r ${cat.color}`} />
                    {cat.title}
                  </h3>
                  <div className="space-y-3">
                    {cat.items.map((item) =>
                      item.href ? (
                        <Link key={item.title} href={item.href}
                          className="group flex items-center gap-4 rounded-xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:border-brand-100 hover:bg-brand-50/30">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color}`}>
                            <item.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
                        </Link>
                      ) : (
                        <button key={item.title} onClick={() => setActiveDoc(item.id)}
                          className="group flex w-full items-center gap-4 rounded-xl border border-gray-50 bg-gray-50/50 p-4 transition-all hover:border-brand-100 hover:bg-brand-50/30 text-left">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${cat.color}`}>
                            <item.icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{item.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-brand-500 transition-colors shrink-0" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {activeDoc && <DocModal id={activeDoc} onClose={() => setActiveDoc(null)} />}
    </>
  )
}
