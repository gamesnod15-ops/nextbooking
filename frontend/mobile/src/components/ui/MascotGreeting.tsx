import React from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { API_ORIGIN } from '@/lib/api';

const MASCOT_SIZE = 130;

/** Looping, transparent-background mascot clip served from the API's static uploads folder. */
export function MascotGreeting() {
  const player = useVideoPlayer(`${API_ORIGIN}/uploads/hello.webm`, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      contentFit="contain"
      nativeControls={false}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
});
