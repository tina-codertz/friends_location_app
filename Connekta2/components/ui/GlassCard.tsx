/**
 * Native card surface — Expo UI Column with grouped styling.
 */
import React from 'react';
import { type ViewStyle } from 'react-native';
import { Column } from '@expo/ui';
import { useAppTheme } from '@/context/ThemeContext';

type GlassIntensity = 'light' | 'medium' | 'heavy';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: GlassIntensity;
  glowAccent?: boolean;
  borderRadius?: number;
  style?: ViewStyle;
  animated?: boolean;
  animationDelay?: number;
  blur?: boolean;
  padding?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  glowAccent = false,
  borderRadius = 12,
  style,
  padding = 16,
}) => {
  const { colors, isDark } = useAppTheme();
  const bgColor =
    intensity === 'light'
      ? colors.glassBgLight
      : intensity === 'heavy'
        ? colors.glassBgHeavy
        : colors.glassBgMedium;

  return (
    <Column
      spacing={8}
      style={{
        padding,
        borderRadius,
        borderWidth: 1,
        borderColor: glowAccent ? colors.tealBorder : colors.glassBorderMedium,
        backgroundColor: isDark ? bgColor : colors.bgCard,
        ...style,
      }}>
      {children}
    </Column>
  );
};

export default GlassCard;
