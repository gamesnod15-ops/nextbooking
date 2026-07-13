﻿import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

export const metadata = { title: 'Çerez Politikası — NextBooking', description: 'NextBooking çerez politikası.' }

export default function CerezPolicyPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">?erez Politikas?</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">?erez Politikas?</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">Sitemizde kullan?lan ?erezler ve veri toplama y?ntemleri hakk?nda bilgi.</p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">1. Çerez Nedir ve Ne Amaçla Kullanılır?</h2>
                <p>Çerezler (cookies), bir web sitesini ziyaret ettiğinizde tarayıcınız (Chrome, Safari, Firefox vb.) aracılığıyla cihazınızda depolanan küçük metin dosyalarıdır. Bu dosyalar, web sitemizin sizi hatırlamasına, tercihlerinizi kaydetmesine ve size daha iyi bir kullanıcı deneyimi sunmasına olanak tanır.</p>
                <p className="mt-2">Çerezler genellikle, web sitelerinin verimli bir şekilde çalışmasını sağlamak, oturumları yönetmek, kullanıcı tercihlerini hatırlamak ve site trafiğini analiz etmek gibi temel işlevler için kullanılır. Çerezler, kişisel bilgilerinizi izniniz olmadan toplamaz ve genellikle anonim olarak çalışır.</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">2. Kullandığımız Çerez Türleri</h2>

                <div className="mt-4 space-y-6">
                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-black">1</span>
                      Zorunlu (Teknik) Çerezler
                    </h3>
                    <p className="mt-2">Bu çerezler, web sitemizin düzgün çalışması için kesinlikle gereklidir. Oturum yönetimi, güvenlik önlemleri ve site temel işlevlerinin sağlanması amacıyla kullanılır. Bu çerezleri devre dışı bırakmanız durumunda web sitemizin bazı bölümleri düzgün çalışmayabilir.</p>
                    <p className="mt-1 text-xs text-gray-500">Örnek kullanım: Oturum açık kalma süresi, güvenlik tokenları, sayfa gezinme bilgileri.</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-black">2</span>
                      Analitik ve Performans Çerezleri
                    </h3>
                    <p className="mt-2">Bu çerezler, ziyaretçilerin web sitemizi nasıl kullandığını anlamamıza yardımcı olur. Hangi sayfaların en çok ziyaret edildiği, kullanıcıların sitede ne kadar süre geçirdiği, hangi yönlendirme kanallarının etkili olduğu gibi anonim istatistiksel veriler toplarız.</p>
                    <p className="mt-1 text-xs text-gray-500">Kullandığımız araçlar: Google Analytics 4, Microsoft Clarity.</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-black">3</span>
                      İşlevsellik ve Tercih Çerezleri
                    </h3>
                    <p className="mt-2">Bu çerezler, web sitemizde yaptığınız tercihleri (dil seçeneği, bölge, bildirim tercihleri gibi) hatırlayarak size kişiselleştirilmiş bir deneyim sunmamızı sağlar. Bu çerezlerin sağladığı bilgiler anonimleştirilebilir.</p>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-black">4</span>
                      Pazarlama ve Hedefleme Çerezleri
                    </h3>
                    <p className="mt-2">Bu çerezler, ilgi alanlarınıza uygun reklam ve içerikleri size göstermek için kullanılır. Ziyaret alışkanlıklarınızı takip ederek, sizin için daha anlamlı olacak kampanya ve tanıtımları belirlememize yardımcı olur. Bu çerezler, üçüncü taraf reklam ağları tarafından yerleştirilebilir.</p>
                    <p className="mt-1 text-xs text-gray-500">Kullandığımız araçlar: Google Ads, Meta Pixel, LinkedIn Insight Tag.</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">3. Çerezlerin Saklanma Süresi</h2>
                <p>Çerezler, cihazınızda saklanma sürelerine göre iki kategoriye ayrılır:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Oturum Çerezleri:</strong> Tarayıcınızı kapattığınızda otomatik olarak silinen geçici çerezlerdir. Yalnızca oturumunuz süresince geçerlidir.</li>
                  <li><strong>Kalıcı Çerezler:</strong> Belirli bir süre boyunca (genellikle 30 gün ile 2 yıl arası) cihazınızda saklanan çerezlerdir. Bu süre sonunda otomatik olarak silinir veya güncellenir.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">4. Çerez Tercihlerinizi Yönetme</h2>
                <p>Çerez tercihlerinizi aşağıdaki yöntemlerle istediğiniz zaman kontrol edebilir ve değiştirebilirsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Tarayıcı Ayarları:</strong> Kullandığınız tarayıcının ayarlar menüsünden tüm çerezleri engelleyebilir, belirli çerez türlerine izin verebilir veya geçmiş çerezleri silebilirsiniz. Her tarayıcının çerez yönetimi farklıdır:
                    <ul className="list-circle pl-5 mt-1 space-y-0.5">
                      <li>Chrome: Ayarlar &gt; Gizlilik ve Güvenlik &gt; Çerezler ve diğer site verileri</li>
                      <li>Safari: Tercihler &gt; Gizlilik &gt; Çerezleri engelle</li>
                      <li>Firefox: Seçenekler &gt; Gizlilik & Güvenlik &gt; Çerezler</li>
                    </ul>
                  </li>
                  <li><strong>Platform İçi Yönetim:</strong> Web sitemizi ilk ziyaretinizde görüntülenen çerez bildirim panelinden hangi çerez türlerine izin vereceğinizi seçebilirsiniz.</li>
                  <li><strong>Üçüncü Taraf Araçlar:</strong> YourOnlineChoices.com gibi platformlar üzerinden tercihlerinizi yönetebilirsiniz.</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">5. Üçüncü Taraf Çerezleri</h2>
                <p>Web sitemizde, aşağıdaki üçüncü taraf hizmet sağlayıcılarına ait çerezler kullanılmaktadır. Bu hizmet sağlayıcıların çerez politikalarına ilgili bağlantılardan ulaşabilirsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li><strong>Google:</strong> Analytics, Ads - <span className="text-brand-500">policies.google.com/privacy</span></li>
                  <li><strong>Meta:</strong> Pixel, Reklam Dönüşümleri - <span className="text-brand-500">meta.com/privacy</span></li>
                  <li><strong>Microsoft:</strong> Clarity - <span className="text-brand-500">privacy.microsoft.com</span></li>
                  <li><strong>LinkedIn:</strong> Insight Tag - <span className="text-brand-500">linkedin.com/legal/privacy</span></li>
                  <li><strong>Stripe:</strong> Ödeme işlemleri - <span className="text-brand-500">stripe.com/privacy</span></li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">6. Değişiklikler ve Güncellemeler</h2>
                <p>Bu çerez politikası, kullanılan çerez türlerindeki değişiklikler, mevzuat güncellemeleri ve platform iyileştirmeleri doğrultusunda periyodik olarak güncellenmektedir. Önemli değişiklikler e-posta yoluyla veya web sitemiz üzerinden bildirilecektir.</p>
                <p className="mt-2 text-gray-500 text-xs">Son güncelleme: 15 Mayıs 2026</p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">7. İletişim</h2>
                <p>Çerez politikamız hakkında sorularınız, önerileriniz veya talepleriniz için bizimle iletişime geçebilirsiniz:</p>
                <ul className="list-disc pl-5 space-y-1.5 mt-2">
                  <li>E-posta: info@nextbooking.com</li>
                  <li>Adres: Maslak Mahallesi, Büyükdere Caddesi No:237, 34485 Sarıyer/İstanbul</li>
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
