import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { COLORS, FONT } from '@/lib/theme';
import { initials } from '@/lib/utils';
import { fixImageUrl } from '@/lib/api';

interface AvatarProps {
  name?: string | null;
  url?: string | null;
  size?: number;
  style?: ViewStyle | ImageStyle;
}

export function Avatar({ name, url, size = 40, style }: AvatarProps) {
  const safeName = name ?? '';
  const fontSize = size * 0.36;
  const bgColors = ['#E8F5E9', '#E3F2FD', '#FFF8E1', '#FCE4EC', '#F3E5F5', '#E0F2F1'];
  const textColors = ['#2E7D32', '#1565C0', '#F57F17', '#880E4F', '#6A1B9A', '#00695C'];
  const idx = safeName.charCodeAt(0) % bgColors.length;

  if (url) {
    return (
      <Image
        source={{ uri: fixImageUrl(url) }}
        style={[{ width: size, height: size, borderRadius: size / 2 }, style] as any}
        onError={(e) => console.log('[Avatar] Image load error:', e.nativeEvent.error, 'url:', url)}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColors[idx] },
        style,
      ]}
    >
      <Text style={[styles.text, { fontSize, color: textColors[idx] }]}>{initials(safeName)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: FONT.bold,
  },
});
