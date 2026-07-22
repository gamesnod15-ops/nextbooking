import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'İptal ve İade Koşulları — JetRandevu', description: 'Abonelik iptali ve iade koşulları hakkında bilgilendirme.' }

export default function IptalVeIadePage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Yasal</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">İptal ve İade Koşulları</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">Abonelik iptali ve iade süreçleri hakkında bilgilendirme metni.</p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Abonelik İptali</h2>
                <p>JetRandevu işletme panelinizden dilediğiniz zaman aboneliğinizi iptal edebilirsiniz. İptal talebiniz alındığı anda hesabınız pasif hale gelir ve panele erişim mevcut faturalama döneminin sonuna kadar değil, iptal anında sona erer.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. İade Koşulları</h2>
                <p>Ödenmiş abonelik ücretleri, ilgili faturalama dönemi başladıktan sonra iade edilmez. Bu, aylık veya yıllık plan farkı gözetmeksizin tüm abonelik paketleri için geçerlidir.</p>
                <p className="mt-2">Aşağıdaki istisnai durumlarda iade değerlendirmesi yapılabilir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Mükerrer (aynı dönem için birden fazla) tahsilat yapılmış olması</li>
                  <li>Hizmetin, platform kaynaklı teknik bir arıza nedeniyle faturalama döneminin tamamında kullanılamamış olması</li>
                  <li>Yasal mevzuatın açıkça iade gerektirdiği durumlar</li>
                </ul>
                <p className="mt-2">Bu durumlarda iade talebiniz destek ekibimiz tarafından incelenir ve değerlendirme sonucu tarafınıza bildirilir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Talep Yöntemi</h2>
                <p>İptal ve iade taleplerinizi işletme panelinizdeki "Abonelik" sayfasından veya Destek sayfamızdaki iletişim kanallarından iletebilirsiniz.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Güncellemeler</h2>
                <p>Bu metin, mevzuat değişiklikleri ve platform güncellemeleri doğrultusunda periyodik olarak güncellenmektedir.</p>
                <p className="mt-2 text-gray-500 text-xs">Son güncelleme: 21 Temmuz 2026</p>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
