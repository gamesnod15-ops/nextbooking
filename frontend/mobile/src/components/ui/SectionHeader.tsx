import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { FONT, RADIUS, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, action, style }: SectionHeaderProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
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
  const COLORS = useColors();
  const dividerStyles = useMemo(() => createDividerStyles(COLORS), [COLORS]);
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
  const COLORS = useColors();
  const chipStyles = useMemo(() => createChipStyles(COLORS), [COLORS]);
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

const createStyles = (COLORS: Palette) => StyleSheet.create({
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

const createDividerStyles = (COLORS: Palette) => StyleSheet.create({
  line: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: SPACE[5],
  },
});

const createChipStyles = (COLORS: Palette) => StyleSheet.create({
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
  selectedLabel: { color: STATIC_WHITE },
  unselectedLabel: { color: COLORS.textSecondary },
});
