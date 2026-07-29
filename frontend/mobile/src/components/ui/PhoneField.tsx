import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';

interface PhoneFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  error?: string;
}

export function PhoneField({ label, value, onChangeText, placeholder, error }: PhoneFieldProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);

  function formatDisplay(raw: string) {
    const digits = raw.replace(/\D/g, '');
    const local = digits.startsWith('90') ? digits.slice(2) : digits.startsWith('0') ? digits.slice(1) : digits;
    const d = local.slice(0, 10);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)} ${d.slice(3)}`;
    if (d.length <= 8) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
    return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 8)} ${d.slice(8)}`;
  }

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, 10);
    onChangeText(digits ? `+90${digits}` : '');
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.phoneWrap}>
        <View style={styles.phonePrefix}>
          <Text style={styles.phonePrefixText}>+90</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          value={formatDisplay(value)}
          onChangeText={handleChange}
          placeholder={placeholder || '5XX XXX XX XX'}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="phone-pad"
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  field: { gap: SPACE[1] },
  label: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  phoneWrap: { flexDirection: 'row', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden' },
  phonePrefix: { backgroundColor: COLORS.surfaceAlt, paddingHorizontal: SPACE[3], paddingVertical: SPACE[3], justifyContent: 'center', borderRightWidth: 1.5, borderRightColor: COLORS.border },
  phonePrefixText: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.textSecondary },
  phoneInput: { flex: 1, backgroundColor: COLORS.surfaceAlt, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], fontSize: FONT.base, color: COLORS.text },
  error: { fontSize: FONT.xs, color: COLORS.error },
});
