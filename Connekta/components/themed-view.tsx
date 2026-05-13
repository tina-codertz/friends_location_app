/**
 * Themed View Component
 */

import React from 'react';
import { View, type ViewProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const backgroundColor = useColorScheme() === 'dark' ? darkColor : lightColor;
  const colorScheme = useColorScheme();

  return (
    <View
      {...otherProps}
      style={[
        {
          backgroundColor:
            backgroundColor || Colors[colorScheme ?? 'light'].background,
        },
        style,
      ]}
    />
  );
}
