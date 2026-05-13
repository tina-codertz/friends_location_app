/**
 * Icon Symbol Component - Placeholder for SF Symbols
 */

import React from 'react';
import { Text, TextProps } from 'react-native';

interface IconSymbolProps extends TextProps {
  name: string;
  size?: number;
  color?: string;
  weight?: 'light' | 'regular' | 'semibold' | 'bold' | 'heavy';
}

// Map common icon names to Unicode symbols or emojis
const ICON_MAP: Record<string, string> = {
  'house.fill': '🏠',
  'paperplane.fill': '✈️',
  'heart.fill': '❤️',
  'person.fill': '👤',
  'gear': '⚙️',
  'plus': '+',
  'xmark': '✕',
  'fingerprint': '🫆',
  'fingerprint.fill': '🫆',
};

export const IconSymbol: React.FC<IconSymbolProps> = ({
  name,
  size = 24,
  color = '#000',
  weight = 'regular',
  ...props
}) => {
  const iconSymbol = ICON_MAP[name] || '◆';

  return (
    <Text
      {...props}
      style={[
        {
          fontSize: size,
          color,
          fontWeight: weight === 'light' ? '300' : weight === 'semibold' ? '600' : weight === 'bold' ? '700' : weight === 'heavy' ? '900' : '400',
        },
        props.style,
      ]}>
      {iconSymbol}
    </Text>
  );
};
