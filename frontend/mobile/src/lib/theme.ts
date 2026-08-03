// ─── Brand Colors ───────────────────────────────────────────────────────────
export const COLORS = {
  // Primary — toz gülü (rose)
  primary: '#C97D72',
  primaryDark: '#6B372E',
  primaryLight: '#F3DAD3',
  primaryMuted: 'rgba(201, 125, 114, 0.12)',

  // Neutrals
  black: '#2B241E',
  white: '#FFFFFF',

  // Backgrounds
  bg: '#FBF6F2',
  surface: '#FFFFFF',
  surfaceAlt: '#F5EDE7',
  surfaceDark: '#6B372E',

  // Text
  text: '#2B241E',
  textSecondary: '#7A6F63',
  textMuted: '#8F8175',
  textInverse: '#FFFFFF',

  // Border
  border: '#E9DDD3',
  borderLight: '#F5EDE7',

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
  completed: { bg: '#F3DAD3', text: '#8A4A3F', border: '#E8C4BA' },
  no_show: { bg: '#F5EDE7', text: '#8F8175', border: '#E9DDD3' },

  // Plan colors
  starter: '#8F8175',
  business: '#C97D72',
  professional: '#C9A66B',
  custom: '#7C9A82',

  // Overlay
  overlay: 'rgba(43,36,30,0.5)',
  overlayLight: 'rgba(43,36,30,0.15)',
} as const;

/**
 * Always literally white/black, independent of the active theme.
 *
 * `COLORS.white`/`COLORS.black` intentionally flip in dark mode (a "white"
 * card background becomes a dark card background) — that's correct for
 * surfaces, but wrong for text/icons drawn on a permanently-colored element
 * (a primary button, a gradient hero, a colored badge), which must stay
 * legible regardless of theme. Use these two for that case instead of
 * `useColors().white`/`.black`.
 */
export const STATIC_WHITE = '#FFFFFF';
export const STATIC_BLACK = '#2B241E';

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
    shadowColor: '#2B241E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#2B241E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#2B241E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  primary: {
    shadowColor: '#C97D72',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};
