/**
 * Connekta Theme — calm safety palette.
 * Trust-first colors: teal for primary actions, green for live, red for SOS.
 */

import { Platform } from 'react-native';

const ACCENT = {
  cyan: '#0EA5A4',
  cyanDeep: '#0F766E',
  electricBlue: '#2563EB',
  electricBlueDeep: '#1D4ED8',
  teal: '#0EA5A4',
  tealDark: '#0F766E',
  green: '#16A34A',
  greenDark: '#15803D',
  sos: '#DC2626',
  sosMuted: 'rgba(220,38,38,0.18)',
  orange: '#F59E0B',
  error: '#DC2626',
  errorDark: '#B91C1C',
  coral: '#0EA5A4',
  purple: '#2563EB',
};

const dark = {
  bg: '#0F172A',
  bgCard: '#172033',
  bgCardBorder: '#334155',
  surface: '#1E293B',
  surfaceHover: '#263449',

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textTertiary: '#64748B',

  glassBgLight: '#172033',
  glassBgMedium: '#172033',
  glassBgHeavy: '#1E293B',
  glassBorderLight: '#273548',
  glassBorderMedium: '#334155',
  glassBorderHeavy: '#475569',
  glassHighlight: 'rgba(255,255,255,0.06)',
  glassShadow: 'rgba(0,0,0,0.28)',

  tealGlow: 'rgba(45,212,191,0.14)',
  tealGlass: 'rgba(45,212,191,0.10)',
  tealBorder: 'rgba(45,212,191,0.35)',
  tealBorderFocus: 'rgba(45,212,191,0.55)',
  purpleGlow: 'rgba(96,165,250,0.12)',

  inputBg: '#111827',
  inputBgFocus: '#172033',
  inputBorder: '#334155',
  inputBorderFocus: 'rgba(45,212,191,0.65)',
  inputPlaceholder: '#64748B',

  errorBg: 'rgba(220,38,38,0.12)',
  errorBorder: 'rgba(248,113,113,0.5)',

  pill: 'rgba(45,212,191,0.12)',
  divider: '#273548',
  overlay: 'rgba(15,23,42,0.62)',
  liveGreenBg: 'rgba(34,197,94,0.14)',
  phoneTabBg: 'rgba(15,23,42,0.92)',
  mapBg: '#0F172A',

  statusBarStyle: 'light' as 'light' | 'dark',

  navBackground: '#0F172A',
  navCard: '#172033',
  navText: '#F8FAFC',
  navBorder: '#273548',
  navPrimary: ACCENT.cyan,
};

const light = {
  bg: '#F6F8FA',
  bgCard: '#FFFFFF',
  bgCardBorder: '#E5E7EB',
  surface: '#EEF3F6',
  surfaceHover: '#E5EEF3',

  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textTertiary: '#9CA3AF',

  glassBgLight: '#FFFFFF',
  glassBgMedium: '#FFFFFF',
  glassBgHeavy: '#F8FAFC',
  glassBorderLight: '#E5E7EB',
  glassBorderMedium: '#D1D5DB',
  glassBorderHeavy: '#CBD5E1',
  glassHighlight: 'rgba(255,255,255,0.7)',
  glassShadow: 'rgba(15,23,42,0.08)',

  tealGlow: 'rgba(14,165,164,0.12)',
  tealGlass: 'rgba(14,165,164,0.10)',
  tealBorder: 'rgba(14,165,164,0.35)',
  tealBorderFocus: 'rgba(14,165,164,0.55)',
  purpleGlow: 'rgba(37,99,235,0.10)',

  inputBg: '#FFFFFF',
  inputBgFocus: '#FFFFFF',
  inputBorder: '#E5E7EB',
  inputBorderFocus: 'rgba(14,165,164,0.55)',
  inputPlaceholder: '#9CA3AF',

  errorBg: 'rgba(220,38,38,0.08)',
  errorBorder: 'rgba(220,38,38,0.45)',

  pill: 'rgba(14,165,164,0.12)',
  divider: '#E5E7EB',
  overlay: 'rgba(15,23,42,0.22)',
  liveGreenBg: 'rgba(22,163,74,0.12)',
  phoneTabBg: 'rgba(255,255,255,0.94)',
  mapBg: '#EEF3F6',

  statusBarStyle: 'dark' as 'light' | 'dark',

  navBackground: '#F6F8FA',
  navCard: '#FFFFFF',
  navText: '#111827',
  navBorder: '#E5E7EB',
  navPrimary: ACCENT.cyanDeep,
};

export type ThemeColors = typeof dark;

export const ThemeColors = {
  dark,
  light,
} as const;

export const Accent = ACCENT;

export const Colors = {
  light: {
    text: '#111827',
    background: light.bg,
    tint: ACCENT.cyan,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: ACCENT.cyan,
  },
  dark: {
    text: '#F8FAFC',
    background: dark.bg,
    tint: ACCENT.cyan,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: ACCENT.cyan,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
