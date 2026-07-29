import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { DotGrid } from '@/components/ui/DotGrid';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { useToast } from '@/components/ui/Toast';
import { useTheme, useColors, type Palette } from '@/lib/themeContext';
import {
  authenticate,
  getBiometricSupport,
  isBiometricLockEnabled,
  setBiometricLockEnabled,
  type BiometricSupport,
} from '@/lib/biometricLock';

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
  const toast = useToast();
  const { preference, setPreference } = useTheme();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [biometric, setBiometric] = useState<BiometricSupport | null>(null);
  const [lockEnabled, setLockEnabled] = useState(false);

  useEffect(() => {
    getBiometricSupport().then(setBiometric).catch(() => setBiometric(null));
    isBiometricLockEnabled().then(setLockEnabled).catch(() => {});
  }, []);

  async function toggleBiometricLock() {
    const turningOn = !lockEnabled;

    // Verify before enabling so nobody can lock the owner out by accident.
    if (turningOn) {
      const ok = await authenticate('Kilidi açmak için kimliğini doğrula');
      if (!ok) {
        toast.warning('Doğrulama başarısız. Kilit açılmadı.');
        return;
      }
    }

    await setBiometricLockEnabled(turningOn);
    setLockEnabled(turningOn);
    toast.success(turningOn ? 'Uygulama kilidi açıldı.' : 'Uygulama kilidi kapatıldı.');
  }

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
              toast.success('Verileriniz sıfırlandı.');
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
      <PatternOverlay opacity={0.25} />
      <View style={styles.blobBlue} />
      <DotGrid style={styles.dotGridTopRight} rows={5} cols={4} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Ayarlar</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Görünüm</Text>
        <View style={styles.list}>
          <View style={styles.item}>
            <View style={styles.iconBox}>
              <Ionicons name="contrast-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.label}>Tema</Text>
            <View style={styles.segment}>
              {([
                ['light', 'Açık'],
                ['dark', 'Koyu'],
                ['system', 'Sistem'],
              ] as const).map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.segmentBtn, preference === value && styles.segmentBtnActive]}
                  onPress={() => setPreference(value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentText, preference === value && styles.segmentTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

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

        {biometric?.available && (
          <>
            <Text style={styles.sectionLabel}>Güvenlik</Text>
            <View style={styles.list}>
              <View style={styles.item}>
                <View style={styles.iconBox}>
                  <Ionicons
                    name={biometric.kind === 'face' ? 'scan-outline' : 'finger-print-outline'}
                    size={18}
                    color={COLORS.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Uygulama Kilidi</Text>
                  <Text style={styles.itemHint}>{biometric.label} ile aç</Text>
                </View>
                <Switch
                  value={lockEnabled}
                  onValueChange={toggleBiometricLock}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={STATIC_WHITE}
                />
              </View>
            </View>
          </>
        )}

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
  content: { paddingHorizontal: SPACE[5], paddingBottom: SPACE[10], gap: SPACE[2] },
  sectionLabel: { fontSize: FONT.xs, fontWeight: FONT.bold, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: SPACE[4], marginBottom: SPACE[1] },
  list: { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACE[4], gap: SPACE[3] },
  iconBox: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  iconBoxDanger: { backgroundColor: COLORS.errorLight },
  label: { flex: 1, fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  itemHint: { fontSize: FONT.xs, color: COLORS.textMuted, marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.full,
    padding: 3,
    gap: 2,
  },
  segmentBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full },
  segmentBtnActive: { backgroundColor: COLORS.primary },
  segmentText: { fontSize: FONT.xs, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  segmentTextActive: { color: STATIC_WHITE },
  labelDanger: { color: COLORS.error },
  value: { fontSize: FONT.sm, color: COLORS.textMuted },
});
