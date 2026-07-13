import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive?: boolean };
  accent?: boolean;
  style?: ViewStyle;
}

export function StatCard({ label, value, sublabel, icon, trend, accent = false, style }: StatCardProps) {
  if (accent) {
    return (
      <LinearGradient
        colors={[COLORS.primary, COLORS.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, styles.accentCard, style]}
      >
        <View style={styles.row}>
          <View style={styles.content}>
            <Text style={styles.accentLabel}>{label}</Text>
            <Text style={styles.accentValue}>{value}</Text>
            {sublabel && <Text style={styles.accentSub}>{sublabel}</Text>}
          </View>
          {icon && <View style={styles.accentIcon}>{icon}</View>}
        </View>
        {trend && (
          <Text style={[styles.trendText, { color: 'rgba(0,0,0,0.6)' }]}>
            {trend.positive !== false ? '↑' : '↓'} {Math.abs(trend.value)}% bu ay
          </Text>
        )}
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <View style={styles.content}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
          {sublabel && <Text style={styles.sub}>{sublabel}</Text>}
        </View>
        {icon && <View style={styles.icon}>{icon}</View>}
      </View>
      {trend && (
        <Text
          style={[
            styles.trendText,
            { color: trend.positive !== false ? COLORS.successText : COLORS.errorText },
          ]}
        >
          {trend.positive !== false ? '↑' : '↓'} {Math.abs(trend.value)}% bu ay
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACE[4],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOW.sm,
    flex: 1,
  },
  accentCard: {
    borderWidth: 0,
    ...SHADOW.primary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  content: { flex: 1 },
  label: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    fontWeight: FONT.medium,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accentLabel: {
    fontSize: FONT.xs,
    color: 'rgba(0,0,0,0.6)',
    fontWeight: FONT.medium,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FONT['2xl'],
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  accentValue: {
    fontSize: FONT['2xl'],
    fontWeight: FONT.bold,
    color: COLORS.black,
  },
  sub: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  accentSub: {
    fontSize: FONT.xs,
    color: 'rgba(0,0,0,0.5)',
    marginTop: 2,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accentIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: FONT.xs,
    fontWeight: FONT.medium,
    marginTop: 8,
  },
});
