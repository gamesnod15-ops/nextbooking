import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { DotGrid } from '@/components/ui/DotGrid';

const LINK_ITEMS = [
  { icon: 'notifications-outline', label: 'Bildirimler', route: '/(customer)/notifications' },
  { icon: 'lock-closed-outline', label: 'Gizlilik', route: '/(customer)/privacy' },
  { icon: 'help-circle-outline', label: 'Destek', route: '/(customer)/support' },
] as const;

const DEVICE_KEYS_TO_CLEAR = [
  'guest_customer_info',
  'guest_profile_photo',
  'notification_prefs',
];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [clearing, setClearing] = useState(false);

  function handleClearData() {
    Alert.alert(
      'Verilerimi Sıfırla',
      'Profil bilgileriniz, fotoğrafınız ve bildirim tercihleriniz bu cihazdan silinecek. Randevu ve favori geçmişiniz cihaz kimliğinize bağlı kalmaya devam eder. Devam etmek istiyor musunuz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await Promise.all(DEVICE_KEYS_TO_CLEAR.map((k) => SecureStore.deleteItemAsync(k)));
              Alert.alert('Tamamlandı', 'Verileriniz sıfırlandı.');
            } finally {
              setClearing(false);
            }
          },
        },
      ]
    );
  }

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ayarlar</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Tercihler</Text>
        <View style={styles.list}>
          {LINK_ITEMS.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.item, idx < LINK_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }]}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={styles.iconBox}>
                <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
              </View>
              <Text style={styles.label}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Veri</Text>
        <View style={styles.list}>
          <TouchableOpacity style={styles.item} onPress={handleClearData} disabled={clearing} activeOpacity={0.7}>
            <View style={[styles.iconBox, styles.iconBoxDanger]}>
              <Ionicons name="trash-outline" size={18} color={COLORS.error} />
            </View>
            <Text style={[styles.label, styles.labelDanger]}>Verilerimi Sıfırla</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Hakkında</Text>
        <View style={styles.list}>
          <View style={styles.item}>
            <View style={styles.iconBox}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.label}>Uygulama Sürümü</Text>
            <Text style={styles.value}>{appVersion}</Text>
          </View>
        </View>
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
  content: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10], gap: SPACE[2] },
  sectionLabel: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: SPACE[4], marginBottom: SPACE[1] },
  list: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACE[4], gap: SPACE[3] },
  iconBox: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  iconBoxDanger: { backgroundColor: COLORS.errorLight },
  label: { flex: 1, fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  labelDanger: { color: COLORS.error },
  value: { fontSize: FONT.sm, color: COLORS.textMuted },
});
