import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';
import { DotGrid } from './DotGrid';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  /** Renders without the decorative surface (rarely needed). */
  transparent?: boolean;
}

export function ScreenHeader({ title, subtitle, showBack = false, right, transparent = false }: ScreenHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(business)');
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 6) },
        transparent ? styles.transparent : styles.solid,
      ]}
    >
      {!transparent && (
        <>
          <View style={styles.blob} pointerEvents="none" />
          <DotGrid style={styles.dots} rows={4} cols={4} />
        </>
      )}

      <View style={styles.inner}>
        {showBack ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Geri">
            <Ionicons name="chevron-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backSpacer} />
        )}

        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <View style={styles.underline} />
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>

        <View style={styles.rightSlot}>{right}</View>
      </View>
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: {
    paddingBottom: SPACE[4],
    paddingHorizontal: SPACE[5],
    overflow: 'hidden',
  },
  solid: {
    backgroundColor: COLORS.surface,
    borderBottomLeftRadius: RADIUS['2xl'],
    borderBottomRightRadius: RADIUS['2xl'],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  blob: {
    position: 'absolute',
    top: -70,
    right: -40,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.primary,
    opacity: 0.06,
  },
  dots: {
    position: 'absolute',
    top: 44,
    right: 14,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  backSpacer: { width: 0 },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: FONT.xl,
    fontWeight: FONT.extrabold,
    color: COLORS.text,
  },
  underline: {
    width: 32,
    height: 3.5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    marginTop: 5,
  },
  subtitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 5,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
