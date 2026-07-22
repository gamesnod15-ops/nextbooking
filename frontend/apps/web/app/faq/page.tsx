import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { HelpCircle, Zap, CreditCard, Settings, Shield, Smartphone, Users, Search } from 'lucide-react'

export const metadata = { title: 'Sýk Sorulan Sorular — JetRandevu', description: 'JetRandevu hakkýnda sýk sorulan sorular ve cevaplarý.' }

const categories = [
  {
    icon: HelpCircle, label: 'Genel',
    items: [
      { q: 'JetRandevu nedir?', a: 'JetRandevu, kuaför, güzellik salonu, diþ kliniði ve benzeri iþletmeler için geliþtirilmiþ online randevu ve yönetim sistemidir.' },
      { q: 'Ücretsiz deneme süresi ne kadar?', a: '14 gün ücretsiz deneme süresi sunuyoruz. Kredi kartý gerekmez, dilediðiniz zaman iptal edebilirsiniz.' },
      { q: 'Kurulum ne kadar sürer?', a: 'Ortalama 5 dakika içinde kurulum tamamlanýr. Herhangi bir yazýlým yüklemenize gerek yoktur.' },
    ],
  },
  {
    icon: Users, label: 'Kullaným',
    items: [
      { q: 'Hangi iþletmeler kullanabilir?', a: 'Kuaför, berber, güzellik salonu, klinik, diþ kliniði, fizyoterapi, spor salonu, spa ve daha birçok iþletme türü kullanabilir.' },
      { q: 'Birden fazla þube yönetebilir miyim?', a: 'Evet, Business ve Professional planlarýmýzda çoklu þube yönetimi desteði bulunmaktadýr.' },
      { q: 'Personel hesabý oluþturabilir miyim?', a: 'Evet, her personel için ayrý hesap ve yetkilendirme oluþturabilir, çalýþma takvimlerini ayrý ayrý yönetebilirsiniz.' },
    ],
  },
  {
    icon: CreditCard, label: 'Ödeme & Faturalandýrma',
    items: [
      { q: 'Ödeme entegrasyonlarý hangileri?', a: 'Ýyzico ve Stripe entegrasyonlarýmýz mevcuttur. Güvenli ödeme altyapýsý ile çalýþýr.' },
      { q: 'Müþterilerimden kredi kartý ile ödeme alabilir miyim?', a: 'Evet, online ödeme altyapýmýz sayesinde müþterileriniz randevu sýrasýnda kredi kartý ile ödeme yapabilir.' },
      { q: 'Faturalarýmý nereden görüntüleyebilirim?', a: 'Panelinizde Fatura bölümünden tüm geçmiþ faturalarýnýzý görüntüleyebilir ve indirebilirsiniz.' },
    ],
  },
  {
    icon: Settings, label: 'Teknik',
    items: [
      { q: 'Verilerim güvende mi?', a: 'Evet, tüm verileriniz SSL þifreleme ile korunur ve KVKK uyumlu sunucularda saklanýr.' },
      { q: 'Kendi alan adýmý kullanabilir miyim?', a: 'Evet, Professional planýmýzda kendi alan adýnýzý kullanabilirsiniz.' },
      { q: 'Mobil uygulamanýz var mý?', a: 'Web tabanlý platformumuz tüm mobil tarayýcýlarda kusursuz çalýþýr. Ayrý bir uygulama yüklemenize gerek yoktur.' },
    ],
  },
  {
    icon: Zap, label: 'Randevu & Hatýrlatma',
    items: [
      { q: 'Müþterilerime SMS ve e-posta gönderebilir miyim?', a: 'Evet, otomatik hatýrlatma SMS ve e-postalarý ile hayýr-deme oranýnýzý düþürebilirsiniz.' },
      { q: 'Randevu hatýrlatmalarý otomatik mi?', a: 'Evet, sistem randevu saatinden 24 saat ve 1 saat önce otomatik olarak hatýrlatma gönderir.' },
    ],
  },
  {
    icon: Shield, label: 'Güvenlik & Yasal',
    items: [
      { q: 'KVKK uyumlu musunuz?', a: 'Evet, tüm veri iþleme süreçlerimiz KVKK mevzuatýna uygun olarak tasarlanmýþtýr.' },
      { q: 'Veri yedekleme nasýl yapýlýyor?', a: 'Verileriniz günlük olarak yedeklenir ve çok katmanlý güvenlik duvarlarý ile korunur.' },
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Sýk Sorulan Sorular</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-6">Merak Edilenler</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">JetRandevu hakkýnda en çok sorulan sorularýn cevaplarýný kategorilere ayrýlmýþ olarak bulabilirsiniz.</p>
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
                            <svg className="h-2.5 w-2.5 text-gray-500 group-open:text-white transition-transform group-open:rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
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
