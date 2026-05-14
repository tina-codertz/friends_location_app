/**
 * Icon Symbol Component - Uses Ionicons for consistent vector icons
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';

interface IconSymbolProps {
  name: string;
  size?: number;
  color?: string;
  weight?: 'light' | 'regular' | 'semibold' | 'bold' | 'heavy';
}

// Map SF Symbol names to Ionicons names
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  'house.fill': 'home',
  'map.fill': 'map',
  'person.2.fill': 'people',
  'cross.case.fill': 'warning',
  'gearshape.fill': 'settings',
  'paperplane.fill': 'send',
  'heart.fill': 'heart',
  'person.fill': 'person',
  'gear': 'settings',
  'plus': 'add',
  'xmark': 'close',
  'fingerprint': 'finger-print',
  'fingerprint.fill': 'finger-print',
};

export const IconSymbol: React.FC<IconSymbolProps> = ({
  name,
  size = 24,
  color = '#000',
  weight = 'regular',
}) => {
  const ioniconsName = ICON_MAP[name] || 'help-circle';

  return (
    <Ionicons
      name={ioniconsName}
      size={size}
      color={color}
    />
  );
};
