/**
 * GlassCard — Reusable glassmorphism card component
 *
 * Provides a frosted-glass surface with translucent background,
 * subtle border glow, and optional shadow. Automatically adapts
 * to the device's light/dark mode via useAppTheme().
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────
type GlassIntensity = 'light' | 'medium' | 'heavy';

interface GlassCardProps {
  /** Content to render inside the card */
  children: React.ReactNode;
  /** Glass blur intensity — controls background + border opacity */
  intensity?: GlassIntensity;
  /** Optional teal accent glow on the border */
  glowAccent?: boolean;
  /** Border radius override (default 20) */
  borderRadius?: number;
  /** Extra style overrides */
  style?: ViewStyle;
  /** If true, apply entrance fade-in animation */
  animated?: boolean;
  /** Delay (ms) for entrance animation */
  animationDelay?: number;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  glowAccent = false,
  borderRadius = 22,
  style,
  animated = false,
  animationDelay = 0,
}) => {
  const { colors } = useAppTheme();
  const opacity = React.useRef(new Animated.Value(animated ? 0 : 1)).current;
  const translateY = React.useRef(new Animated.Value(animated ? 18 : 0)).current;

  React.useEffect(() => {
    if (!animated) return;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }, animationDelay);
    return () => clearTimeout(timer);
  }, [animated, animationDelay]);

  // Pick intensity-based colours from theme
  const bgColor =
    intensity === 'light'
      ? colors.glassBgLight
      : intensity === 'heavy'
        ? colors.glassBgHeavy
        : colors.glassBgMedium;

  const borderColor = glowAccent
    ? colors.tealGlow
    : intensity === 'light'
      ? colors.glassBorderLight
      : intensity === 'heavy'
        ? colors.glassBorderHeavy
        : colors.glassBorderMedium;

  const cardStyle: ViewStyle = {
    backgroundColor: bgColor,
    borderRadius: 22,
    borderWidth: 1,
    borderColor,
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
    padding: 20,
    overflow: 'hidden',
  };

  const highlightStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
    borderRadius,
  };

  if (animated) {
    return (
      <Animated.View
        style={[
          cardStyle,
          { opacity, transform: [{ translateY }] },
          style,
        ]}
      >
        <View style={highlightStyle} />
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      <View style={highlightStyle} />
      {children}
    </View>
  );
};

export default GlassCard;
