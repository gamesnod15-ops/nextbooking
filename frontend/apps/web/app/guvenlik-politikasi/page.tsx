﻿import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Güvenlik Politikası — NextBooking', description: 'NextBooking bilgi güvenliği politikası ve uygulamaları.' }

export default function GuvenlikPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">G?venlik Politikas?</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">G?venlik Politikas?</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">Bilgi g?venli?i y?netim sistemimiz ve uygulad???m?z g?venlik ?nlemleri.</p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Giriş ve Kapsam</h2>
                <p>NextBooking (nextbooking.com) olarak, bilgi güvenliğine en üst düzeyde önem vermekteyiz. Bu Güvenlik Politikası, platformumuzda işlenen tüm verilerin gizliliğini, bütünlüğünü ve erişilebilirliğini sağlamak amacıyla uyguladığımız teknik ve idari tedbirleri açıklamaktadır.</p>
                <p className="mt-2">Bu politika, NextBooking platformunu kullanan tüm işletmeler, çalışanlar, müşteriler ve diğer tüm paydaşlar için geçerlidir. Bilgi güvenliği yönetim sistemimiz, uluslararası standartlar (ISO 27001) ve yerel mevzuat (KVKK, Türk Ticaret Kanunu) çerçevesinde yapılandırılmıştır.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Fiziksel Güvenlik</h2>
                <p>Sunucu altyapımız, Türkiye içerisinde bulunan ISO 27001 sertifikalı veri merkezlerinde barındırılmaktadır. Fiziksel güvenlik önlemlerimiz şunları içerir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>7/24 fiziksel güvenlik ve gözetim (CCTV kaydı)</li>
                  <li>Çok faktörlü biyometrik erişim kontrol sistemleri</li>
                  <li>Yangın algılama ve söndürme sistemleri</li>
                  <li>Kesintisiz güç kaynakları (UPS) ve yedek jeneratör altyapısı</li>
                  <li>İklimlendirme ve sıcaklık kontrol sistemleri</li>
                  <li>Yetkisiz fiziksel erişime karşı kilitli sunucu kabinleri</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Ağ ve İletişim Güvenliği</h2>
                <p>Tüm veri iletişimlerimiz, endüstri standardı şifreleme protokolleri ile korunmaktadır:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>SSL/TLS Şifreleme:</strong> Web sitemiz ve API'lerimiz arasındaki tüm iletişim TLS 1.3 protokolü ile şifrelenmektedir.</li>
                  <li><strong>Uçtan Uca Şifreleme:</strong> Hassas veriler (parolalar, ödeme bilgileri) uçtan uca şifrelenerek iletilir.</li>
                  <li><strong>Güvenlik Duvarları:</strong> Çok katmanlı güvenlik duvarı (WAF ve ağ katmanı) ile yetkisiz erişimler engellenir.</li>
                  <li><strong>DDoS Koruması:</strong> Dağıtık hizmet engelleme saldırılarına karşı otomatik koruma sistemleri aktiftir.</li>
                  <li><strong>VPN Erişimi:</strong> Sistem yöneticilerimiz yalnızca VPN üzerinden yetkili ağlara erişebilir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Veri Şifreleme ve Depolama</h2>
                <p>Verileriniz, hem hareketsiz halde (at rest) hem de iletim sırasında (in transit) şifrelenmektedir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Veritabanı Şifrelemesi:</strong> Tüm veritabanlarımız AES-256 algoritması ile şifrelenmiştir.</li>
                  <li><strong>Parola Güvenliği:</strong> Parolalar, bcrypt algoritması ile hashlenerek saklanır. Hiçbir parola düz metin olarak saklanmaz.</li>
                  <li><strong>Ödeme Verileri:</strong> Ödeme kartı bilgileri platformumuzda saklanmaz. PCI DSS uyumlu ödeme hizmet sağlayıcıları (İyzico, Stripe) aracılığıyla işlenir.</li>
                  <li><strong>Yedekleme:</strong> Verilerimiz düzenli olarak şifrelenmiş yedekleme sistemlerine alınır. Yedekler coğrafi olarak farklı konumlarda saklanır.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Erişim Kontrolü ve Yetkilendirme</h2>
                <p>Bilgiye erişim, en az ayrıcalık prensibi (least privilege) ile yönetilmektedir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Rol Tabanlı Erişim Kontrolü (RBAC):</strong> Her kullanıcı, yalnızca görev tanımına uygun verilere erişebilir.</li>
                  <li><strong>Çok Faktörlü Kimlik Doğrulama (MFA):</strong> Yönetici panellerine erişim için MFA zorunludur.</li>
                  <li><strong>Oturum Yönetimi:</strong> Oturumlar belirli bir süre sonra otomatik olarak sonlandırılır.</li>
                  <li><strong>Erişim Logları:</strong> Tüm erişimler detaylı şekilde loglanır ve düzenli olarak analiz edilir.</li>
                  <li><strong>Periyodik Erişim İncelemesi:</strong> Kullanıcı yetkileri her 3 ayda bir gözden geçirilir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Uygulama Güvenliği</h2>
                <p>Platformumuzun güvenliğini sağlamak için yazılım geliştirme yaşam döngüsü boyunca çeşitli önlemler uygulanmaktadır:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Güvenli Kod Geliştirme:</strong> OWASP Top 10 güvenlik standartlarına uygun kod geliştirme süreci.</li>
                  <li><strong>Düzenli Güvenlik Taramaları:</strong> Haftalık otomatik zafiyet taramaları ve aylık penetrasyon testleri.</li>
                  <li><strong>Bağımlılık Yönetimi:</strong> Kullanılan tüm kütüphaneler düzenli olarak güvenlik açıklarına karşı taranır.</li>
                  <li><strong>SQL Enjeksiyon Koruması:</strong> Tüm veritabanı sorguları parametrize edilerek SQL enjeksiyon saldırıları önlenir.</li>
                  <li><strong>XSS Koruması:</strong> Çapraz site betik çalıştırma saldırılarına karşı içerik çıkışları temizlenir.</li>
                  <li><strong>Rate Limiting:</strong> API uç noktalarımızda hız sınırlaması uygulanarak brute force saldırıları engellenir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. Olay Yönetimi ve Müdahale</h2>
                <p>Olası güvenlik olaylarına hızlı ve etkili müdahale edebilmek için kapsamlı bir olay yönetimi sürecimiz bulunmaktadır:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>7/24 Güvenlik İzleme (SIEM):</strong> Tüm sistem logları merkezi bir SIEM platformunda toplanır ve anomali tespiti için analiz edilir.</li>
                  <li><strong>Olay Müdahale Ekibi (CSIRT):</strong> Uzman güvenlik ekibimiz, olası güvenlik olaylarına 7/24 müdahale etmeye hazırdır.</li>
                  <li><strong>Bildirim Prosedürü:</strong> Güvenlik ihlali durumunda, etkilenen kullanıcılara 72 saat içinde bildirim yapılır.</li>
                  <li><strong>Adli Bilişim:</strong> Olay sonrası detaylı adli bilişim incelemesi yapılarak kök neden analizi gerçekleştirilir.</li>
                  <li><strong>İyileştirme:</strong> Tespit edilen zafiyetler, önceliklendirilerek en kısa sürede giderilir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">8. Üçüncü Taraf Güvenliği</h2>
                <p>İş birliği yaptığımız tüm üçüncü taraf hizmet sağlayıcıları, yüksek güvenlik standartlarımıza uygun olmalıdır:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Tüm üçüncü taraflar düzenli güvenlik değerlendirmesine tabi tutulur.</li>
                  <li>Veri işleme anlaşmaları (DPA) imzalanır ve güvenlik şartları sözleşmelerde belirtilir.</li>
                  <li>Bulut hizmet sağlayıcılarımız uluslararası güvenlik sertifikalarına (ISO 27001, SOC 2) sahiptir.</li>
                  <li>Üçüncü taraf erişimleri düzenli olarak denetlenir ve gereksiz yetkiler iptal edilir.</li>
                  <li>Ödeme hizmet sağlayıcılarımız PCI DSS Seviye 1 sertifikalıdır.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">9. Çalışan Güvenliği ve Farkındalık</h2>
                <p>Bilgi güvenliği kültürünü kurum genelinde yaygınlaştırmak için:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Tüm çalışanlarımız işe başlarken gizlilik sözleşmesi (NDA) imzalar.</li>
                  <li>Yılda en az 2 kez bilgi güvenliği farkındalık eğitimi düzenlenir.</li>
                  <li>Düzenli sosyal mühendislik simülasyonları (phishing testleri) gerçekleştirilir.</li>
                  <li>Güvenlik ihlali bildirim mekanizmaları çalışanlara açıktır.</li>
                  <li>İşten ayrılan çalışanların tüm erişim yetkileri anında iptal edilir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">10. Uyumluluk ve Denetim</h2>
                <p>Güvenlik politikamızın etkinliğini sağlamak için düzenli denetimler gerçekleştirilmektedir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>İç Denetim:</strong> Bilgi güvenliği yönetim sistemi yılda en az 1 kez iç denetime tabi tutulur.</li>
                  <li><strong>Dış Denetim:</strong> Bağımsız güvenlik firmaları tarafından yıllık penetrasyon testleri ve güvenlik denetimleri yapılır.</li>
                  <li><strong>Yasal Uyum:</strong> KVKK, GDPR, Türk Ticaret Kanunu ve ilgili diğer mevzuata tam uyum sağlanmaktadır.</li>
                  <li><strong>ISO 27001:</strong> Bilgi güvenliği yönetim sistemimiz ISO 27001 standardına uygun olarak yapılandırılmıştır.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">11. Güvenlik Açığı Bildirimi</h2>
                <p>Platformumuzda bir güvenlik açığı tespit etmeniz durumunda, sorumlu açıklama (responsible disclosure) prensipleri çerçevesinde aşağıdaki iletişim kanallarından bize bildirim yapabilirsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>E-posta:</strong> security@nextbooking.com</li>
                  <li><strong>Web:</strong> nextbooking.com/security</li>
                </ul>
                <p className="mt-3">Bildiriminizi aldıktan sonra, zafiyeti doğrulamak ve gidermek için gerekli çalışmaları başlatırız. Tüm bildirimler gizli tutulur ve bildirimde bulunan kişinin kimliği, izni olmadan üçüncü taraflarla paylaşılmaz. Sorumlu açıklama yapan araştırmacılara, politika çerçevesinde takdir yetkimiz dahilinde ödül verilebilir.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">12. Politika İhlalleri ve Yaptırımlar</h2>
                <p>Bu güvenlik politikasının ihlali durumunda aşağıdaki yaptırımlar uygulanabilir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Çalışanlar için: Disiplin prosedürü, erişim yetkilerinin kısıtlanması, iş akdinin feshi</li>
                  <li>Üçüncü taraflar için: Sözleşme feshi, hukuki yaptırım, cezai şart</li>
                  <li>Yasal ihlallerde: İlgili mercilere (KVKK Kurulu, Siber Suçlarla Mücadele) bildirim</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">13. Politika Güncellemeleri ve Revizyon</h2>
                <p>Bu Güvenlik Politikası, aşağıdaki durumlarda güncellenir:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>Yeni güvenlik tehditleri ve zafiyetlerin ortaya çıkması</li>
                  <li>Yasal düzenleme değişiklikleri</li>
                  <li>Teknolojik altyapı değişiklikleri</li>
                  <li>İş süreçlerinde önemli değişiklikler</li>
                  <li>Denetim sonuçları ve iyileştirme önerileri</li>
                </ul>
                <p className="mt-3">Politika revizyonları, güncelleme tarihi ve değişiklik özeti ile birlikte bu sayfada yayımlanır. Önemli değişiklikler, kullanıcılarımıza e-posta yoluyla bildirilir.</p>
                <p className="mt-2 text-gray-500 text-xs">Son güncelleme: 31 Mayıs 2026 | Revizyon: 1.0</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">14. İletişim</h2>
                <p>Güvenlik politikamız hakkında soru, görüş veya endişeleriniz için aşağıdaki kanallardan bizimle iletişime geçebilirsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>E-posta:</strong> security@nextbooking.com</li>
                  <li><strong>KVKK E-posta:</strong> kvkk@nextbooking.com</li>
                  <li><strong>Telefon:</strong> +90 (212) 444 0 789</li>
                  <li><strong>Adres:</strong> Maslak Mahallesi, Büyükdere Caddesi No:237, 34485 Sarıyer/İstanbul</li>
                </ul>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
