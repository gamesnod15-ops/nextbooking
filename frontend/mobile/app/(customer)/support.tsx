import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { DotGrid } from '@/components/ui/DotGrid';

const CONTACT_ITEMS = [
  { icon: 'mail-outline', label: 'E-posta', value: 'destek@jetrandevu.com', action: () => Linking.openURL('mailto:destek@jetrandevu.com') },
  { icon: 'call-outline', label: 'Telefon', value: '+90 (212) 000 00 00', action: () => Linking.openURL('tel:+902120000000') },
  { icon: 'location-outline', label: 'Adres', value: 'Maslak, İstanbul', action: undefined },
] as const;

const FAQ_ITEMS = [
  { q: 'Randevumu nasıl iptal ederim?', a: 'Randevularım sekmesinden ilgili randevunun "İptal Et" butonuna dokunarak iptal edebilirsiniz.' },
  { q: 'Bir işletmeyi nasıl favorilere eklerim?', a: 'İşletme sayfasındaki kalp ikonuna dokunarak favorilerinize ekleyebilirsiniz.' },
  { q: 'Hediye kuponumu nasıl kullanırım?', a: 'Randevu oluştururken kupon kodunuzu işletmeyle paylaşabilir veya profilinizdeki Hediye Kuponlarım sayfasından takip edebilirsiniz.' },
];

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <PatternOverlay opacity={0.25} />
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Destek</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hoursCard}>
          <Ionicons name="time-outline" size={20} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hoursTitle}>Canlı Destek Saatleri</Text>
            <Text style={styles.hoursText}>Pzt–Cum: 09:00–22:00{'\n'}Cts–Paz: 10:00–18:00</Text>
          </View>
        </View>

        <View style={styles.list}>
          {CONTACT_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.item, idx < CONTACT_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }]}
              onPress={item.action}
              disabled={!item.action}
              activeOpacity={item.action ? 0.7 : 1}
            >
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.value}>{item.value}</Text>
              </View>
              {item.action && <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.faqTitle}>Sık Sorulan Sorular</Text>
        <View style={styles.list}>
          {FAQ_ITEMS.map((item, idx) => (
            <View
              key={item.q}
              style={[styles.faqItem, idx < FAQ_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }]}
            >
              <Text style={styles.faqQ}>{item.q}</Text>
              <Text style={styles.faqA}>{item.a}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
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
  hoursCard: { flexDirection: 'row', alignItems: 'center', gap: SPACE[3], backgroundColor: COLORS.primaryMuted, borderRadius: RADIUS.xl, padding: SPACE[4] },
  hoursTitle: { fontSize: FONT.sm, fontWeight: FONT.bold, color: COLORS.text },
  hoursText: { fontSize: FONT.xs, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  list: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACE[4], gap: SPACE[3] },
  iconBox: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, gap: 2 },
  label: { fontSize: FONT.xs, color: COLORS.textMuted },
  value: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  faqTitle: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.text, marginTop: SPACE[2] },
  faqItem: { padding: SPACE[4], gap: 4 },
  faqQ: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  faqA: { fontSize: FONT.sm, color: COLORS.textSecondary, lineHeight: 19 },
});
