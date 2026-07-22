import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'KVKK — JetRandevu', description: 'Kişisel Verilerin Korunması Kanunu kapsamında bilgilendirme.' }

export default function KvkkPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">KVKK</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">Kişisel Verilerin Korunması</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni.</p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Veri Sorumlusu ve Temsilcisi</h2>
                <p>JetRandevu (jetrandevu.com) olarak, kişisel verilerinizin güvenliğine büyük önem vermekteyiz. 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında, işbu aydınlatma metni ile kişisel verilerinizin işlenme amaçları, hukuki sebepleri, aktarımı ve haklarınız hakkında sizleri detaylı şekilde bilgilendirmeyi amaçlıyoruz.</p>
                <p className="mt-2">Veri sorumlusu olarak, kişisel verilerinizin hukuka ve dürüstlük kurallarına uygun şekilde işlenmesi, doğru ve gerektiğinde güncel olması, belirli, açık ve meşru amaçlar için işlenmesi, işlendikleri amaçla bağlantılı, sınırlı ve ölçülü olması, ilgili mevzuatta öngörülen veya işlendikleri amaç için gerekli olan süre kadar muhafaza edilmesi hususlarına azami özen göstermekteyiz.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. İşlenen Kişisel Verileriniz ve Kategorizasyonu</h2>
                <p>Platformumuz aracılığıyla aşağıda kategorize edilen kişisel verileriniz, KVKK kapsamında işlenmektedir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Kimlik Bilgileri:</strong> Ad, soyad, T.C. kimlik numarası (fatura düzenlemesi durumunda)</li>
                  <li><strong>İletişim Bilgileri:</strong> E-posta adresi, cep telefonu numarası, ikametgah/iş yeri adresi</li>
                  <li><strong>İşletme Bilgileri:</strong> İşletme adı, işletme adresi, vergi dairesi, vergi numarası, işletme kategorisi</li>
                  <li><strong>Müşteri İşlem Bilgileri:</strong> Randevu geçmişi, satın alınan hizmetler/paketler, ödeme geçmişi, fatura bilgileri</li>
                  <li><strong>İşlem Güvenliği Bilgileri:</strong> IP adresi, cihaz bilgisi, oturum log kayıtları, erişim tarih/saat bilgisi</li>
                  <li><strong>Pazarlama Bilgileri:</strong> Çerez tercihleri, kampanya katılım kayıtları, iletişim izin kayıtları</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Kişisel Verilerin İşlenme Amaçları ve Hukuki Sebepleri</h2>
                <p>Kişisel verileriniz, KVKK'nın 5. ve 6. maddelerinde belirtilen aşağıdaki hukuki sebeplere dayanarak işlenmektedir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Sözleşmenin kurulması ve ifası:</strong> Hesap oluşturma, abonelik yönetimi, hizmet sunumu ve faturalandırma süreçleri</li>
                  <li><strong>Hukuki yükümlülüğün yerine getirilmesi:</strong> Yasal düzenlemelerden kaynaklanan saklama, bildirim ve raporlama yükümlülükleri</li>
                  <li><strong>Meşru menfaat:</strong> Hizmet kalitesinin artırılması, dolandırıcılık önleme, sistem güvenliği ve bütünlüğünün sağlanması</li>
                  <li><strong>Açık rıza:</strong> Pazarlama iletişimleri, profil oluşturma ve üçüncü taraf veri paylaşımı (açık rızanız alınarak)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Kişisel Verilerin Toplanma Yöntemleri</h2>
                <p>Kişisel verileriniz aşağıdaki yöntemlerle toplanmaktadır:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Doğrudan sizin tarafınızdan:</strong> Kayıt formları, hesap ayarları, iletişim formları, destek talepleri aracılığıyla</li>
                  <li><strong>Otomatik yollarla:</strong> Web sitemiz ve uygulamamız üzerinden çerezler, log kayıtları ve analitik araçlar vasıtasıyla</li>
                  <li><strong>Üçüncü taraflardan:</strong> Ödeme hizmet sağlayıcıları (İyzico, Stripe), sosyal medya platformları (izniniz dahilinde)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Kişisel Verilerin Aktarılması ve Saklanması</h2>
                <p>Kişisel verileriniz, KVKK'nın 8. ve 9. maddeleri kapsamında aşağıdaki alıcı gruplarına aktarılabilmektedir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Hukuken yetkili kamu kurum ve kuruluşları ile resmi merciler</li>
                  <li>Ödeme hizmet sağlayıcıları (İyzico, Stripe) - yalnızca ödeme işlemlerinin gerçekleştirilmesi amacıyla</li>
                  <li>E-posta ve SMS hizmet sağlayıcıları - bildirim ve pazarlama iletişimleri amacıyla</li>
                  <li>Bulut bilişim hizmet sağlayıcıları - veri depolama ve altyapı hizmetleri amacıyla</li>
                  <li>Hukuk danışmanları ve denetim firmaları - yasal uyum ve denetim amacıyla</li>
                </ul>
                <p className="mt-3">Verileriniz, Türkiye sınırları içerisinde bulunan KVKK uyumlu sunucularda saklanmaktadır. Yurt dışına veri aktarımı yapılmamaktadır. Verileriniz, işlenme amaçlarının gerektirdiği süre boyunca ve yasal saklama süreleri (Türk Ticaret Kanunu, Vergi Usul Kanunu kapsamında 10 yıl) çerçevesinde muhafaza edilmektedir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. KVKK Kapsamında Haklarınız</h2>
                <p>KVKK'nın 11. maddesi kapsamında, veri sorumlusuna başvurarak aşağıdaki haklara sahipsiniz:</p>
                <ol className="list-decimal pl-5 space-y-1.5 mt-2">
                  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                  <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                  <li>Kişisel verilerinizin işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                  <li>Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme</li>
                  <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
                  <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                  <li>Aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
                  <li>Ortaya çıkan sonucun kişisel verilerinizin analiz edilmesi suretiyle aleyhinize olmasına itiraz etme</li>
                  <li>Kanuna aykırı veri işleme sebebiyle zarara uğramanız halinde zararınızın giderilmesini talep etme</li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Başvuru Yöntemleri</h2>
                <p>KVKK kapsamındaki taleplerinizi, aşağıdaki yöntemlerle tarafımıza iletebilirsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>E-posta:</strong> kvkk@jetrandevu.com</li>
                  <li><strong>Kayıtlı e-posta (KEP):</strong> jetrandevu@hs01.kep.tr</li>
                  <li><strong>Posta yoluyla:</strong> Maslak Mahallesi, Büyükdere Caddesi No:237, 34485 Sarıyer/İstanbul</li>
                </ul>
                <p className="mt-3">Başvurunuz, talebin niteliğine göre en geç 30 gün içinde ücretsiz olarak sonuçlandırılacaktır. Ancak, işlemin ayrıca bir maliyeti gerektirmesi halinde, Kişisel Verileri Koruma Kurulu tarafından belirlenen tarifedeki ücret alınabilir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Güncellemeler</h2>
                <p>Bu aydınlatma metni, mevzuat değişiklikleri ve platform güncellemeleri doğrultusunda periyodik olarak güncellenmektedir. Güncelleme tarihleri ve değişiklikler metnin sonunda yer alan revizyon tablosunda belirtilmektedir.</p>
                <p className="mt-2 text-gray-500 text-xs">Son güncelleme: 15 Mayıs 2026</p>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
