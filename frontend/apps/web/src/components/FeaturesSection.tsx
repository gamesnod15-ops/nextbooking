import {
  Calendar, Bell, BarChart3, Users, Smartphone, Shield,
  Zap, Globe, CreditCard, MessageSquare, Star, RefreshCw,
  CheckCircle, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import type { ComponentType, SVGProps } from 'react'
import { SlideIn } from './motion/Reveal'

const features = [
  { icon: Calendar,       title: 'Online Randevu',       desc: '7/24 web ve mobil üzerinden randevu. Gerçek zamanlı müsaitlik takvimi.' },
  { icon: Bell,           title: 'Otomatik Hatırlatma',  desc: 'SMS ve e-posta ile otomatik hatırlatmalar. Hayır-deme oranını %70 azaltın.' },
  { icon: BarChart3,      title: 'Gelir Analitiği',      desc: 'Günlük, haftalık, aylık gelir raporları. İşletmenizi verilerle yönetin.' },
  { icon: Users,          title: 'Çoklu Personel',       desc: 'Personel takvimi, yetkilendirme ve performans takibi.' },
  { icon: Smartphone,     title: 'Mobil Uyumlu',         desc: 'Tüm cihazlarda kusursuz deneyim. iOS ve Android için optimize.' },
  { icon: Shield,         title: 'Güvenli Ödeme',        desc: 'PCI DSS uyumlu. Stripe ve İyzico entegrasyonu.' },
  { icon: Zap,            title: 'Hızlı Kurulum',        desc: '5 dakikada hesap açın. 10 dakikada müşteri kabul etmeye başlayın.' },
  { icon: Star,           title: 'Sadakat Programı',     desc: 'Puan, kupa ve ödüllerle müşteri bağlılığını artırın.' },
]

const steps = [
  { step: '01', title: 'Hesap Açın', desc: 'E-posta ve işletme bilgilerinizle 2 dakikada hesabınızı oluşturun.' },
  { step: '02', title: 'İşletmenizi Kurun', desc: 'Hizmetlerinizi, personellerinizi ve çalışma saatlerinizi ekleyin.' },
  { step: '03', title: 'Paylaşın', desc: 'Randevu linkinizi müşterilerinizle paylaşın, rezervasyonlar gelmeye başlasın.' },
]

const integrations: {
  name: string
  category: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  iconStyle?: string
  bg: string
  ring: string
}[] = [
  {
    name: 'WhatsApp',
    category: 'Mesajlaşma',
    bg: '#25D366',
    ring: 'ring-[#25D366]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.528 5.845L0 24l6.337-1.508A11.934 11.934 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.659-.498-5.194-1.37l-.373-.215-3.762.895.952-3.658-.237-.389A9.955 9.955 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'Stripe',
    category: 'Ödeme',
    bg: '#635BFF',
    ring: 'ring-[#635BFF]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M13.479 9.883c-1.626-.604-2.512-1.067-2.512-1.803 0-.622.603-.979 1.623-.979 1.978 0 3.989.743 5.028 1.289l.722-4.461C17.25 3.39 15.5 3 13.5 3 9.5 3 7 5.177 7 8.5c0 3.215 2.216 4.426 4.5 5.27 1.65.604 2.5 1.135 2.5 1.897 0 .693-.64 1.08-1.75 1.08-1.668 0-4.195-.894-5.5-1.667L6 19.5C7.5 20.33 9.75 21 12 21c4.25 0 6.75-2.1 6.75-5.5 0-3.1-2.105-4.372-5.271-5.617z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'İyzico',
    category: 'Ödeme',
    bg: '#1a56db',
    ring: 'ring-[#1a56db]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 14.5h-2v-7h2v7zm0-9h-2V5.5h2V7.5z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'Google Takvim',
    category: 'Senkronizasyon',
    bg: '#ffffff',
    ring: 'ring-gray-200/50',
    icon: (props) => (
      <svg viewBox="0 0 24 24" {...props}>
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5C3.9 4 3 4.9 3 6v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" fill="#4285F4"/>
        <path d="M7 11h2v2H7zm0 4h2v2H7zm4-4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0 4h2v2h-2z" fill="#4285F4"/>
      </svg>
    ),
    iconStyle: '',
  },
  {
    name: 'Instagram',
    category: 'Sosyal Medya',
    bg: '#E1306C',
    ring: 'ring-[#E1306C]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'Facebook',
    category: 'Sosyal Medya',
    bg: '#1877F2',
    ring: 'ring-[#1877F2]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.931-1.956 1.886v2.269h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'SMS',
    category: 'Hatırlatma',
    bg: '#F97316',
    ring: 'ring-[#F97316]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'Muhasebe',
    category: 'Finans',
    bg: '#10B981',
    ring: 'ring-[#10B981]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'Zoom',
    category: 'Görüntülü',
    bg: '#2D8CFF',
    ring: 'ring-[#2D8CFF]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2v-3.4l3.8 2.85A.5.5 0 0023 14V10a.5.5 0 00-.8-.4L19 12.4V7a2 2 0 00-2-2H4z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'Slack',
    category: 'Bildirim',
    bg: '#4A154B',
    ring: 'ring-[#4A154B]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'Zapier',
    category: 'Otomasyon',
    bg: '#FF4A00',
    ring: 'ring-[#FF4A00]/30',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.364 8.174l-2.19 2.19a3.5 3.5 0 010 3.272l2.19 2.19A6.5 6.5 0 0112 18.5a6.5 6.5 0 01-5.364-2.674l2.19-2.19a3.5 3.5 0 010-3.272l-2.19-2.19A6.5 6.5 0 0112 5.5a6.5 6.5 0 015.364 2.674z"/>
      </svg>
    ),
    iconStyle: 'text-white',
  },
  {
    name: 'Mailchimp',
    category: 'E-posta',
    bg: '#FFE01B',
    ring: 'ring-[#FFE01B]/40',
    icon: (props) => (
      <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
    ),
    iconStyle: 'text-gray-800',
  },
]

