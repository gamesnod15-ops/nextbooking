import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { FONT, RADIUS, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  error?: string;
}

export function FormField({ label, value, onChangeText, placeholder, multiline, keyboardType, error }: FormFieldProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        keyboardType={keyboardType}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  field: { gap: SPACE[1] },
  label: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  input: { backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.lg, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], fontSize: FONT.base, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  error: { fontSize: FONT.xs, color: COLORS.error },
});
