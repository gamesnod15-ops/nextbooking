import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import { ArrowRight, Calendar } from 'lucide-react'

export const metadata = { title: 'Blog — JetRandevu', description: 'Randevu sistemi, işletme yönetimi ve dijitalleşme hakkında blog yazıları.' }

const posts = [
  { title: 'Online Randevu Sistemi ile Müşteri Memnuniyetini Artırın', date: '15 Mayıs 2026', slug: 'online-randevu-musteri-memnuniyeti' },
  { title: 'Kuaförünüz İçin Dijital Pazarlama Stratejileri', date: '8 Mayıs 2026', slug: 'kuafor-dijital-pazarlama' },
  { title: 'İşletmenizde Verimliliği Artıracak 5 Araç', date: '1 Mayıs 2026', slug: 'verimlilik-araclari' },
  { title: 'Müşteri Sadakat Programı Nasıl Oluşturulur?', date: '24 Nisan 2026', slug: 'musteri-sadakat-programi' },
  { title: 'SMS ve E-posta Pazarlama ile Randevu Oranlarını Artırma', date: '17 Nisan 2026', slug: 'sms-eposta-pazarlama' },
]

export default function BlogPage() {
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
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500 mb-3">Blog</p>
            <h1 className="text-5xl font-extrabold leading-tight mb-4">İşletmenizi Büyütecek İpuçları</h1>
            <p className="mx-auto max-w-xl text-lg text-gray-300">Randevu sistemi, dijitalleşme ve işletme yönetimi hakkında en güncel yazılar.</p>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
              {posts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`}
                  className="group flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-brand-200 hover:shadow-md"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{post.title}</h3>
                    <p className="mt-1.5 flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-brand-500 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
