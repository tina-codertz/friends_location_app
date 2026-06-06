/**
 * Card surface — RN View so it is safe inside FlatList rows and ExpoUIRegion islands.
 * Expo UI layout primitives crash when mounted outside a Host ancestor.
 */
import React from 'react';
import { View, type ViewStyle } from 'react-native';
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
    <View
      style={{
        padding,
        borderRadius,
        borderWidth: 1,
        borderColor: glowAccent ? colors.tealBorder : colors.glassBorderMedium,
        backgroundColor: isDark ? bgColor : colors.bgCard,
        gap: 8,
        ...style,
      }}>
      {children}
    </View>
  );
};

export default GlassCard;
