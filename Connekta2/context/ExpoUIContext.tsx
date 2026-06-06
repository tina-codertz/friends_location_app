/**
 * ExpoUIContext — central control plane for @expo/ui usage across the app.
 *
 * Expo UI requires a Host ancestor for Text, Switch, ScrollView, etc.
 * NativeScreen establishes that Host per screen; this context tracks whether
 * the current subtree is inside one, and which screens opt out (e.g. map tab).
 */

import React, { createContext, useContext, useMemo } from 'react';
import { useAppTheme } from '@/context/ThemeContext';
import { Accent, type ThemeColors } from '@/constants/theme';

type ExpoUIContextValue = {
  /** True when inside a NativeScreen Host (safe for @expo/ui children). */
  isHosted: boolean;
  /** Screen opted out of Expo UI — pure RN subtree (map overlays, etc.). */
  disabled: boolean;
  colors: ThemeColors;
  accent: typeof Accent;
};

const defaultValue: ExpoUIContextValue = {
  isHosted: false,
  disabled: false,
  colors: {} as ThemeColors,
  accent: {} as typeof Accent,
};

const ExpoUIContext = createContext<ExpoUIContextValue>(defaultValue);

/** Root provider — sits in app/_layout.tsx, bridges AppTheme into Expo UI consumers. */
export function ExpoUIProvider({ children }: { children: React.ReactNode }) {
  const { colors, accent } = useAppTheme();
  const value = useMemo(
    () => ({ isHosted: false, disabled: false, colors, accent }),
    [colors, accent],
  );
  return <ExpoUIContext.Provider value={value}>{children}</ExpoUIContext.Provider>;
}

/** Marks a subtree as inside an ExpoUIRegion Host. */
export function ExpoUIHostScope({
  children,
  disabled = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const parent = useContext(ExpoUIContext);
  const value = useMemo(
    () => ({
      ...parent,
      isHosted: !disabled,
      disabled,
    }),
    [parent, disabled],
  );
  return <ExpoUIContext.Provider value={value}>{children}</ExpoUIContext.Provider>;
}

export function useExpoUI() {
  return useContext(ExpoUIContext);
}
