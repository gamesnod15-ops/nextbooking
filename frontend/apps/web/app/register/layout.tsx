import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kayıt Ol — BookingAi',
  description: 'İşletmeniz için ücretsiz BookingAi hesabı oluşturun ve online randevu almaya hemen başlayın.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
