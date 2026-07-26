import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS, FONT, RADIUS, SHADOW, SPACE } from '@/lib/theme';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  variant?: ToastVariant;
  /** ms before auto-dismiss; 0 keeps it until tapped. */
  duration?: number;
}

interface ToastContextValue {
  show: (message: string, options?: ToastOptions) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const VARIANTS: Record<ToastVariant, { icon: keyof typeof Ionicons.glyphMap; bg: string; fg: string }> = {
  success: { icon: 'checkmark-circle', bg: COLORS.successLight, fg: COLORS.successText },
  error: { icon: 'alert-circle', bg: COLORS.errorLight, fg: COLORS.errorText },
  info: { icon: 'information-circle', bg: COLORS.infoLight, fg: COLORS.infoText },
  warning: { icon: 'warning', bg: COLORS.warningLight, fg: COLORS.warningText },
};

interface ToastState {
  message: string;
  variant: ToastVariant;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, [anim]);

  const show = useCallback(
    (message: string, options: ToastOptions = {}) => {
      const variant = options.variant ?? 'info';
      const duration = options.duration ?? 3000;

      if (timer.current) clearTimeout(timer.current);
      setToast({ message, variant });

      if (Platform.OS !== 'web') {
        const style =
          variant === 'success'
            ? Haptics.NotificationFeedbackType.Success
            : variant === 'error'
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning;
        if (variant !== 'info') {
          Haptics.notificationAsync(style).catch(() => {});
        }
      }

      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 9, tension: 70 }).start();

      if (duration > 0) {
        timer.current = setTimeout(hide, duration);
      }
    },
    [anim, hide]
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const value: ToastContextValue = {
    show,
    success: useCallback((m: string) => show(m, { variant: 'success' }), [show]),
    error: useCallback((m: string) => show(m, { variant: 'error' }), [show]),
    info: useCallback((m: string) => show(m, { variant: 'info' }), [show]),
    warning: useCallback((m: string) => show(m, { variant: 'warning' }), [show]),
  };

  const meta = toast ? VARIANTS[toast.variant] : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && meta && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.wrap,
            { bottom: insets.bottom + 96 },
            {
              opacity: anim,
              transform: [
                { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={hide}
            style={[styles.toast, { backgroundColor: meta.bg, borderColor: meta.fg + '33' }]}
            accessibilityRole="alert"
            accessibilityLabel={toast.message}
          >
            <Ionicons name={meta.icon} size={19} color={meta.fg} />
            <Text style={[styles.message, { color: meta.fg }]} numberOfLines={3}>
              {toast.message}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: SPACE[5],
    right: SPACE[5],
    alignItems: 'center',
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACE[3],
    paddingHorizontal: SPACE[4],
    paddingVertical: SPACE[3] + 2,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    alignSelf: 'stretch',
    ...SHADOW.sm,
  },
  message: { flex: 1, fontSize: FONT.sm, fontWeight: FONT.semibold, lineHeight: 19 },
});
