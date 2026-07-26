import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useOtaUpdates, useVersionGate } from '@/lib/appUpdates';

const FALLBACK_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/id0000000000',
  android: 'https://play.google.com/store/apps/details?id=com.jetrandevu.app',
  default: 'https://jetrandevu.com',
})!;

/**
 * Runs the OTA check and, when the API reports this build as too old, replaces
 * the app with a blocking "update required" screen.
 */
export function UpdateGate({ children }: { children: React.ReactNode }) {
  useOtaUpdates();
  const { updateRequired, storeUrl } = useVersionGate();

  if (!updateRequired) return <>{children}</>;

  const target = storeUrl ?? FALLBACK_STORE_URL;

  return (
    <View style={styles.root}>
      <View style={styles.iconWrap}>
        <Ionicons name="cloud-download-outline" size={38} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Güncelleme gerekli</Text>
      <Text style={styles.text}>
        Bu sürüm artık desteklenmiyor. Devam etmek için JetRandevu'yu güncellemen gerekiyor.
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => Linking.openURL(target).catch(() => {})}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-up-circle" size={18} color={COLORS.white} />
        <Text style={styles.btnText}>Güncelle</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACE[6],
    gap: SPACE[3],
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACE[2],
  },
  title: { fontSize: FONT.xl, fontWeight: FONT.extrabold, color: COLORS.text, textAlign: 'center' },
  text: { fontSize: FONT.base, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACE[6],
    paddingVertical: 14,
    marginTop: SPACE[4],
    ...SHADOW.primary,
  },
  btnText: { fontSize: FONT.md, fontWeight: FONT.bold, color: COLORS.white },
});
