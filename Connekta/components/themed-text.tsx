/**
 * Themed Text Component
 */

import React from 'react';
import { Text, type TextProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useColorScheme() === 'dark' ? darkColor : lightColor;
  const colorScheme = useColorScheme();

  return (
    <Text
      {...rest}
      style={[
        {
          color: color || Colors[colorScheme ?? 'light'].text,
        },
        type === 'default' && { fontSize: 16 },
        type === 'title' && { fontSize: 28, fontWeight: 'bold' },
        type === 'subtitle' && { fontSize: 20, fontWeight: '600' },
        type === 'link' && { fontSize: 16, color: Colors[colorScheme ?? 'light'].tint },
        style,
      ]}
    />
  );
}
