import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Kullanım Şartları — JetRandevu', description: 'JetRandevu kullanım şartları ve koşulları.' }

export default function TermsPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Kullan?m ?artlar?</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">Kullan?m ?artlar?</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">Platformumuzu kullan?rken uyman?z gereken kurallar ve yasal ?er?eve.</p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Taraflar ve Kapsam</h2>
                <p>İşbu Kullanım Şartları ve Koşulları ("Şartlar"), JetRandevu ("Platform", "biz", "bizim") ile platformu kullanan gerçek veya tüzel kişi ("Kullanıcı", "siz") arasındaki ilişkiyi düzenler. Platformu kullanarak, bu şartları tamamen okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.</p>
                <p className="mt-2">Platform, online randevu yönetimi, müşteri takibi, ödeme işlemleri, pazarlama araçları ve işletme operasyonlarını dijitalleştirmeye yönelik diğer hizmetleri ("Hizmetler") sunmaktadır. Bu şartlar, platformun tüm özellikleri, güncellemeleri ve yeni sürümleri için geçerlidir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Hesap Kaydı ve Güvenlik</h2>

                <h3 className="text-base font-bold text-gray-900 mt-4">2.1 Kayıt Koşulları</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>En az 18 yaşında olmanız gerekmektedir.</li>
                  <li>Doğru, güncel ve eksiksiz bilgi sağlamayı kabul edersiniz.</li>
                  <li>Her bir kullanıcı için yalnızca bir hesap oluşturulabilir.</li>
                  <li>Başka bir kişi veya kurum adına kayıt oluyorsanız, bu kişi/kurum adına bağlayıcı taahhütlerde bulunma yetkiniz olduğunu beyan edersiniz.</li>
                </ul>

                <h3 className="text-base font-bold text-gray-900 mt-4">2.2 Hesap Güvenliği</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Hesap şifrenizin ve giriş bilgilerinizin gizliliğini korumaktan tamamen siz sorumlusunuz.</li>
                  <li>Hesabınız altında gerçekleşen tüm işlemlerden siz sorumlusunuz.</li>
                  <li>Hesabınızda yetkisiz kullanım veya güvenlik ihlali fark etmeniz durumunda, derhal bize bildirmeniz gerekmektedir.</li>
                  <li>Hesap güvenliğinin ihlali nedeniyle doğabilecek kayıplardan JetRandevu sorumlu tutulamaz.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Hizmet Kullanımı ve Sorumluluklar</h2>

                <h3 className="text-base font-bold text-gray-900 mt-4">3.1 Kullanıcı Yükümlülükleri</h3>
                <p>Platformu kullanırken aşağıdaki yükümlülükleri kabul edersiniz:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Platformu yalnızca yasal amaçlarla ve bu şartlara uygun şekilde kullanmak</li>
                  <li>Platformun güvenliğini veya bütünlüğünü tehlikeye atacak eylemlerden kaçınmak</li>
                  <li>Başka kullanıcıların haklarına saygı göstermek</li>
                  <li>Platform üzerinden yasa dışı, tehdit edici, taciz edici veya iftira niteliğinde içerik paylaşmamak</li>
                  <li>Platformun işleyişini bozacak otomatik araçlar (bot, scraper) kullanmamak</li>
                  <li>Müşteri verilerini KVKK ve ilgili mevzuata uygun şekilde işlemek</li>
                </ul>

                <h3 className="text-base font-bold text-gray-900 mt-4">3.2 Platform Sorumlulukları</h3>
                <p>JetRandevu aşağıdaki hususları taahhüt eder:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Hizmetleri, sektör standartlarına uygun şekilde sunmak</li>
                  <li>Makul kesinti süreleri dışında (%99,9 uptime hedefi) hizmet erişilebilirliğini sağlamak</li>
                  <li>Kullanıcı verilerini gizli tutmak ve güvenlik önlemleriyle korumak</li>
                  <li>Planlı bakım çalışmalarını önceden bildirmek</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Abonelik, Ödeme ve Faturalandırma</h2>

                <h3 className="text-base font-bold text-gray-900 mt-4">4.1 Planlar ve Ücretler</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Seçtiğiniz abonelik planına göre belirtilen ücretler, aylık veya yıllık olarak faturalandırılır.</li>
                  <li>Ücretler, KDV ve diğer yasal vergiler dahil olarak belirtilir.</li>
                  <li>JetRandevu, ücretlerde değişiklik yapma hakkını saklı tutar. Ücret değişiklikleri, en az 30 gün önceden bildirilir.</li>
                </ul>

                <h3 className="text-base font-bold text-gray-900 mt-4">4.2 Ödeme Koşulları</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Ödemeler, belirtilen ödeme tarihinde tahsil edilir.</li>
                  <li>Ödeme yapılmaması durumunda, 7 günlük ödeme süresi tanınır. Bu süre sonunda hesabınız askıya alınabilir.</li>
                  <li>30 günü aşan ödeme gecikmelerinde hesabınız kalıcı olarak kapatılabilir ve verileriniz silinebilir.</li>
                  <li>İptal durumunda, kullanılmayan günler için iade yapılmaz (aylık planlar için). Yıllık planlarda, kalan ayarlar için orantılı iade yapılır.</li>
                </ul>

                <h3 className="text-base font-bold text-gray-900 mt-4">4.3 Ücretsiz Deneme Süresi</h3>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>14 günlük ücretsiz deneme süresi boyunca herhangi bir ücret alınmaz.</li>
                  <li>Deneme süresi sonunda otomatik olarak ücretli plana geçilmez.</li>
                  <li>Deneme süresi içinde istediğiniz zaman iptal edebilirsiniz.</li>
                  <li>JetRandevu, deneme süresini uzatma veya sonlandırma hakkını saklı tutar.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Fikri Mülkiyet Hakları</h2>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Platform Mülkiyeti:</strong> JetRandevu platformuna ait tüm yazılım, kod, tasarım, logo, marka, grafik ve içerikler ("Fikri Mülkiyet"), JetRandevu'a aittir ve telif hakkı, ticari marka ve diğer fikri mülkiyet yasalarıyla korunmaktadır.</li>
                  <li><strong>Kullanım Lisansı:</strong> Size, platformu kullanmanız için sınırlı, kişisel, devredilemez ve münhasır olmayan bir lisans verilmektedir. Bu lisans, platformu kendi işletmeniz için kullanma hakkını içerir.</li>
                  <li><strong>Kısıtlamalar:</strong> Platformun herhangi bir bölümünü kopyalayamaz, değiştiremez, tersine mühendislik yapamaz, dağıtamaz veya ticari olarak yeniden satamazsınız.</li>
                  <li><strong>Kullanıcı İçeriği:</strong> Platform üzerinden oluşturduğunuz içerikler (müşteri listeleri, randevu verileri, özel ayarlar) size aittir. JetRandevu, bu verileri yalnızca hizmet sunumu amacıyla işler.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Sorumluluk Sınırlamaları</h2>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Platform, "olduğu gibi" ve "mevcut olduğu şekilde" temelinde sunulmaktadır. Açık veya zımni hiçbir garanti verilmemektedir.</li>
                  <li>JetRandevu, hizmetin kesintisiz, hatasız veya güvenli olacağını garanti etmez.</li>
                  <li>JetRandevu, aşağıdaki durumlardan kaynaklanan zararlardan sorumlu değildir:
                    <ul className="list-circle pl-5 mt-1 space-y-0.5">
                      <li>Hizmet kullanımından doğan dolaylı, tesadüfi, özel veya cezai zararlar</li>
                      <li>Veri kaybı veya veri bütünlüğünün bozulması</li>
                      <li>Üçüncü taraf hizmet sağlayıcı kaynaklı kesintiler</li>
                      <li>Mücbir sebepler (doğal afet, savaş, grev, internet altyapı kesintileri)</li>
                    </ul>
                  </li>
                  <li>Yürürlükteki yasaların izin verdiği azami ölçüde, JetRandevu'ın toplam sorumluluğu, son 12 ayda ödediğiniz toplam ücreti aşamaz.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Müşteri Verileri ve Sorumluluk</h2>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>İşletmenize randevu alan müşterilerinizin kişisel verilerinin korunmasından siz sorumlusunuz.</li>
                  <li>Müşteri verilerini toplarken ve işlerken KVKK başta olmak üzere ilgili tüm mevzuata uygun hareket etmekle yükümlüsünüz.</li>
                  <li>JetRandevu, bu kapsamda bir veri işleyen (data processor) olarak hareket eder; siz veri sorumlusu (data controller) olarak kabul edilirsiniz.</li>
                  <li>Müşteri verilerinizin üçüncü taraflarla paylaşılması durumunda, bu paylaşıma ilişkin yasal yükümlülükler (açık rıza, aydınlatma) size aittir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Hesap Feshi ve Askıya Alma</h2>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Sizin Tarafınızdan Fesih:</strong> Hesabınızı istediğiniz zaman panel üzerinden veya destek ekibimize başvurarak kapatabilirsiniz.</li>
                  <li><strong>Bizim Tarafımızdan Fesih:</strong> Bu şartları ihlal etmeniz durumunda, önceden bildirim yaparak hesabınızı askıya alma veya kalıcı olarak kapatma hakkımız saklıdır.</li>
                  <li><strong>Fesih Sonuçları:</strong> Hesap kapatıldıktan sonra, yasal saklama yükümlülükleri dışındaki verileriniz 30 gün içinde silinir. Bu süre içinde hesabınızı geri aktive etmek için talepte bulunabilirsiniz.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Değişiklikler ve Güncellemeler</h2>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Bu kullanım şartları, platform güncellemeleri, mevzuat değişiklikleri ve iş gereksinimleri doğrultusunda değiştirilebilir.</li>
                  <li>Önemli değişiklikler, e-posta yoluyla veya platform üzerinden en az 15 gün önceden bildirilir.</li>
                  <li>Değişikliklerin ardından platformu kullanmaya devam etmeniz, güncellenen şartları kabul ettiğiniz anlamına gelir.</li>
                  <li>Değişiklikleri kabul etmemeniz durumunda, hesabınızı kapatma hakkına sahipsiniz.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Uygulanacak Hukuk ve Yetki</h2>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Bu şartlar, Türkiye Cumhuriyeti yasalarına tabidir ve Türkçe yorumlanır.</li>
                  <li>Doğabilecek uyuşmazlıklarda İstanbul (Merkez) Mahkemeleri ve İcra Daireleri yetkilidir.</li>
                  <li>Uyuşmazlıkların çözümünde öncelikle arabuluculuk yoluna başvurulması esastır.</li>
                  <li>Tüketici işlemleri kapsamında, tüketicinin yerleşik olduğu yerdeki tüketici mahkemeleri de yetkilidir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">11. İletişim</h2>
                <p>Kullanım şartları hakkında sorularınız, önerileriniz veya talepleriniz için bize aşağıdaki kanallardan ulaşabilirsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>E-posta:</strong> info@jetrandevu.com</li>
                  <li><strong>Adres:</strong> Maslak Mahallesi, Büyükdere Caddesi No:237, 34485 Sarıyer/İstanbul</li>
                  <li><strong>Destek:</strong> jetrandevu.com/iletisim</li>
                </ul>
                <p className="mt-3 text-gray-500 text-xs">Son güncelleme: 15 Mayıs 2026</p>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
