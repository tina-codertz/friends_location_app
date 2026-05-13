/**
 * ThemeContext — Global device-aware theme provider
 *
 * Uses React Native's `useColorScheme()` (which Expo wraps for
 * iOS / Android / Web) to detect the device's current light/dark
 * preference, then exposes the matching colour palette to every
 * screen and component via `useAppTheme()`.
 *
 * The root layout wraps the entire app with `<AppThemeProvider>`.
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { ThemeColors, Accent, type ThemeColors as ThemeColorsType } from '@/constants/theme';

// ─── Context value shape ─────────────────────────────────────────────────────
interface AppThemeContextValue {
  /** 'dark' | 'light' */
  mode: 'dark' | 'light';
  /** Whether device is in dark mode */
  isDark: boolean;
  /** Full colour palette for the current mode */
  colors: ThemeColorsType;
  /** Shared accent colours (same in both modes) */
  accent: typeof Accent;
}

const AppThemeContext = createContext<AppThemeContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────
export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const scheme = useColorScheme(); // 'dark' | 'light' | null

  const value = useMemo<AppThemeContextValue>(() => {
    const mode = scheme === 'light' ? 'light' : 'dark'; // fallback → dark
    return {
      mode,
      isDark: mode === 'dark',
      colors: ThemeColors[mode],
      accent: Accent,
    };
  }, [scheme]);

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * Returns the current theme colours and mode.
 *
 * @example
 * ```tsx
 * const { colors, isDark, accent } = useAppTheme();
 * <View style={{ backgroundColor: colors.bg }} />
 * ```
 */
export const useAppTheme = (): AppThemeContextValue => {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error(
      'useAppTheme must be used inside <AppThemeProvider>. ' +
      'Wrap your root layout with AppThemeProvider.'
    );
  }
  return ctx;
};

export default AppThemeProvider;
