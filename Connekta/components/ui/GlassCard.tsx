/**
 * GlassCard — Neumorphism-inspired glass surface with blur + soft depth.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, Animated, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
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
  /** Disable blur (e.g. web fallback) */
  blur?: boolean;
}

const BLUR_INTENSITY = { light: 28, medium: 40, heavy: 52 } as const;

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  intensity = 'medium',
  glowAccent = false,
  borderRadius = 22,
  style,
  animated = false,
  animationDelay = 0,
  blur = true,
}) => {
  const { colors, isDark } = useAppTheme();
  const opacity = React.useRef(new Animated.Value(animated ? 0 : 1)).current;
  const translateY = React.useRef(new Animated.Value(animated ? 14 : 0)).current;

  React.useEffect(() => {
    if (!animated) return;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 480, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, tension: 52, friction: 11, useNativeDriver: true }),
      ]).start();
    }, animationDelay);
    return () => clearTimeout(timer);
  }, [animated, animationDelay, opacity, translateY]);

  const bgColor =
    intensity === 'light'
      ? colors.glassBgLight
      : intensity === 'heavy'
        ? colors.glassBgHeavy
        : colors.glassBgMedium;

  const borderColor = glowAccent
    ? colors.tealBorder
    : intensity === 'light'
      ? colors.glassBorderLight
      : intensity === 'heavy'
        ? colors.glassBorderHeavy
        : colors.glassBorderMedium;

  const shell: ViewStyle = {
    borderRadius,
    borderWidth: 1,
    borderColor,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' || !blur ? bgColor : 'transparent',
    shadowColor: colors.glassShadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: isDark ? 0.35 : 0.12,
    shadowRadius: 24,
    elevation: 12,
    padding: 20,
  };

  const innerGlow = (
    <>
      <View
        pointerEvents="none"
        style={[styles.topHighlight, { backgroundColor: colors.glassHighlight, borderTopLeftRadius: borderRadius, borderTopRightRadius: borderRadius }]}
      />
      <View
        pointerEvents="none"
        style={[styles.outerGlow, { borderRadius, borderColor: glowAccent ? colors.tealGlow : 'rgba(255,255,255,0.06)' }]}
      />
    </>
  );

  const body = (
    <View style={[shell, style]}>
      {blur && Platform.OS !== 'web' ? (
        <BlurView
          intensity={BLUR_INTENSITY[intensity]}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: bgColor, opacity: blur && Platform.OS !== 'web' ? 0.72 : 1 }]} />
      {innerGlow}
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (animated) {
    return (
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        {body}
      </Animated.View>
    );
  }

  return body;
};

const styles = StyleSheet.create({
  content: { zIndex: 1 },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 2,
  },
  outerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    zIndex: 0,
  },
});

export default GlassCard;
