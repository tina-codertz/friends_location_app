/**
 * Connekta Theme System
 *
 * Comprehensive dark + light palettes that the ThemeContext reads.
 * Every colour used across the app lives here so a single
 * source-of-truth drives both modes automatically.
 *
 * Color-scheme detection happens in `context/ThemeContext.tsx`.
 */

import { Platform } from 'react-native';

// ─── Shared accent colours (same in both modes) ──────────────────────────────
const ACCENT = {
  electricBlue: '#1E90FF',
  electricBlueDeep: '#187bcd',
  coral: '#FF6F61',
  teal: '#1E90FF',
  tealDark: '#187bcd',
  purple: '#a78bfa',
  orange: '#fb923c',
  green: '#22c55e',
  error: '#f87171',
  errorDark: '#ef4444',
};

// ─── Dark palette ────────────────────────────────────────────────────────────
const dark = {
  // Backgrounds
  bg: '#121212',
  bgCard: '#1A1A1C',
  bgCardBorder: 'rgba(255,255,255,0.08)',
  surface: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.10)',

  // Text
  textPrimary: 'rgba(255,255,255,0.94)',
  textSecondary: 'rgba(255,255,255,0.62)',
  textMuted: '#B0B0B0',
  textTertiary: 'rgba(255,255,255,0.28)',

  // Glassmorphism
  glassBgLight: 'rgba(255,255,255,0.08)',
  glassBgMedium: 'rgba(255,255,255,0.12)',
  glassBgHeavy: 'rgba(255,255,255,0.18)',
  glassBorderLight: 'rgba(255,255,255,0.12)',
  glassBorderMedium: 'rgba(255,255,255,0.18)',
  glassBorderHeavy: 'rgba(255,255,255,0.26)',
  glassHighlight: 'rgba(255,255,255,0.14)',
  glassShadow: 'rgba(0,0,0,0.55)',

  // Accent glass variants
  tealGlow: 'rgba(30,144,255,0.18)',
  tealGlass: 'rgba(30,144,255,0.12)',
  tealBorder: 'rgba(30,144,255,0.38)',
  tealBorderFocus: 'rgba(30,144,255,0.55)',
  purpleGlow: 'rgba(167,139,250,0.08)',

  // Input
  inputBg: 'rgba(255,255,255,0.06)',
  inputBgFocus: 'rgba(255,255,255,0.10)',
  inputBorder: 'rgba(255,255,255,0.14)',
  inputBorderFocus: 'rgba(30,144,255,0.55)',
  inputPlaceholder: 'rgba(255,255,255,0.45)',

  // Error
  errorBg: 'rgba(255,111,97,0.10)',
  errorBorder: 'rgba(255,111,97,0.55)',

  // Misc
  pill: 'rgba(255,255,255,0.16)',
  divider: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(0,0,0,0.45)',
  liveGreenBg: 'rgba(34,197,94,0.15)',
  phoneTabBg: 'rgba(18,18,18,0.72)',
  mapBg: '#121212',

  // StatusBar
  statusBarStyle: 'light' as 'light' | 'dark',

  // Navigation theme overrides
  navBackground: '#141416',
  navCard: '#1A1A1C',
  navText: '#ffffff',
  navBorder: 'rgba(255,255,255,0.08)',
  navPrimary: '#1E90FF',
};

// ─── Light palette ───────────────────────────────────────────────────────────
const light = {
  // Backgrounds
  bg: '#f0f4f8',
  bgCard: '#ffffff',
  bgCardBorder: '#e2e8f0',
  surface: 'rgba(0,0,0,0.04)',
  surfaceHover: 'rgba(0,0,0,0.07)',

  // Text
  textPrimary: 'rgba(0,0,0,0.87)',
  textSecondary: 'rgba(0,0,0,0.55)',
  textMuted: '#5c5c5c',
  textTertiary: 'rgba(0,0,0,0.35)',

  // Glassmorphism
  glassBgLight: 'rgba(255,255,255,0.60)',
  glassBgMedium: 'rgba(255,255,255,0.75)',
  glassBgHeavy: 'rgba(255,255,255,0.85)',
  glassBorderLight: 'rgba(0,0,0,0.06)',
  glassBorderMedium: 'rgba(0,0,0,0.10)',
  glassBorderHeavy: 'rgba(0,0,0,0.15)',
  glassHighlight: 'rgba(255,255,255,0.90)',
  glassShadow: 'rgba(0,0,0,0.08)',

  // Accent glass variants
  tealGlow: 'rgba(45,212,191,0.12)',
  tealGlass: 'rgba(45,212,191,0.08)',
  tealBorder: 'rgba(20,184,166,0.35)',
  tealBorderFocus: 'rgba(20,184,166,0.55)',
  purpleGlow: 'rgba(167,139,250,0.08)',

  // Input
  inputBg: 'rgba(0,0,0,0.04)',
  inputBgFocus: 'rgba(0,0,0,0.06)',
  inputBorder: 'rgba(0,0,0,0.10)',
  inputBorderFocus: 'rgba(20,184,166,0.50)',
  inputPlaceholder: 'rgba(0,0,0,0.40)',

  // Error
  errorBg: 'rgba(239,68,68,0.08)',
  errorBorder: 'rgba(239,68,68,0.5)',

  // Misc
  pill: 'rgba(0,0,0,0.15)',
  divider: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.15)',
  liveGreenBg: 'rgba(34,197,94,0.12)',
  phoneTabBg: 'rgba(255,255,255,0.85)',
  mapBg: '#e8f0fe',

  // StatusBar
  statusBarStyle: 'dark' as 'light' | 'dark',

  // Navigation theme overrides
  navBackground: '#f0f4f8',
  navCard: '#ffffff',
  navText: '#11181C',
  navBorder: '#e2e8f0',
  navPrimary: '#14b8a6',
};

// ─── Exports ─────────────────────────────────────────────────────────────────

/** Full colour palette type */
export type ThemeColors = typeof dark;

/** Both palettes keyed by scheme */
export const ThemeColors = {
  dark,
  light,
} as const;

/** Shared accents accessible without context */
export const Accent = ACCENT;

/** Legacy Colors export (used by tabs layout, etc.) */
export const Colors = {
  light: {
    text: '#11181C',
    background: light.bg,
    tint: ACCENT.electricBlue,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: ACCENT.electricBlue,
  },
  dark: {
    text: '#ECEDEE',
    background: dark.bg,
    tint: ACCENT.electricBlue,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: ACCENT.electricBlue,
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
