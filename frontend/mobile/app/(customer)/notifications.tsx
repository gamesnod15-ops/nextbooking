import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { PatternOverlay } from '@/components/ui/PatternOverlay';
import { DotGrid } from '@/components/ui/DotGrid';
import { useToast } from '@/components/ui/Toast';
import { registerForPushNotifications } from '@/lib/pushNotifications';

const PREFS_KEY = 'notification_prefs';

const PREF_ITEMS = [
  { key: 'reminders', icon: 'time-outline', label: 'Randevu Hatırlatmaları', description: 'Randevunuzdan önce hatırlatma alın' },
  { key: 'statusUpdates', icon: 'checkmark-circle-outline', label: 'Randevu Durumu', description: 'Onay, iptal ve tamamlanma bildirimleri' },
  { key: 'favorites', icon: 'heart-outline', label: 'Favori İşletme Güncellemeleri', description: 'Favori işletmelerinizden kampanya duyuruları' },
  { key: 'promotions', icon: 'megaphone-outline', label: 'Kampanyalar', description: 'Fırsat ve kampanya bildirimleri' },
] as const;

type Prefs = Record<string, boolean>;

const DEFAULT_PREFS: Prefs = { reminders: true, statusUpdates: true, favorites: true, promotions: false };

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const toast = useToast();

  useEffect(() => {
    SecureStore.getItemAsync(PREFS_KEY)
      .then((raw) => { if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) }); })
      .catch(() => {});
  }, []);

  async function toggle(key: string) {
    const turningOn = !prefs[key];

    // Turning any preference on is meaningless without OS permission, so ask
    // for it here — this is the one place a system prompt is expected.
    if (turningOn) {
      const result = await registerForPushNotifications();
      if (result.status === 'denied') {
        toast.warning('Bildirim izni verilmedi. Ayarlardan izin verebilirsin.');
      } else if (result.status === 'error') {
        toast.error('Bildirimler açılamadı. Daha sonra tekrar dene.');
      }
    }

    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }

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
          <Text style={styles.headerTitle}>Bildirimler</Text>
          <View style={styles.headerUnderline} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.list}>
        {PREF_ITEMS.map((item, idx) => (
          <View
            key={item.key}
            style={[styles.item, idx < PREF_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }]}
          >
            <View style={styles.iconBox}>
              <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            <Switch
              value={prefs[item.key]}
              onValueChange={() => toggle(item.key)}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={STATIC_WHITE}
            />
          </View>
        ))}
      </View>
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
  list: { marginHorizontal: SPACE[5], backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.borderLight, overflow: 'hidden', ...SHADOW.sm },
  item: { flexDirection: 'row', alignItems: 'center', padding: SPACE[4], gap: SPACE[3] },
  iconBox: { width: 40, height: 40, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryMuted, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, gap: 2 },
  label: { fontSize: FONT.base, fontWeight: FONT.semibold, color: COLORS.text },
  description: { fontSize: FONT.xs, color: COLORS.textMuted },
});
