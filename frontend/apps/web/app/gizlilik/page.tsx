﻿import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Gizlilik Politikası — NextBooking', description: 'NextBooking gizlilik politikası.' }

export default function PrivacyPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Gizlilik Politikas?</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">Gizlilik Politikas?</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">Ki?isel verilerinizin gizlili?i ve g?venli?i hakk?nda kapsaml? bilgi.</p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Giriş ve Kapsam</h2>
                <p>NextBooking ("biz", "bizim", "platform") olarak, kullanıcılarımızın ve ziyaretçilerimizin gizliliğine büyük önem vermekteyiz. İşbu Gizlilik Politikası, platformumuzu kullanırken hangi bilgilerin toplandığını, bu bilgilerin nasıl kullanıldığını, saklandığını, korunduğunu ve paylaşıldığını açıklamaktadır.</p>
                <p className="mt-2">Bu politika, NextBooking web sitesini (nextbooking.com), mobil uygulamalarını ve alt alan adlarını kapsamaktadır. Platformumuzu kullanarak, bu politikada belirtilen veri toplama ve kullanım uygulamalarını kabul etmiş sayılırsınız.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Toplanan Bilgiler</h2>

                <h3 className="text-base font-bold text-gray-900 mt-4">2.1 Hesap Bilgileri</h3>
                <p>Hesap oluşturduğunuzda aşağıdaki bilgileri sağlamanız gerekmektedir:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Ad ve soyad</li>
                  <li>E-posta adresi</li>
                  <li>Telefon numarası</li>
                  <li>İşletme adı ve adresi</li>
                  <li>İşletme kategorisi</li>
                  <li>Şifre (hashlenmiş olarak saklanır)</li>
                </ul>

                <h3 className="text-base font-bold text-gray-900 mt-4">2.2 Otomatik Toplanan Bilgiler</h3>
                <p>Platformumuzu kullandığınızda, aşağıdaki bilgiler otomatik olarak toplanabilir:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li><strong>Kullanım Verileri:</strong> Ziyaret edilen sayfalar, tıklama davranışları, site içinde geçirilen süre, randevu alma işlemleri</li>
                  <li><strong>Cihaz Bilgileri:</strong> IP adresi, tarayıcı türü ve sürümü, işletim sistemi, cihaz türü (mobil/desktop)</li>
                  <li><strong>Konum Bilgileri:</strong> Genel coğrafi konum (şehir/ülke düzeyinde, IP adresinden türetilen)</li>
                  <li><strong>Çerezler ve Benzer Teknolojiler:</strong> Detaylı bilgi için Çerez Politikamızı inceleyebilirsiniz</li>
                </ul>

                <h3 className="text-base font-bold text-gray-900 mt-4">2.3 Ödeme Bilgileri</h3>
                <p>Ödeme işlemleri, güvenli üçüncü taraf ödeme hizmet sağlayıcıları (İyzico, Stripe) tarafından işlenmektedir. Kredi kartı bilgileriniz tarafımızca görülmez veya saklanmaz. Ödeme sağlayıcıları, PCI DSS (Payment Card Industry Data Security Standard) uyumlu olarak çalışmaktadır.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Bilgilerin Kullanım Amaçları</h2>
                <p>Toplanan bilgiler aşağıdaki amaçlarla kullanılmaktadır:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Hizmet Sunumu:</strong> Hesabınızı yönetmek, randevu sistemini çalıştırmak, müşteri verilerinizi işlemek ve raporlama yapmak</li>
                  <li><strong>İletişim:</strong> Hesap bildirimleri, hizmet güncellemeleri, destek talepleri ve pazarlama iletişimleri (açık izninizle)</li>
                  <li><strong>Güvenlik:</strong> Hesap güvenliğini sağlamak, şüpheli aktiviteleri tespit etmek ve önlemek</li>
                  <li><strong>Analiz ve İyileştirme:</strong> Kullanıcı davranışlarını analiz ederek platform deneyimini iyileştirmek, yeni özellikler geliştirmek</li>
                  <li><strong>Yasal Uyum:</strong> Kanuni yükümlülükleri yerine getirmek, yasal taleplere yanıt vermek</li>
                  <li><strong>Kişiselleştirme:</strong> Size özel içerik, öneri ve kampanyalar sunmak</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Bilgi Paylaşımı ve Aktarımı</h2>
                <p>Kişisel bilgileriniz, aşağıda belirtilen durumlar dışında üçüncü taraflarla paylaşılmaz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Hizmet Sağlayıcılar:</strong> Platformumuzun çalışması için gerekli olan üçüncü taraf hizmet sağlayıcıları (barındırma, e-posta, SMS, ödeme işleme, analitik) ile sınırlı amaçlarla paylaşılır. Bu sağlayıcılar, verilerinizi yalnızca bizim talimatlarımız doğrultusunda kullanmakla yükümlüdür.</li>
                  <li><strong>Yasal Zorunluluklar:</strong> Kanunen zorunlu olduğunda, mahkeme kararı veya resmi makam talebi doğrultusunda bilgileriniz paylaşılabilir.</li>
                  <li><strong>İşletme Müşterileriniz:</strong> Randevu alan müşterilerinizle ilgili veriler, yalnızca işletme operasyonlarınızın yürütülmesi amacıyla işlenir. Müşteri verileriniz, üçüncü taraflarla izniniz olmadan paylaşılmaz.</li>
                  <li><strong>Ortaklık ve Satın Alma:</strong> Şirket satın alması, birleşmesi veya varlık satışı durumunda, kullanıcı bilgileri devralan şirkete aktarılabilir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Veri Saklama ve Silme</h2>
                <p>Kişisel verileriniz, aşağıdaki kriterlere göre saklanmaktadır:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Aktif hesaplar:</strong> Hesabınız aktif olduğu sürece verileriniz saklanır</li>
                  <li><strong>Silinen hesaplar:</strong> Hesabınızı sildikten sonra, yasal yükümlülükler (vergi, ticaret kanunu) kapsamında gerekli olan veriler 10 yıla kadar saklanabilir</li>
                  <li><strong>Analitik veriler:</strong> Anonimleştirilmiş kullanım verileri, istatistiksel amaçlarla süresiz olarak saklanabilir</li>
                </ul>
                <p className="mt-2">Hesabınızı silmek isterseniz, panel üzerinden veya destek ekibimize başvurarak talebinizi iletebilirsiniz. Hesap silme işlemi, belirli verilerin (faturalar, işlem kayıtları) yasal zorunluluklar gereği saklanması dışında, kişisel verilerinizin büyük ölçüde silinmesini sağlar.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Veri Güvenliği</h2>
                <p>Kişisel verilerinizi korumak için aşağıdaki teknik ve idari tedbirleri uygulamaktayız:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Şifreleme:</strong> Tüm veri iletimleri SSL/TLS (256-bit) protokolü ile şifrelenir. Parolalarınız bcrypt algoritması ile hashlenerek saklanır.</li>
                  <li><strong>Erişim Kontrolü:</strong> Verilerinize yalnızca yetkili personel erişebilir. Rol tabanlı erişim kontrol sistemimiz bulunmaktadır.</li>
                  <li><strong>Altyapı Güvenliği:</strong> Sunucularımız, fiziksel güvenlik önlemleriyle korunan, 7/24 izlenen veri merkezlerinde barındırılmaktadır.</li>
                  <li><strong>Düzenli Denetim:</strong> Güvenlik açıkları düzenli olarak taranır, sızma testleri gerçekleştirilir ve güvenlik güncellemeleri anında uygulanır.</li>
                  <li><strong>Yedekleme:</strong> Verileriniz düzenli olarak yedeklenir ve olağanüstü durum kurtarma planları bulunmaktadır.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Kullanıcı Hakları</h2>
                <p>Yürürlükteki veri koruma mevzuatı kapsamında aşağıdaki haklara sahipsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Erişim Hakkı:</strong> Hangi kişisel verilerinizin işlendiğini öğrenme ve bunların bir kopyasını talep etme</li>
                  <li><strong>Düzeltme Hakkı:</strong> Eksik veya yanlış işlenmiş verilerinizin düzeltilmesini isteme</li>
                  <li><strong>Silme Hakkı ("Unutulma Hakkı"):</strong> Belirli koşullar altında verilerinizin silinmesini talep etme</li>
                  <li><strong>İşlemeyi Kısıtlama Hakkı:</strong> Belirli durumlarda verilerinizin işlenmesinin kısıtlanmasını isteme</li>
                  <li><strong>Veri Taşınabilirliği Hakkı:</strong> Verilerinizi yapılandırılmış, yaygın olarak kullanılan bir formatta talep etme</li>
                  <li><strong>İtiraz Hakkı:</strong> Kişisel verilerinizin belirli amaçlarla işlenmesine itiraz etme</li>
                  <li><strong>Rıza Geri Çekme:</strong> Açık rızanıza dayalı işlemeler için rızanızı istediğiniz zaman geri çekme</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Üçüncü Taraf Bağlantıları</h2>
                <p>Platformumuz, üçüncü taraf web sitelerine bağlantılar içerebilir (örneğin, sosyal medya butonları, ödeme sayfaları). Bu bağlantılar, üçüncü taraf sitelerin gizlilik uygulamalarını kapsamamaktadır. Bu sitelerin kendi gizlilik politikalarını incelemenizi öneririz. NextBooking, üçüncü taraf sitelerin veri toplama uygulamalarından sorumlu değildir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Politika Değişiklikleri</h2>
                <p>Bu gizlilik politikası, zaman zaman güncellenebilir. Önemli değişiklikler, e-posta yoluyla veya platform üzerinden bildirilecektir. Politikanın en son güncellenme tarihi, sayfanın alt kısmında belirtilmektedir. Değişikliklerin ardından platformu kullanmaya devam etmeniz, güncellenen politikayı kabul ettiğiniz anlamına gelir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. İletişim</h2>
                <p>Gizlilik politikamız hakkında sorularınız, endişeleriniz veya talepleriniz için bize aşağıdaki kanallardan ulaşabilirsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>E-posta:</strong> privacy@nextbooking.com</li>
                  <li><strong>Adres:</strong> Maslak Mahallesi, Büyükdere Caddesi No:237, 34485 Sarıyer/İstanbul</li>
                  <li><strong>Web:</strong> nextbooking.com/iletisim</li>
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
