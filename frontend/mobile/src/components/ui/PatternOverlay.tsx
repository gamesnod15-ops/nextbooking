import React from 'react';
import { Image, StyleSheet } from 'react-native';

const patternSrc = require('../../../assets/images/pattern.png');

interface PatternOverlayProps {
  opacity?: number;
}

export function PatternOverlay({ opacity = 0.5 }: PatternOverlayProps) {
  return (
    <Image
      source={patternSrc}
      style={[StyleSheet.absoluteFill, { opacity }]}
      resizeMode="cover"
    />
  );
}
