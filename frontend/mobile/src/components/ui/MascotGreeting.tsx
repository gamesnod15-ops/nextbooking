import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { API_ORIGIN } from '@/lib/api';

const MASCOT_SIZE = 130;
const MASCOT_URL = `${API_ORIGIN}/uploads/hello.gif`;

/** Looping, transparent-background mascot clip served from the API's static uploads folder. */
export function MascotGreeting() {
  return (
    <Image
      source={{ uri: MASCOT_URL }}
      style={styles.mascot}
      contentFit="contain"
      autoplay
    />
  );
}

const styles = StyleSheet.create({
  mascot: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
});
