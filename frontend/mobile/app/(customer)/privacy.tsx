import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { DotGrid } from '@/components/ui/DotGrid';

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Giriş ve Kapsam',
    body: [
      'JetRandevu ("biz", "bizim", "platform") olarak, kullanıcılarımızın ve ziyaretçilerimizin gizliliğine büyük önem vermekteyiz. İşbu Gizlilik Politikası, platformumuzu kullanırken hangi bilgilerin toplandığını, bu bilgilerin nasıl kullanıldığını, saklandığını, korunduğunu ve paylaşıldığını açıklamaktadır.',
      'Bu politika, JetRandevu web sitesini (jetrandevu.com), mobil uygulamalarını ve alt alan adlarını kapsamaktadır. Platformumuzu kullanarak, bu politikada belirtilen veri toplama ve kullanım uygulamalarını kabul etmiş sayılırsınız.',
    ],
  },
  {
    title: '2. Toplanan Bilgiler',
    body: [
      'Randevu alırken ad, soyad, telefon, e-posta ve şehir bilginizi paylaşırsınız.',
      'Platformu kullandığınızda kullanım verileri, cihaz bilgileri ve genel konum bilgisi otomatik olarak toplanabilir.',
      'Ödeme işlemleri güvenli üçüncü taraf ödeme sağlayıcıları tarafından işlenir; kart bilgileriniz tarafımızca görülmez veya saklanmaz.',
    ],
  },
  {
    title: '3. Bilgilerin Kullanım Amaçları',
    body: [
      'Randevu sistemini çalıştırmak, hesap bildirimleri ve hizmet güncellemeleri göndermek, hesap güvenliğini sağlamak, platform deneyimini iyileştirmek ve yasal yükümlülükleri yerine getirmek amacıyla kullanılır.',
    ],
  },
  {
    title: '4. Bilgi Paylaşımı ve Aktarımı',
    body: [
      'Kişisel bilgileriniz, platformun çalışması için gerekli hizmet sağlayıcıları (barındırma, e-posta, SMS, ödeme, analitik) ile sınırlı amaçlarla paylaşılır.',
      'Randevu aldığınız işletmeyle ilgili verileriniz, yalnızca o işletmenin operasyonlarını yürütmesi amacıyla işlenir ve üçüncü taraflarla izniniz olmadan paylaşılmaz.',
    ],
  },
  {
    title: '5. Veri Güvenliği',
    body: [
      'Tüm veri iletimleri SSL/TLS ile şifrelenir. Verilerinize yalnızca yetkili personel erişebilir ve altyapımız düzenli olarak denetlenir.',
    ],
  },
  {
    title: '6. Kullanıcı Hakları',
    body: [
      'Verilerinize erişme, düzeltme, silme ("unutulma hakkı"), işlemeyi kısıtlama, veri taşınabilirliği ve itiraz etme haklarına sahipsiniz.',
    ],
  },
  {
    title: '7. İletişim',
    body: [
      'Gizlilik politikamız hakkında sorularınız için privacy@jetrandevu.com adresinden bize ulaşabilirsiniz.',
    ],
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Gizlilik</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Kişisel verilerinizin gizliliği ve güvenliği hakkında bilgi.</Text>
        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((p, i) => (
              <Text key={i} style={styles.paragraph}>{p}</Text>
            ))}
          </View>
        ))}
        <Text style={styles.updated}>Son güncelleme: 15 Mayıs 2026</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  blobBlue: {
    position: 'absolute',
    top: -60,
    right: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#3B82F6',
    opacity: 0.08,
  },
  dotGridTopRight: {
    position: 'absolute',
    top: 24,
    right: 16,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE[5], paddingVertical: SPACE[4] },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW.sm,
  },
  headerTitle: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text, textAlign: 'center' },
  headerUnderline: { width: 36, height: 4, borderRadius: RADIUS.full, backgroundColor: COLORS.primary, marginTop: 6, alignSelf: 'center' },
  content: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10], gap: SPACE[4] },
  intro: { fontSize: FONT.sm, color: COLORS.textMuted, marginBottom: SPACE[2] },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    gap: SPACE[2],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  sectionTitle: { fontSize: FONT.base, fontWeight: FONT.bold, color: COLORS.text },
  paragraph: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 20 },
  updated: { fontSize: FONT.xs, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACE[2] },
});
