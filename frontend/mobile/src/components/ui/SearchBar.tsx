import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: ViewStyle;
  onClear?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder = 'Ara...', style, onClear }: SearchBarProps) {
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  return (
    <View style={[styles.container, style]}>
      <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => { onChangeText(''); onClear?.(); }} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Temizle">
          <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACE[3],
    paddingVertical: SPACE[2] + 2,
    gap: SPACE[2],
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  input: {
    flex: 1,
    fontSize: FONT.base,
    color: COLORS.text,
    padding: 0,
  },
});
