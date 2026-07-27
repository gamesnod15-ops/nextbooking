import React from 'react';
import { Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { FONT, RADIUS } from '@/lib/theme';
import { useColors } from '@/lib/themeContext';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', style, textStyle, size = 'md' }: BadgeProps) {
  const COLORS = useColors();
  const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
    default:   { bg: COLORS.surfaceAlt, text: COLORS.textSecondary, border: COLORS.border },
    primary:   { bg: COLORS.primaryMuted, text: COLORS.primaryDark, border: COLORS.primaryLight },
    success:   { bg: COLORS.successLight, text: COLORS.successText, border: '#BBF7D0' },
    warning:   { bg: COLORS.warningLight, text: COLORS.warningText, border: '#FDE68A' },
    error:     { bg: COLORS.errorLight, text: COLORS.errorText, border: '#FECACA' },
    info:      { bg: COLORS.infoLight, text: COLORS.infoText, border: '#BFDBFE' },
    pending:   COLORS.pending,
    confirmed: COLORS.confirmed,
    cancelled: COLORS.cancelled,
    completed: COLORS.completed,
    no_show:   COLORS.no_show,
  };
  const colors = variantColors[variant];
  return (
    <View
      style={[
        styles.base,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: colors.bg, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.text, size === 'sm' ? styles.smText : styles.mdText, { color: colors.text }, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  md: { paddingHorizontal: 10, paddingVertical: 4 },
  sm: { paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontWeight: FONT.semibold },
  mdText: { fontSize: FONT.xs },
  smText: { fontSize: 10 },
});
