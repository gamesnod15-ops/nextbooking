import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '@/lib/theme';

interface DotGridProps {
  rows?: number;
  cols?: number;
  color?: string;
  style?: ViewStyle;
}

/** Decorative dot-grid texture used on auth screen backgrounds. */
export function DotGrid({ rows = 5, cols = 4, color = COLORS.primary, style }: DotGridProps) {
  return (
    <View style={[styles.grid, style]} pointerEvents="none">
      {Array.from({ length: rows * cols }).map((_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 76,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    margin: 6,
    opacity: 0.18,
  },
});
