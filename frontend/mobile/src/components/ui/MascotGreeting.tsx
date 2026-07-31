import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { API_ORIGIN } from '@/lib/api';
import { STATIC_WHITE } from '@/lib/theme';

const MASCOT_SIZE = 130;
// mp4 has no alpha channel (baked-in dark background) — oversize the video inside
// a circular mask so the clip's square corners get cropped away instead of showing.
const VIDEO_OVERSCALE = 1.35;
const MASCOT_URL = `${API_ORIGIN}/uploads/hello.mp4`;

/** Looping mascot clip served from the API's static uploads folder, cropped into a badge. */
export function MascotGreeting() {
  const player = useVideoPlayer(MASCOT_URL, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  useEffect(() => {
    const statusSub = player.addListener('statusChange', ({ status, error }) => {
      if (error) console.warn('[MascotGreeting] playback error:', error.message);
    });
    return () => statusSub.remove();
  }, [player]);

  return (
    <View style={styles.badge}>
      <VideoView
        style={styles.video}
        player={player}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    borderRadius: MASCOT_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: STATIC_WHITE,
    backgroundColor: STATIC_WHITE,
    shadowColor: '#08224B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  video: {
    width: MASCOT_SIZE * VIDEO_OVERSCALE,
    height: MASCOT_SIZE * VIDEO_OVERSCALE,
    marginLeft: -(MASCOT_SIZE * (VIDEO_OVERSCALE - 1)) / 2,
    marginTop: -(MASCOT_SIZE * (VIDEO_OVERSCALE - 1)) / 2,
  },
});
