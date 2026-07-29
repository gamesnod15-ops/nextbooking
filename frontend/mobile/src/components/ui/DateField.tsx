import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';

interface DateFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
}

export function DateField({ label, value, onChangeText, placeholder, error }: DateFieldProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 4)}-${digits.slice(4)}`;
    } else {
      formatted = digits;
    }
    onChangeText(formatted);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder || 'YYYY-AA-GG'}
        placeholderTextColor={COLORS.textMuted}
        keyboardType="numbers-and-punctuation"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  field: { gap: SPACE[1] },
  label: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  input: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], fontSize: FONT.base, color: COLORS.text },
  error: { fontSize: FONT.xs, color: COLORS.error },
});
