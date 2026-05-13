/**
 * GlassCard — Reusable glassmorphism card component
 *
 * Provides a frosted-glass surface with translucent background,
 * subtle border glow, and optional shadow. Designed for the
 * deep-navy (#07111f) theme used across the app.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');

// ─── Theme tokens ────────────────────────────────────────────────────────────
const GLASS = {
  bgLight: 'rgba(255,255,255,0.06)',
  bgMedium: 'rgba(255,255,255,0.10)',
  bgHeavy: 'rgba(255,255,255,0.14)',
  borderLight: 'rgba(255,255,255,0.10)',
  borderMedium: 'rgba(255,255,255,0.18)',
  borderHeavy: 'rgba(255,255,255,0.25)',
  shadowColor: 'rgba(0,0,0,0.40)',
  tealGlow: 'rgba(45,212,191,0.12)',
};

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
  borderRadius = 20,
  style,
  animated = false,
  animationDelay = 0,
}) => {
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

  // Pick intensity-based colours
  const bgColor =
    intensity === 'light'
      ? GLASS.bgLight
      : intensity === 'heavy'
        ? GLASS.bgHeavy
        : GLASS.bgMedium;

  const borderColor = glowAccent
    ? GLASS.tealGlow
    : intensity === 'light'
      ? GLASS.borderLight
      : intensity === 'heavy'
        ? GLASS.borderHeavy
        : GLASS.borderMedium;

  const cardStyle: ViewStyle = {
    backgroundColor: bgColor,
    borderRadius,
    borderWidth: 1,
    borderColor,
    // Shadow
    shadowColor: GLASS.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    // Padding
    padding: 20,
    overflow: 'hidden',
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
        {/* Inner highlight line */}
        <View style={[styles.innerHighlight, { borderRadius }]} />
        {children}
      </Animated.View>
    );
  }

  return (
    <View style={[cardStyle, style]}>
      <View style={[styles.innerHighlight, { borderRadius }]} />
      {children}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
});

export default GlassCard;
