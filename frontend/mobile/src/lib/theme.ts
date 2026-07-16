// ─── Brand Colors ───────────────────────────────────────────────────────────
export const COLORS = {
  // Primary red brand
  primary: '#CE0D1E',
  primaryDark: '#A70B18',
  primaryLight: '#E78B93',
  primaryMuted: 'rgba(206, 13, 30, 0.12)',

  // Neutrals
  black: '#0A0A0A',
  white: '#FFFFFF',

  // Backgrounds
  bg: '#F6F6F4',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0EE',
  surfaceDark: '#1A1A1A',

  // Text
  text: '#0A0A0A',
  textSecondary: '#555555',
  textMuted: '#999999',
  textInverse: '#FFFFFF',

  // Border
  border: '#E8E8E8',
  borderLight: '#F0F0F0',

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
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  infoText: '#1E40AF',

  // Appointment statuses
  pending: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  confirmed: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
  cancelled: { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' },
  completed: { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' },
  no_show: { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' },

  // Plan colors
  starter: '#6B7280',
  business: '#3B82F6',
  professional: '#8B5CF6',
  custom: '#F59E0B',

  // Overlay
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.15)',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  primary: {
    shadowColor: '#CE0D1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
};
