import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { COLORS, FONT, RADIUS, SPACE } from '@/lib/theme';

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

const styles = StyleSheet.create({
  field: { gap: SPACE[1] },
  label: { fontSize: FONT.sm, fontWeight: FONT.semibold, color: COLORS.text },
  input: { backgroundColor: '#F5F5F3', borderRadius: RADIUS.lg, paddingHorizontal: SPACE[4], paddingVertical: SPACE[3], fontSize: FONT.base, color: COLORS.text, borderWidth: 1.5, borderColor: '#D0D0D0' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  error: { fontSize: FONT.xs, color: COLORS.error },
});
