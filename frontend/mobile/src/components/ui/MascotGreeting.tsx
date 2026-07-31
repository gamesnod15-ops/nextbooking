import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { API_ORIGIN } from '@/lib/api';

const MASCOT_SIZE = 130;
const MASCOT_URL = `${API_ORIGIN}/uploads/hello.mp4`;

/** Looping, transparent-background mascot clip served from the API's static uploads folder. */
export function MascotGreeting() {
  const player = useVideoPlayer(MASCOT_URL, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      console.log('[MascotGreeting] status:', status, error ? `error: ${error.message}` : '');
    });
    console.log('[MascotGreeting] source:', MASCOT_URL);
    return () => statusSub.remove();
  }, [player]);

  return (
    <View style={styles.debugCircle}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="contain"
        nativeControls={false}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  debugCircle: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    borderRadius: MASCOT_SIZE / 2,
    backgroundColor: 'rgba(1,84,240,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  video: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
});
