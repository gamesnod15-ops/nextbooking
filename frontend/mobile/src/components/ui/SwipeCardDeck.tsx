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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.28;
const SWIPE_OUT_DISTANCE = SCREEN_WIDTH * 1.4;
const MAX_VISIBLE_STACK = 3;
const PEEK_HEIGHT = 30;

export interface SwipeCardDeckProps<T> {
  data: T[];
  keyExtractor: (item: T) => string;
  renderCard: (item: T, index: number) => React.ReactNode;
  onSwipeLeft?: (item: T) => void;
  onSwipeRight?: (item: T) => void;
  onTap?: (item: T) => void;
  onEmpty?: () => React.ReactNode;
  onExhausted?: () => void;
  cardWidth?: number;
  cardHeight?: number;
}

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

  const baseWidth = cardWidth ?? SCREEN_WIDTH - 32;
  const baseHeight = cardHeight ?? Math.min(SCREEN_HEIGHT * 0.6, 560);
  const visibleCount = data.length > activeIndex
    ? Math.min(data.length - activeIndex, MAX_VISIBLE_STACK)
    : 0;
  const deckHeight = baseHeight + Math.max(0, visibleCount - 1) * PEEK_HEIGHT;



  const dataKey = useMemo(() => data.map(keyExtractor).join('|'), [data, keyExtractor]);
  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    setActiveIndex(0);
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
    return <View style={[styles.container, { width: baseWidth, height: baseHeight }]}>{onEmpty?.()}</View>;
  }

  const visibleItems = data.slice(activeIndex, activeIndex + MAX_VISIBLE_STACK);

  return (
    <View style={[styles.container, { width: baseWidth, height: deckHeight }]}>
      {visibleItems.slice(1).map((item, i) => {
        const stackIndex = i + 1;
        const tilt = stackIndex % 2 === 0 ? 1 : -1;
        const scale = 1 - stackIndex * 0.03;
        const opacity = 1 - stackIndex * 0.08;
        return (
          <View
            key={keyExtractor(item)}
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: stackIndex * PEEK_HEIGHT,
              alignSelf: 'center',
              width: baseWidth,
              height: baseHeight,
              opacity,
              borderRadius: RADIUS['2xl'],
              transform: [
                { rotate: `${tilt * 2}deg` },
                { scale },
              ],
              zIndex: 1,
            }}
          >
            {renderCard(item, activeIndex + stackIndex)}
          </View>
        );
      })}
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.cardSlot,
            { width: baseWidth, height: baseHeight, alignSelf: 'center', zIndex: 2 },
            topCardStyle,
          ]}
        >
          {renderCard(activeItem, activeIndex)}
          <Animated.View pointerEvents="none" style={[styles.overlayIcon, likeOverlayStyle]}>
            <Ionicons name="heart" size={80} color="#22C55E" />
          </Animated.View>
          <Animated.View pointerEvents="none" style={[styles.overlayIcon, nopeOverlayStyle]}>
            <Ionicons name="close" size={80} color="#EF4444" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    alignItems: 'center',
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
