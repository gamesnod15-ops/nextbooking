import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HelpCircle, Zap, CreditCard, Settings, Shield, Smartphone, Users, Search } from 'lucide-react'

export const metadata = { title: 'Sık Sorulan Sorular — NextBooking', description: 'NextBooking hakkında sık sorulan sorular ve cevapları.' }

const categories = [
  {
    icon: HelpCircle, label: 'Genel',
    items: [
      { q: 'NextBooking nedir?', a: 'NextBooking, kuaför, güzellik salonu, diş kliniği ve benzeri işletmeler için geliştirilmiş online randevu ve yönetim sistemidir.' },
      { q: 'Ücretsiz deneme süresi ne kadar?', a: '14 gün ücretsiz deneme süresi sunuyoruz. Kredi kartı gerekmez, dilediğiniz zaman iptal edebilirsiniz.' },
      { q: 'Kurulum ne kadar sürer?', a: 'Ortalama 5 dakika içinde kurulum tamamlanır. Herhangi bir yazılım yüklemenize gerek yoktur.' },
    ],
  },
  {
    icon: Users, label: 'Kullanım',
    items: [
      { q: 'Hangi işletmeler kullanabilir?', a: 'Kuaför, berber, güzellik salonu, klinik, diş kliniği, fizyoterapi, spor salonu, spa ve daha birçok işletme türü kullanabilir.' },
      { q: 'Birden fazla şube yönetebilir miyim?', a: 'Evet, Business ve Professional planlarımızda çoklu şube yönetimi desteği bulunmaktadır.' },
      { q: 'Personel hesabı oluşturabilir miyim?', a: 'Evet, her personel için ayrı hesap ve yetkilendirme oluşturabilir, çalışma takvimlerini ayrı ayrı yönetebilirsiniz.' },
    ],
  },
  {
    icon: CreditCard, label: 'Ödeme & Faturalandırma',
    items: [
      { q: 'Ödeme entegrasyonları hangileri?', a: 'İyzico ve Stripe entegrasyonlarımız mevcuttur. Güvenli ödeme altyapısı ile çalışır.' },
      { q: 'Müşterilerimden kredi kartı ile ödeme alabilir miyim?', a: 'Evet, online ödeme altyapımız sayesinde müşterileriniz randevu sırasında kredi kartı ile ödeme yapabilir.' },
      { q: 'Faturalarımı nereden görüntüleyebilirim?', a: 'Panelinizde Fatura bölümünden tüm geçmiş faturalarınızı görüntüleyebilir ve indirebilirsiniz.' },
    ],
  },
  {
    icon: Settings, label: 'Teknik',
    items: [
      { q: 'Verilerim güvende mi?', a: 'Evet, tüm verileriniz SSL şifreleme ile korunur ve KVKK uyumlu sunucularda saklanır.' },
      { q: 'Kendi alan adımı kullanabilir miyim?', a: 'Evet, Professional planımızda kendi alan adınızı kullanabilirsiniz.' },
      { q: 'Mobil uygulamanız var mı?', a: 'Web tabanlı platformumuz tüm mobil tarayıcılarda kusursuz çalışır. Ayrı bir uygulama yüklemenize gerek yoktur.' },
    ],
  },
  {
    icon: Zap, label: 'Randevu & Hatırlatma',
    items: [
      { q: 'Müşterilerime SMS ve e-posta gönderebilir miyim?', a: 'Evet, otomatik hatırlatma SMS ve e-postaları ile hayır-deme oranınızı düşürebilirsiniz.' },
      { q: 'Randevu hatırlatmaları otomatik mi?', a: 'Evet, sistem randevu saatinden 24 saat ve 1 saat önce otomatik olarak hatırlatma gönderir.' },
    ],
  },
  {
    icon: Shield, label: 'Güvenlik & Yasal',
    items: [
      { q: 'KVKK uyumlu musunuz?', a: 'Evet, tüm veri işleme süreçlerimiz KVKK mevzuatına uygun olarak tasarlanmıştır.' },
      { q: 'Veri yedekleme nasıl yapılıyor?', a: 'Verileriniz günlük olarak yedeklenir ve çok katmanlı güvenlik duvarları ile korunur.' },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24 text-white">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Sık Sorulan Sorular</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">Merak Edilenler</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">NextBooking hakkında en çok sorulan soruların cevaplarını kategorilere ayrılmış olarak bulabilirsiniz.</p>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((cat) => (
                <div key={cat.label} className="rounded-2xl border border-gray-100 bg-white p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
                      <cat.icon className="h-5 w-5 text-brand-500" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">{cat.label}</h3>
                  </div>
                  <div className="space-y-3">
                    {cat.items.map((item) => (
                      <details key={item.q} className="group rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 [&[open]]:border-brand-200 [&[open]]:bg-brand-50/30 transition-all">
                        <summary className="flex items-start justify-between cursor-pointer list-none gap-2">
                          <span className="text-xs font-semibold text-gray-900 group-open:text-brand-600 leading-snug">{item.q}</span>
                          <div className="h-5 w-5 rounded-full bg-gray-100 group-open:bg-brand-500 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                            <svg className="h-2.5 w-2.5 text-gray-500 group-open:text-black transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                          </div>
                        </summary>
                        <p className="mt-2 text-xs text-gray-600 leading-relaxed">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
