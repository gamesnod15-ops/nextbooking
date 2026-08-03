import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from './theme';

export const THEME_KEY = 'app_theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

/**
 * COLORS is declared `as const`, so its values are literal types. Widen them to
 * plain strings here — otherwise the dark palette could not supply its own
 * values while keeping the same keys.
 */
export type Palette = {
  [K in keyof typeof COLORS]: (typeof COLORS)[K] extends string
    ? string
    : { [P in keyof (typeof COLORS)[K]]: string };
};

/** Light palette is the existing COLORS object, unchanged. */
export const LIGHT_COLORS: Palette = COLORS;

/**
 * Dark palette. Keys mirror COLORS exactly so a themed component can swap the
 * whole object without touching any individual usage.
 */
export const DARK_COLORS: Palette = {
  primary: '#E0958A',
  primaryDark: '#3B1D18',
  primaryLight: '#4A2A22',
  primaryMuted: 'rgba(224, 149, 138, 0.16)',

  black: '#F8FAFC',
  white: '#0B1220',

  bg: '#1A1512',
  surface: '#241D19',
  surfaceAlt: '#2E2521',
  surfaceDark: '#120E0C',

  text: '#F3EAE4',
  textSecondary: '#C7B8AE',
  textMuted: '#9A8A80',
  textInverse: '#1A1512',

  border: '#3D322B',
  borderLight: '#2E2521',

  success: '#22C55E',
  successLight: '#0F2C1C',
  successText: '#86EFAC',
  warning: '#F59E0B',
  warningLight: '#32250A',
  warningText: '#FCD34D',
  error: '#EF4444',
  errorLight: '#33161A',
  errorText: '#FCA5A5',
  info: '#3B82F6',
  infoLight: '#152740',
  infoText: '#BFDBFE',

  pending: { bg: '#32250A', text: '#FCD34D', border: '#4A3810' },
  confirmed: { bg: '#0F2C1C', text: '#86EFAC', border: '#17452B' },
  cancelled: { bg: '#33161A', text: '#FCA5A5', border: '#4C2126' },
  completed: { bg: '#3B1D18', text: '#E8B9AE', border: '#5A2E26' },
  no_show: { bg: '#2E2521', text: '#9A8A80', border: '#3D322B' },

  starter: '#9A8A80',
  business: '#E0958A',
  professional: '#D8B673',
  custom: '#9FBBA5',

  overlay: 'rgba(0,0,0,0.62)',
  overlayLight: 'rgba(0,0,0,0.28)',
};

interface ThemeContextValue {
  /** What the user picked. */
  preference: ThemePreference;
  /** What is actually applied right now. */
  theme: ResolvedTheme;
  colors: Palette;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextValue>({
  preference: 'light',
  theme: 'light',
  colors: LIGHT_COLORS,
  setPreference: async () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** Palette for the active theme. */
export function useColors() {
  return useContext(ThemeContext).colors;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'system' || saved === 'light' || saved === 'dark') {
          setPreferenceState(saved);
        }
      } catch {
        /* keep the default */
      }
    })();
  }, []);

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch {
      /* applies for this session regardless */
    }
  }, []);

  const theme: ResolvedTheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({
      preference,
      theme,
      colors: theme === 'dark' ? DARK_COLORS : LIGHT_COLORS,
      setPreference,
    }),
    [preference, theme, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
