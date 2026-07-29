import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';
import { RADIUS } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_OUT_DISTANCE = SCREEN_WIDTH * 1.4;
const MAX_VISIBLE_STACK = 4;

export interface SwipeCardDeckProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T, index: number) => React.ReactNode;
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
  onTap?: (item: T) => void;
  onEmpty?: () => React.ReactNode;
  /** Fires once, right when the active index moves past the last card. */
  onExhausted?: () => void;
  cardWidth?: number;
  cardHeight?: number;
}

/**
 * Generic Tinder-style swipeable card deck. Purely presentational/gestural —
 * the caller owns the data, the card visuals, and what a swipe *means*.
 */
export function SwipeCardDeck<T>({
  data,
  keyExtractor,
  renderCard,
  onSwipeLeft,
  onSwipeRight,
  onTap,
  onEmpty,
  onExhausted,
  cardWidth,
  cardHeight,
}: SwipeCardDeckProps<T>) {
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Reset the deck whenever the underlying data identity changes (new fetch/shuffle).
  const dataKey = useMemo(() => data.map(keyExtractor).join('|'), [data, keyExtractor]);
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    setActiveIndex(0);
    // dataKey captures the full ordered id list — any change (new data, reshuffle) resets the deck.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey]);

  const advance = useCallback(() => {
    translateX.value = 0;
    translateY.value = 0;
    setActiveIndex((i) => {
      const next = i + 1;
      if (next >= data.length) {
        onExhausted?.();
      }
      return next;
    });
  }, [data.length, onExhausted, translateX, translateY]);

  const handleSwipeLeft = useCallback((item: T) => {
    onSwipeLeft?.(item);
    advance();
  }, [onSwipeLeft, advance]);

  const handleSwipeRight = useCallback((item: T) => {
    onSwipeRight?.(item);
    advance();
  }, [onSwipeRight, advance]);

  const activeItem = data[activeIndex];

  const idleRotate = useSharedValue(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startIdleSway = useCallback(() => {
    // 3 full cycles: right → center → left → center → right → center
    idleRotate.value = withRepeat(
      withTiming(2.5, { duration: 700 }),
      6,
      true,
      (finished) => {
        if (finished) idleRotate.value = withSpring(0, { damping: 8, stiffness: 60 });
      }
    );
  }, [idleRotate]);

  const stopIdleSway = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleRotate.value = withSpring(0, { damping: 10, stiffness: 80 });
  }, [idleRotate]);

  const scheduleIdleSway = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => startIdleSway(), 3000);
  }, [startIdleSway]);

  useEffect(() => {
    if (!activeItem) return;
    scheduleIdleSway();
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [activeIndex, activeItem, scheduleIdleSway]);

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(!!activeItem)
      .onBegin(() => {
        runOnJS(stopIdleSway)();
      })
      .onUpdate((e) => {
        translateX.value = e.translationX;
        translateY.value = e.translationY;
      })
      .onEnd((e) => {
        const shouldSwipeRight = e.translationX > SWIPE_THRESHOLD;
        const shouldSwipeLeft = e.translationX < -SWIPE_THRESHOLD;

        if (shouldSwipeRight && activeItem) {
          translateX.value = withTiming(SWIPE_OUT_DISTANCE, { duration: 250 }, (finished) => {
            if (finished) runOnJS(handleSwipeRight)(activeItem);
          });
          translateY.value = withTiming(e.translationY + e.velocityY * 0.1, { duration: 250 });
        } else if (shouldSwipeLeft && activeItem) {
          translateX.value = withTiming(-SWIPE_OUT_DISTANCE, { duration: 250 }, (finished) => {
            if (finished) runOnJS(handleSwipeLeft)(activeItem);
          });
          translateY.value = withTiming(e.translationY + e.velocityY * 0.1, { duration: 250 });
        } else {
          translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
          translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
          runOnJS(scheduleIdleSway)();
        }
      });
  }, [activeItem, handleSwipeLeft, handleSwipeRight, translateX, translateY, stopIdleSway, scheduleIdleSway]);

  const tapGesture = useMemo(() => {
    return Gesture.Tap()
      .maxDistance(10)
      .onEnd(() => {
        if (activeItem) runOnJS(onTap ?? (() => {}))(activeItem);
      });
  }, [activeItem, onTap]);

  const composedGesture = useMemo(() => Gesture.Exclusive(panGesture, tapGesture), [panGesture, tapGesture]);

  const topCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate + idleRotate.value}deg` },
      ],
    };
  });

  const likeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  const nopeOverlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0], Extrapolation.CLAMP),
  }));

  if (activeIndex >= data.length) {
    return <View style={styles.container}>{onEmpty?.()}</View>;
  }

  const visibleItems = data.slice(activeIndex, activeIndex + MAX_VISIBLE_STACK);

  return (
    <View style={styles.container}>
      {visibleItems
        .map((item, i) => ({ item, stackIndex: i }))
        .reverse()
        .map(({ item, stackIndex }) => {
          const key = keyExtractor(item);
          if (stackIndex === 0) {
            return (
              <GestureDetector gesture={composedGesture} key={key}>
                <Animated.View
                  style={[
                    styles.cardSlot,
                    cardWidth ? { width: cardWidth } : null,
                    cardHeight ? { height: cardHeight } : null,
                    topCardStyle,
                  ]}
                >
                  {renderCard(item, activeIndex)}
                  <Animated.View pointerEvents="none" style={[styles.overlayIcon, likeOverlayStyle]}>
                    <Ionicons name="heart" size={80} color="#22C55E" />
                  </Animated.View>
                  <Animated.View pointerEvents="none" style={[styles.overlayIcon, nopeOverlayStyle]}>
                    <Ionicons name="close" size={80} color="#EF4444" />
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            );
          }

          // Cards behind the top one: static peek, alternately tilted.
          const tilt = stackIndex % 2 === 0 ? 1 : -1;
          const scale = 1 - stackIndex * 0.03;
          const offsetY = stackIndex * 18;
          return (
            <View
              key={key}
              pointerEvents="none"
              style={[
                styles.cardSlot,
                cardWidth ? { width: cardWidth } : null,
                cardHeight ? { height: cardHeight } : null,
                {
                  transform: [
                    { translateY: offsetY },
                    { rotate: `${tilt * (2 + stackIndex * 1.5)}deg` },
                    { scale },
                  ],
                  zIndex: -stackIndex,
                },
              ]}
            >
              {renderCard(item, activeIndex + stackIndex)}
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSlot: {
    position: 'absolute',
    borderRadius: RADIUS['2xl'],
  },
  overlayIcon: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
