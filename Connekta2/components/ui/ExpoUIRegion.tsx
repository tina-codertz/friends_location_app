/**
 * ExpoUIRegion — small @expo/ui Host island for forms, typography, switches.
 *
 * Never wrap a full screen — only cards, modals, and button groups. Mounting
 * Animated views, ScrollViews, or maps inside a screen-level Host crashes
 * SwiftUIVirtualView in Expo Go.
 */

import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Host } from '@expo/ui';
import { useExpoUI } from '@/context/ExpoUIContext';
import { ExpoUIHostScope } from '@/context/ExpoUIContext';

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  matchContents?: boolean;
};

export function ExpoUIRegion({ children, style, matchContents = true }: Props) {
  const { disabled } = useExpoUI();

  if (disabled) {
    return <View style={style}>{children}</View>;
  }

  const host = matchContents ? (
    <Host matchContents style={style}>{children}</Host>
  ) : (
    <Host style={style}>{children}</Host>
  );

  return <ExpoUIHostScope disabled={false}>{host}</ExpoUIHostScope>;
}