const row1 = integrations.slice(0, 6)
const row2 = integrations.slice(6)

export function FeaturesSection() {
  return (
    <>
      {/* Core Features Grid */}
      <section id="features" className="relative bg-white py-24 overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #111 1px, transparent 0)', backgroundSize: '24px 24px' }} />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SlideIn direction="left" className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 mb-4">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-gray-900">Özellikler</span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900">İşletmenizi Büyütecek Her Şey</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              BookingAi&apos;ın güçlü özellikleri ile vaktinizi müşterilerinize harcayın, idari işler için değil.
            </p>
          </SlideIn>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, desc }, idx) => (
              <div
                key={title}
                className="group relative rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1.5 overflow-hidden"
              >
                <div aria-hidden className="absolute top-0 left-6 right-6 h-1 rounded-full bg-brand-500/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div aria-hidden className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-brand-500/5 group-hover:bg-brand-500/10 transition-colors" />

                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-50 to-brand-100 group-hover:from-brand-100 group-hover:to-brand-200 transition-all shadow-sm">
                  <Icon className="h-6 w-6 text-brand-500" />
                </div>
                <h3 className="mb-2 text-base font-bold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold text-white hover:bg-brand-600 transition-all hover:-translate-y-0.5 shadow-md"
            >
              Tüm Özellikleri Görüntüle <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative bg-gradient-to-br from-brand-50/50 to-violet-50/50 py-24 overflow-hidden">
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
          <svg className="absolute top-20 right-10 h-72 w-72 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
            <polygon points="100,0 200,200 0,200" className="fill-gray-900" />
          </svg>
          <svg className="absolute bottom-10 left-1/3 h-40 w-40 opacity-[0.025]" viewBox="0 0 200 200" fill="none">
            <rect x="20" y="20" width="160" height="160" rx="40" className="stroke-gray-900 stroke-[1.5]" fill="none" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <SlideIn direction="right">
              <div className="mb-10">
                <p className="text-sm font-semibold uppercase tracking-widest text-gray-900">Nasıl Çalışır?</p>
                <h2 className="mt-2 text-4xl font-extrabold text-gray-900">3 Adımda Hazır</h2>
                <p className="mt-4 text-lg text-gray-600">Karmaşık kurulum yok. Dakikalar içinde başlayın.</p>
              </div>
              </SlideIn>

              <div className="space-y-8">
                {steps.map(({ step, title, desc }, idx) => (
                  <div key={step} className="relative flex gap-5">
                    <div className="relative shrink-0">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md border-2 border-gray-200">
                        <span className="text-base font-extrabold text-brand-500">{step}</span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div aria-hidden className="absolute top-12 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-brand-300" />
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                      <p className="mt-1 text-sm text-gray-600 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-brand-600 transition-all hover:-translate-y-0.5"
                >
                  <CheckCircle className="h-4 w-4" /> Hemen Başla — Ücretsiz
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="relative h-[480px] w-full overflow-hidden rounded-3xl shadow-2xl rotate-1 transition-transform duration-500 hover:rotate-0">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=600&q=80"
                    alt="İşletme yönetimi"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                </div>
                <div className="absolute -bottom-4 -left-4 rounded-2xl bg-white px-5 py-3 shadow-xl border-2 border-gray-200">
                  <p className="text-sm font-semibold text-gray-900">5 dakikada kurulum</p>
                  <p className="text-xs text-gray-500">Üstelik tamamen ücretsiz</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="relative bg-white py-24 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full border-[40px] border-brand-500/5" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full border-[20px] border-brand-500/5" />

        <div className="relative mx-auto max-w-6xl px-5 sm:px-8 lg:px-10">
          <SlideIn direction="left" className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 mb-4">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              <span className="text-xs font-semibold text-gray-900">Avantajlar</span>
            </div>
            <h2 className="text-4xl font-extrabold text-gray-900 leading-tight">
              Rakiplerinizden Bir Adım{' '}
              <span className="text-brand-500">Önde Olun</span>
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-gray-600 leading-relaxed">
              Müşterileriniz artık telefon beklemiyor. Online randevu sistemiyle hem müşteri memnuniyetini artırın,
              hem de idari yükünüzü azaltın.
            </p>
          </SlideIn>

          <div className="relative overflow-hidden rounded-[2rem] border border-gray-200 bg-gradient-to-br from-gray-50 via-white to-brand-50/40 shadow-xl">
            <div aria-hidden className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />

            <div className="relative grid grid-cols-2 divide-x divide-y divide-gray-200/80 sm:grid-cols-4 sm:divide-y-0">
              {[
                { value: '%70', label: 'Daha Az Hayır-deme' },
                { value: '%35', label: 'Daha Yüksek Doluluk' },
                { value: '%80', label: 'Daha Az Telefon' },
                { value: '5 dk', label: 'Kurulum Süresi' },
              ].map((stat) => (
                <div key={stat.label} className="px-6 py-9 text-center sm:py-11">
                  <p className="text-3xl font-extrabold text-brand-600 sm:text-4xl">{stat.value}</p>
                  <p className="mt-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="relative border-t border-gray-200/80 sm:grid sm:grid-cols-2">
              {[
                { icon: Bell, text: 'Hayır-deme oranını %70 azaltın', sub: 'Otomatik hatırlatmalar sayesinde', border: 'border-b sm:border-b sm:border-r' },
                { icon: Calendar, text: 'Doluluk oranınızı %35 artırın', sub: 'Akıllı takvim yönetimiyle', border: 'border-b sm:border-b' },
                { icon: Smartphone, text: 'Telefon trafiğini %80 azaltın', sub: '7/24 online rezervasyonla', border: 'border-b sm:border-b-0 sm:border-r' },
                { icon: Star, text: 'Müşteri geri dönüş oranını yükseltin', sub: 'Sadakat programıyla', border: '' },
              ].map(({ icon: Icon, text, sub, border }) => (
                <div
                  key={text}
                  className={`group flex items-center gap-4 border-gray-200/80 px-8 py-5 transition-colors hover:bg-brand-50/50 ${border}`}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 transition-colors group-hover:bg-brand-100">
                    <Icon className="h-5 w-5 text-brand-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{text}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="relative bg-gray-950 py-24 overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <svg className="absolute -top-10 -right-10 h-80 w-80 opacity-[0.04]" viewBox="0 0 200 200" fill="none">
            <polygon points="100,0 200,100 100,200 0,100" className="fill-white" />
          </svg>
          <svg className="absolute bottom-10 left-10 h-60 w-60 opacity-[0.03]" viewBox="0 0 200 200" fill="none">
            <rect x="30" y="30" width="140" height="140" rx="20" className="stroke-white stroke-[1.5]" fill="none" />
            <circle cx="100" cy="100" r="40" className="stroke-white stroke-[1.5]" fill="none" />
          </svg>
          <svg className="absolute top-1/3 left-1/2 h-48 w-48 opacity-[0.025]" viewBox="0 0 200 200" fill="none">
            <polygon points="100,15 185,185 15,185" className="stroke-white stroke-[1]" fill="none" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <SlideIn direction="right" className="text-center mb-14">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-500">Entegrasyonlar</p>
            <h2 className="mt-2 text-4xl font-extrabold text-white">Kullandığınız Araçlarla Çalışır</h2>
            <p className="mt-3 text-gray-400 max-w-xl mx-auto leading-relaxed">
              Ödeme, mesajlaşma, sosyal medya ve muhasebe araçlarıyla sorunsuz entegrasyon.
              Mevcut iş akışınızı değiştirmenize gerek yok.
            </p>
          </SlideIn>

          <div className="space-y-4 mb-14">
            <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex gap-4 animate-[marquee_30s_linear_infinite]">
                {[...row1, ...row1].map((int, i) => {
                  const Icon = int.icon
                  return (
                    <div key={`r1-${i}`} className={`flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-colors ring-1 ${int.ring}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: int.bg }}>
                        <Icon className={int.iconStyle} style={{ height: '18px', width: '18px' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">{int.name}</p>
                        <p className="text-xs text-gray-400 leading-tight">{int.category}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="relative flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <div className="flex gap-4 animate-[marquee_25s_linear_infinite_reverse]">
                {[...row2, ...row2].map((int, i) => {
                  const Icon = int.icon
                  return (
                    <div key={`r2-${i}`} className={`flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3.5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-colors ring-1 ${int.ring}`}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: int.bg }}>
                        <Icon className={int.iconStyle} style={{ height: '18px', width: '18px' }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">{int.name}</p>
                        <p className="text-xs text-gray-400 leading-tight">{int.category}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-bold text-white">İhtiyacınız olan entegrasyon listede yok mu?</h3>
              <p className="mt-1 text-sm text-gray-400">Özel entegrasyon geliştirme için satış ekibimizle iletişime geçin.</p>
            </div>
            <Link
              href="/iletisim"
              className="shrink-0 flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-all hover:-translate-y-0.5 shadow-lg"
            >
              Bizimle İletişime Geç <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
