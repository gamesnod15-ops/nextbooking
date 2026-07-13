import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, ArrowLeft } from 'lucide-react'

const posts = [
  {
    slug: 'online-randevu-musteri-memnuniyeti',
    title: 'Online Randevu Sistemi ile Müşteri Memnuniyetini Artırın',
    date: '15 Mayıs 2026',
    category: 'Dijital Dönüşüm',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=400&fit=crop',
    content: `
      <p>Müşteri memnuniyeti, her işletmenin öncelikli hedefidir. Online randevu sistemi, müşterilerinize 7/24 randevu alma imkanı sunarak memnuniyeti doğrudan etkiler.</p>
      <h2>Neden Online Randevu Sistemi?</h2>
      <p>Geleneksel telefonla randevu yöntemleri, hem işletme sahipleri hem de müşteriler için zaman kaybına neden olur. Online randevu sistemi ile müşterileriniz diledikleri zaman, diledikleri yerden randevu alabilirler.</p>
      <ul>
        <li><strong>7/24 Erişim:</strong> Müşterileriniz gece yarısı bile randevu alabilir.</li>
        <li><strong>Otomatik Hatırlatmalar:</strong> SMS ve e-posta ile randevu hatırlatmaları sayesinde no-show oranları düşer.</li>
        <li><strong>Takvim Senkronizasyonu:</strong> Randevular otomatik olarak takviminize eklenir.</li>
      </ul>
      <h2>Müşteri Memnuniyetini Artırmanın Yolları</h2>
      <p>Online randevu sistemi kullanarak müşteri memnuniyetini artırmak için şu adımları izleyebilirsiniz:</p>
      <ol>
        <li>Randevu onayı ve hatırlatma mesajları gönderin</li>
        <li>Müşteri tercihlerine göre hizmet önerileri sunun</li>
        <li>Randevu sonrası geri bildirim alın</li>
        <li>Sadakat programı ile tekrar eden müşterileri ödüllendirin</li>
      </ol>
      <p>NextBooking ile müşteri memnuniyetinizi bir üst seviyeye taşıyın. Dijital dönüşümün avantajlarından yararlanarak işletmenizi büyütün.</p>
    `,
  },
  {
    slug: 'kuafor-dijital-pazarlama',
    title: 'Kuaförünüz İçin Dijital Pazarlama Stratejileri',
    date: '8 Mayıs 2026',
    category: 'Pazarlama',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop',
    content: `
      <p>Günümüzde kuaför ve güzellik salonlarının başarısı, dijital pazarlama stratejilerine ne kadar yatırım yaptıklarıyla doğru orantılıdır.</p>
      <h2>Dijital Pazarlamanın Önemi</h2>
      <p>Potansiyel müşterileriniz, hizmet arayışlarında ilk olarak internete başvuruyor. Google'da üst sıralarda yer almak ve sosyal medyada aktif olmak, yeni müşteri kazanmanın anahtarıdır.</p>
      <h2>Etkili Stratejiler</h2>
      <ul>
        <li><strong>Sosyal Medya Yönetimi:</strong> Instagram ve TikTok'ta düzenli içerik paylaşarak görünürlüğünüzü artırın.</li>
        <li><strong>Google My Business:</strong> İşletme profilinizi optimize ederek yerel aramalarda öne çıkın.</li>
        <li><strong>Müşteri Yorumları:</strong> Memnun müşterilerinizi Google ve sosyal medyada yorum bırakmaya teşvik edin.</li>
        <li><strong>Online Randevu Sistemi:</strong> NextBooking ile web sitenize entegre randevu alma imkanı sunun.</li>
      </ul>
      <p>Başarılı bir dijital pazarlama stratejisi ile müşteri sayınızı katlayabilir, marka bilinirliğinizi artırabilirsiniz.</p>
    `,
  },
  {
    slug: 'verimlilik-araclari',
    title: 'İşletmenizde Verimliliği Artıracak 5 Araç',
    date: '1 Mayıs 2026',
    category: 'İşletme Yönetimi',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    content: `
      <p>İşletmenizin verimliliğini artırmak için kullanabileceğiniz 5 önemli aracı sizler için derledik.</p>
      <h2>1. Online Randevu Sistemi (NextBooking)</h2>
      <p>Randevu yönetimini otomatikleştirerek personelinizin zamanını daha verimli kullanmasını sağlayın.</p>
      <h2>2. Müşteri İlişkileri Yönetimi (CRM)</h2>
      <p>Müşteri verilerinizi tek bir platformda toplayarak kişiselleştirilmiş hizmet sunun.</p>
      <h2>3. Ödeme Sistemi Entegrasyonu</h2>
      <p>Online ödeme altyapısı ile tahsilat süreçlerinizi hızlandırın ve nakit akışınızı iyileştirin.</p>
      <h2>4. Pazarlama Otomasyonu</h2>
      <p>E-posta ve SMS pazarlama kampanyalarını otomatikleştirerek müşteri etkileşiminizi artırın.</p>
      <h2>5. Analitik ve Raporlama</h2>
      <p>İşletme performansınızı detaylı raporlarla takip ederek veri odaklı kararlar alın.</p>
    `,
  },
  {
    slug: 'musteri-sadakat-programi',
    title: 'Müşteri Sadakat Programı Nasıl Oluşturulur?',
    date: '24 Nisan 2026',
    category: 'Müşteri Deneyimi',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
    content: `
      <p>Sadık müşteriler, işletmenizin sürdürülebilir büyümesinin temel taşıdır. Etkili bir sadakat programı ile müşteri bağlılığını artırabilirsiniz.</p>
      <h2>Sadakat Programının Faydaları</h2>
      <ul>
        <li>Müşteri başına ortalama harcamayı artırır</li>
        <li>Müşteri kaybını azaltır</li>
        <li>Ağızdan ağıza pazarlamayı teşvik eder</li>
        <li>Rekabet avantajı sağlar</li>
      </ul>
      <h2>Nasıl Oluşturulur?</h2>
      <p>NextBooking platformu üzerinden kolayca sadakat programı oluşturabilirsiniz. Puan sistemi, indirim kuponları ve özel tekliflerle müşterilerinizi ödüllendirin.</p>
    `,
  },
  {
    slug: 'sms-eposta-pazarlama',
    title: 'SMS ve E-posta Pazarlama ile Randevu Oranlarını Artırma',
    date: '17 Nisan 2026',
    category: 'Pazarlama',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&h=400&fit=crop',
    content: `
      <p>Doğru kullanıldığında SMS ve e-posta pazarlama, randevu oranlarınızı önemli ölçüde artırabilir.</p>
      <h2>Neden SMS Pazarlama?</h2>
      <p>SMS mesajlarının açılma oranı %98'e kadar çıkmaktadır. Randevu hatırlatmaları, kampanya duyuruları ve özel teklifler için en etkili kanaldır.</p>
      <h2>Neden E-posta Pazarlama?</h2>
      <p>E-posta pazarlama, detaylı içerik paylaşımı ve segmentasyon imkanı sunar. Yeni hizmetlerinizi tanıtmak ve müşterilerinizi bilgilendirmek için idealdir.</p>
      <h2>En İyi Uygulamalar</h2>
      <ul>
        <li>Kişiselleştirilmiş mesajlar gönderin</li>
        <li>Doğru zamanlama ile daha yüksek etkileşim alın</li>
        <li>A/B testi ile en etkili mesaj formatını bulun</li>
        <li>Analitik ile performansı düzenli takip edin</li>
      </ul>
    `,
  },
]

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function BlogDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params
  const post = posts.find((p) => p.slug === slug)
  if (!post) notFound()

  return (
    <>
      <Navbar />
      <main>
        <article className="bg-white">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
            <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-500 transition-colors mb-8">
              <ArrowLeft className="h-4 w-4" /> Blog'a Dön
            </Link>

            <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{post.category}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {post.date}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-8">{post.title}</h1>

            <div className="w-full h-auto rounded-2xl overflow-hidden mb-10">
              <img src={post.image} alt={post.title} className="w-full h-auto object-cover" />
            </div>

            <div className="prose prose-gray max-w-none space-y-4 text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
