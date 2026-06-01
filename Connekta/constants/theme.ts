/**
 * Connekta Theme — Blue edition (cyan hero, glass on dark midnight).
 * Reference: connekta_screens/*_blue_edition + pulsemap_core/DESIGN.md
 *
 * Rules: no pink/purple brand accents; real Mapbox only on (tabs)/map.
 */

import { Platform } from 'react-native';

/** Cyan-led accents — no pink or purple in brand UI */
const ACCENT = {
  /** Primary brand / CTAs / active tab */
  cyan: '#00DBE9',
  cyanDeep: '#00A8B8',
  /** Aliases used across existing components */
  electricBlue: '#00DBE9',
  electricBlueDeep: '#00A8B8',
  teal: '#00DBE9',
  tealDark: '#00A8B8',
  /** Live / online only */
  green: '#94DB00',
  greenDark: '#6BB800',
  /** SOS / critical only (not pink) */
  sos: '#FF453A',
  sosMuted: 'rgba(255,69,58,0.35)',
  orange: '#38BDF8',
  /** Errors */
  error: '#FF6B6B',
  errorDark: '#EF4444',
  /** Deprecated aliases — map to cyan so old refs stay blue */
  coral: '#00DBE9',
  purple: '#00DBE9',
};

const dark = {
  bg: '#131316',
  bgCard: '#1F1F22',
  bgCardBorder: 'rgba(0,219,233,0.12)',
  surface: 'rgba(255,255,255,0.06)',
  surfaceHover: 'rgba(255,255,255,0.10)',

  textPrimary: '#E4E1E6',
  textSecondary: 'rgba(228,225,230,0.72)',
  textMuted: '#9D8BA0',
  textTertiary: 'rgba(228,225,230,0.38)',

  glassBgLight: 'rgba(19,19,22,0.72)',
  glassBgMedium: 'rgba(31,31,34,0.82)',
  glassBgHeavy: 'rgba(42,42,45,0.88)',
  glassBorderLight: 'rgba(0,219,233,0.14)',
  glassBorderMedium: 'rgba(0,219,233,0.22)',
  glassBorderHeavy: 'rgba(0,219,233,0.32)',
  glassHighlight: 'rgba(0,219,233,0.08)',
  glassShadow: 'rgba(0,0,0,0.5)',

  tealGlow: 'rgba(0,219,233,0.22)',
  tealGlass: 'rgba(0,219,233,0.14)',
  tealBorder: 'rgba(0,219,233,0.42)',
  tealBorderFocus: 'rgba(0,219,233,0.65)',
  purpleGlow: 'rgba(0,219,233,0.12)',

  inputBg: 'rgba(255,255,255,0.06)',
  inputBgFocus: 'rgba(0,219,233,0.08)',
  inputBorder: 'rgba(255,255,255,0.14)',
  inputBorderFocus: 'rgba(0,219,233,0.55)',
  inputPlaceholder: 'rgba(228,225,230,0.4)',

  errorBg: 'rgba(255,69,58,0.12)',
  errorBorder: 'rgba(255,69,58,0.5)',

  pill: 'rgba(0,219,233,0.16)',
  divider: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(0,0,0,0.55)',
  liveGreenBg: 'rgba(148,219,0,0.18)',
  phoneTabBg: 'rgba(19,19,22,0.85)',
  mapBg: '#131316',

  statusBarStyle: 'light' as 'light' | 'dark',

  navBackground: '#131316',
  navCard: 'rgba(31,31,34,0.92)',
  navText: '#E4E1E6',
  navBorder: 'rgba(0,219,233,0.12)',
  navPrimary: ACCENT.cyan,
};

const light = {
  bg: '#E8F4F8',
  bgCard: '#FFFFFF',
  bgCardBorder: 'rgba(0,168,184,0.15)',
  surface: 'rgba(0,0,0,0.04)',
  surfaceHover: 'rgba(0,0,0,0.07)',

  textPrimary: 'rgba(0,0,0,0.87)',
  textSecondary: 'rgba(0,0,0,0.55)',
  textMuted: '#5C5C5C',
  textTertiary: 'rgba(0,0,0,0.35)',

  glassBgLight: 'rgba(255,255,255,0.65)',
  glassBgMedium: 'rgba(255,255,255,0.78)',
  glassBgHeavy: 'rgba(255,255,255,0.88)',
  glassBorderLight: 'rgba(0,168,184,0.12)',
  glassBorderMedium: 'rgba(0,168,184,0.2)',
  glassBorderHeavy: 'rgba(0,168,184,0.28)',
  glassHighlight: 'rgba(255,255,255,0.9)',
  glassShadow: 'rgba(0,0,0,0.08)',

  tealGlow: 'rgba(0,168,184,0.15)',
  tealGlass: 'rgba(0,168,184,0.1)',
  tealBorder: 'rgba(0,168,184,0.35)',
  tealBorderFocus: 'rgba(0,168,184,0.55)',
  purpleGlow: 'rgba(0,168,184,0.1)',

  inputBg: 'rgba(0,0,0,0.04)',
  inputBgFocus: 'rgba(0,168,184,0.06)',
  inputBorder: 'rgba(0,0,0,0.1)',
  inputBorderFocus: 'rgba(0,168,184,0.5)',
  inputPlaceholder: 'rgba(0,0,0,0.4)',

  errorBg: 'rgba(239,68,68,0.08)',
  errorBorder: 'rgba(239,68,68,0.5)',

  pill: 'rgba(0,168,184,0.2)',
  divider: 'rgba(0,0,0,0.08)',
  overlay: 'rgba(0,0,0,0.15)',
  liveGreenBg: 'rgba(148,219,0,0.15)',
  phoneTabBg: 'rgba(255,255,255,0.9)',
  mapBg: '#D6EEF2',

  statusBarStyle: 'dark' as 'light' | 'dark',

  navBackground: '#E8F4F8',
  navCard: '#FFFFFF',
  navText: '#11181C',
  navBorder: 'rgba(0,168,184,0.12)',
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
    text: '#11181C',
    background: light.bg,
    tint: ACCENT.cyan,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: ACCENT.cyan,
  },
  dark: {
    text: '#E4E1E6',
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
