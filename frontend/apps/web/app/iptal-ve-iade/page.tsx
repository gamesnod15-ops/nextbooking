import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Ýptal ve Ýade Koþullarý — JetRandevu', description: 'Abonelik iptali ve iade koþullarý hakkýnda bilgilendirme.' }

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
            <h1 className="text-5xl font-extrabold leading-tight mb-4">Ýptal ve Ýade Koþullarý</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">Abonelik iptali ve iade süreçleri hakkýnda bilgilendirme metni.</p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Abonelik Ýptali</h2>
                <p>JetRandevu iþletme panelinizden dilediðiniz zaman aboneliðinizi iptal edebilirsiniz. Ýptal talebiniz alýndýðý anda hesabýnýz pasif hale gelir ve panele eriþim mevcut faturalama döneminin sonuna kadar deðil, iptal anýnda sona erer.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Ýade Koþullarý</h2>
                <p>Ödenmiþ abonelik ücretleri, ilgili faturalama dönemi baþladýktan sonra iade edilmez. Bu, aylýk veya yýllýk plan farký gözetmeksizin tüm abonelik paketleri için geçerlidir.</p>
                <p className="mt-2">Aþaðýdaki istisnai durumlarda iade deðerlendirmesi yapýlabilir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Mükerrer (ayný dönem için birden fazla) tahsilat yapýlmýþ olmasý</li>
                  <li>Hizmetin, platform kaynaklý teknik bir arýza nedeniyle faturalama döneminin tamamýnda kullanýlamamýþ olmasý</li>
                  <li>Yasal mevzuatýn açýkça iade gerektirdiði durumlar</li>
                </ul>
                <p className="mt-2">Bu durumlarda iade talebiniz destek ekibimiz tarafýndan incelenir ve deðerlendirme sonucu tarafýnýza bildirilir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Talep Yöntemi</h2>
                <p>Ýptal ve iade taleplerinizi iþletme panelinizdeki "Abonelik" sayfasýndan veya Destek sayfamýzdaki iletiþim kanallarýndan iletebilirsiniz.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Güncellemeler</h2>
                <p>Bu metin, mevzuat deðiþiklikleri ve platform güncellemeleri doðrultusunda periyodik olarak güncellenmektedir.</p>
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
