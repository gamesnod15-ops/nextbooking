import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, FONT, RADIUS, SPACE } from '@/lib/theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {action && <View>{action}</View>}
    </View>
  );
}

interface DividerProps { style?: ViewStyle }
export function Divider({ style }: DividerProps) {
  return <View style={[dividerStyles.line, style]} />;
}

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ label, selected, onPress, style }: ChipProps) {
  const { TouchableOpacity, Text: RNText } = require('react-native');
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        chipStyles.chip,
        selected ? chipStyles.selected : chipStyles.unselected,
        style,
      ]}
    >
      <RNText style={[chipStyles.label, selected ? chipStyles.selectedLabel : chipStyles.unselectedLabel]}>
        {label}
      </RNText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACE[5],
    paddingVertical: SPACE[3],
  },
  left: { flex: 1 },
  title: {
    fontSize: FONT.md,
    fontWeight: FONT.bold,
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});

const dividerStyles = StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACE[5],
  },
});

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1.5,
  },
  selected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  unselected: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  },
  label: {
    fontSize: FONT.sm,
    fontWeight: FONT.semibold,
  },
  selectedLabel: { color: COLORS.white },
  unselectedLabel: { color: COLORS.textSecondary },
});
