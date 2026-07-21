import { useState } from 'react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSupportContact, useSubmitSupportRequest } from '@/hooks/useSupport'
import { Mail, Phone, Send } from 'lucide-react'

export function SupportPage() {
  const { data: contact } = useSupportContact()
  const submitRequest = useSubmitSupportRequest()

  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<{ subject?: string; message?: string }>({})
  const [sent, setSent] = useState(false)

  function handleSubmit() {
    const e: { subject?: string; message?: string } = {}
    if (!subject.trim()) e.subject = 'Bu bölüm boş bırakılamaz.'
    if (!message.trim()) e.message = 'Bu bölüm boş bırakılamaz.'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    submitRequest.mutate(
      { subject, message },
      {
        onSuccess: () => {
          setSubject('')
          setMessage('')
          setErrors({})
          setSent(true)
          setTimeout(() => setSent(false), 3000)
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Destek" description="Sorularınız ve talepleriniz için bize ulaşın" />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>İletişim Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-posta</p>
                <a href={`mailto:${contact?.email ?? ''}`} className="text-sm font-medium hover:underline">
                  {contact?.email ?? '—'}
                </a>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <a href={`tel:${contact?.phone ?? ''}`} className="text-sm font-medium hover:underline">
                  {contact?.phone ?? '—'}
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bize Yazın</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {sent && (
              <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 border border-emerald-200">
                ✓ Talebiniz iletildi. En kısa sürede size dönüş yapacağız.
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium">Konu</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Örn: Fatura ile ilgili bir sorum var"
              />
              {errors.subject && <p className="mt-1 text-xs text-destructive">{errors.subject}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium">Mesajınız</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Talebinizi detaylı şekilde açıklayın..."
              />
              {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={handleSubmit} disabled={submitRequest.isPending}>
                <Send className="h-3.5 w-3.5 mr-1" /> Gönder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
