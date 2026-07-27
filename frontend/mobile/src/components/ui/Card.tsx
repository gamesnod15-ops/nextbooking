import React, { useMemo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { RADIUS, SHADOW } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'flat' | 'dark';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const COLORS = useColors();
  const variantStyles = useMemo(() => createVariantStyles(COLORS), [COLORS]);
  return (
    <View style={[styles.base, variantStyles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
});

const createVariantStyles = (COLORS: Palette) => StyleSheet.create({
  default: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
  },
  elevated: {
    backgroundColor: COLORS.surface,
    ...SHADOW.md,
  },
  flat: {
    backgroundColor: COLORS.surfaceAlt,
  },
  dark: {
    backgroundColor: COLORS.surfaceDark,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});
