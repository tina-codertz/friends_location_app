import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface VectorIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}

/**
 * Wrapper for Ionicons from @expo/vector-icons
 * Provides consistent icon usage across the app
 */
export const VectorIcon = ({ name, size = 24, color = '#ECEDEE' }: VectorIconProps) => {
  return <Ionicons name={name} size={size} color={color} />;
};
