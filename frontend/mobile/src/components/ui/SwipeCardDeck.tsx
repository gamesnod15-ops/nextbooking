import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Extrapolation,
} from 'react-native-reanimated';
import { RADIUS } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_OUT_DISTANCE = SCREEN_WIDTH * 1.4;
const MAX_VISIBLE_STACK = 3;

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

  const panGesture = useMemo(() => {
    return Gesture.Pan()
      .enabled(!!activeItem)
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
        }
      });
  }, [activeItem, handleSwipeLeft, handleSwipeRight, translateX, translateY]);

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
        { rotate: `${rotate}deg` },
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
                  <Animated.View pointerEvents="none" style={[styles.badge, styles.likeBadge, likeOverlayStyle]}>
                    <Animated.Text style={styles.badgeText}>BEĞENDİM</Animated.Text>
                  </Animated.View>
                  <Animated.View pointerEvents="none" style={[styles.badge, styles.nopeBadge, nopeOverlayStyle]}>
                    <Animated.Text style={styles.badgeText}>GEÇ</Animated.Text>
                  </Animated.View>
                </Animated.View>
              </GestureDetector>
            );
          }

          // Cards behind the top one: static peek, alternately tilted.
          const tilt = stackIndex % 2 === 0 ? 1 : -1;
          const scale = 1 - stackIndex * 0.04;
          const offsetY = stackIndex * 10;
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
  badge: {
    position: 'absolute',
    top: 24,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 3,
  },
  likeBadge: {
    left: 20,
    borderColor: '#22C55E',
    transform: [{ rotate: '-18deg' }],
  },
  nopeBadge: {
    right: 20,
    borderColor: '#EF4444',
    transform: [{ rotate: '18deg' }],
  },
  badgeText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
