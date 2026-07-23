// ─── Brand Colors ───────────────────────────────────────────────────────────
export const COLORS = {
  // Primary blue brand
  primary: '#0154F0',
  primaryDark: '#08224B',
  primaryLight: '#B6CEFC',
  primaryMuted: 'rgba(1, 84, 240, 0.12)',

  // Neutrals
  black: '#051638',
  white: '#FFFFFF',

  // Backgrounds
  bg: '#E9F0FD',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F4FC',
  surfaceDark: '#08224B',

  // Text
  text: '#08224B',
  textSecondary: '#607193',
  textMuted: '#8E9BB2',
  textInverse: '#FFFFFF',

  // Border
  border: '#B6CEFC',
  borderLight: '#E9F0FD',

  // Semantic
  success: '#22C55E',
  successLight: '#DCFCE7',
  successText: '#166534',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningText: '#92400E',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  errorText: '#991B1B',
  info: '#0154F0',
  infoLight: '#B6CEFC',
  infoText: '#08224B',

  // Appointment statuses
  pending: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  confirmed: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  completed: { bg: '#B6CEFC', text: '#08224B', border: '#B6CEFC' },
  no_show: { bg: '#E9F0FD', text: '#7788A5', border: '#B6CEFC' },

  // Plan colors
  starter: '#7788A5',
  business: '#0154F0',
  professional: '#6097F3',
  custom: '#A1B6DC',

  // Overlay
  overlay: 'rgba(5,22,56,0.5)',
  overlayLight: 'rgba(5,22,56,0.15)',
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────
export const FONT = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 34,

  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

// ─── Spacing ────────────────────────────────────────────────────────────────
export const SPACE = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

// ─── Radius ─────────────────────────────────────────────────────────────────
export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 9999,
};

// ─── Shadow ─────────────────────────────────────────────────────────────────
export const SHADOW = {
  sm: {
    shadowColor: '#08224B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#08224B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#08224B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  primary: {
    shadowColor: '#0154F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};
