import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, DimensionValue } from 'react-native';
import { RADIUS, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/** A single shimmering placeholder block. */
export function Skeleton({ width = '100%', height = 14, radius = RADIUS.sm, style }: SkeletonProps) {
  const COLORS = useColors();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        { width, height, borderRadius: radius, backgroundColor: COLORS.border, opacity: pulse },
        style,
      ]}
    />
  );
}

/** Placeholder matching the shape of a list row with avatar + two lines. */
export function SkeletonListItem() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.row}>
      <Skeleton width={46} height={46} radius={23} />
      <View style={styles.rowText}>
        <Skeleton width="65%" height={13} />
        <Skeleton width="40%" height={11} />
      </View>
      <Skeleton width={54} height={22} radius={RADIUS.full} />
    </View>
  );
}

/** Placeholder matching the photo-banner business card. */
export function SkeletonCard() {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={120} radius={0} />
      <View style={styles.cardBody}>
        <Skeleton width="60%" height={15} />
        <Skeleton width="35%" height={11} />
        <Skeleton width="45%" height={11} />
      </View>
    </View>
  );
}

/** Repeats a skeleton `count` times — the usual way these are used. */
export function SkeletonList({ count = 5, variant = 'row' }: { count?: number; variant?: 'row' | 'card' }) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) =>
        variant === 'card' ? <SkeletonCard key={i} /> : <SkeletonListItem key={i} />
      )}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  list: { gap: SPACE[3] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  rowText: { flex: 1, gap: 8 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  cardBody: { padding: SPACE[4], gap: 8 },
});
