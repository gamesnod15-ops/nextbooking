import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { FONT, RADIUS, SHADOW, SPACE, STATIC_WHITE } from '@/lib/theme';
import { useColors, type Palette } from '@/lib/themeContext';

const NetworkContext = createContext<{ isOnline: boolean }>({ isOnline: true });

/** True when the device has a usable internet connection. */
export function useIsOnline() {
  return useContext(NetworkContext).isOnline;
}

/**
 * Subscribes to connectivity once and renders a banner while offline.
 * `isInternetReachable` can be null while probing — treated as online so we
 * don't flash a false warning on startup.
 */
export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const COLORS = useColors();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const [isOnline, setIsOnline] = useState(true);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOnline ? 0 : 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOnline, anim]);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
      {!isOnline && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { top: insets.top + SPACE[2] },
            {
              opacity: anim,
              transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <View style={styles.banner} accessibilityRole="alert">
            <Ionicons name="cloud-offline-outline" size={16} color={STATIC_WHITE} />
            <Text style={styles.text}>İnternet bağlantısı yok</Text>
          </View>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
}

const createStyles = (COLORS: Palette) => StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SPACE[5],
    right: SPACE[5],
    alignItems: 'center',
    zIndex: 9998,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[2],
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[2] + 2,
    borderRadius: RADIUS.full,
    ...SHADOW.sm,
  },
  text: { fontSize: FONT.xs, fontWeight: FONT.bold, color: STATIC_WHITE },
});
