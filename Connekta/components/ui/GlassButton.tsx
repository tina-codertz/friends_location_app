/**
 * GlassButton — Reusable glassmorphism button component
 *
 * Frosted-glass button with scale animation on press,
 * multiple colour variants, and size presets. Automatically
 * adapts to light/dark mode via useAppTheme().
 */

import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';

// ─── Types ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface GlassButtonProps {
  /** Button label */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Colour variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Disable interaction */
  disabled?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Full-width mode */
  fullWidth?: boolean;
  /** Optional icon element rendered before the label */
  icon?: React.ReactNode;
  /** Extra container style */
  style?: ViewStyle;
  /** Extra text style */
  textStyle?: TextStyle;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}) => {
  const { colors, accent } = useAppTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 120,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // Variant-based styles (from theme)
  const variantStyles: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: accent.electricBlue,
      borderWidth: 0,
    },
    secondary: {
      backgroundColor: colors.tealGlass,
      borderWidth: 1,
      borderColor: colors.tealBorder,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.glassBorderMedium,
    },
    ghost: {
      backgroundColor: colors.glassBgLight,
      borderWidth: 1,
      borderColor: colors.glassBorderMedium,
    },
  };

  const variantTextStyles: Record<ButtonVariant, TextStyle> = {
    primary: { color: '#FFFFFF', fontWeight: '700' },
    secondary: { color: accent.electricBlue, fontWeight: '700' },
    outline: { color: colors.textPrimary, fontWeight: '600' },
    ghost: { color: colors.textPrimary, fontWeight: '600' },
  };

  // Size-based styles
  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    small: { paddingVertical: 10, paddingHorizontal: 18 },
    medium: { paddingVertical: 14, paddingHorizontal: 28 },
    large: { paddingVertical: 18, paddingHorizontal: 36 },
  };

  const sizeTextStyles: Record<ButtonSize, TextStyle> = {
    small: { fontSize: 13 },
    medium: { fontSize: 15 },
    large: { fontSize: 17 },
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth && { width: '100%' },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          styles.base,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && { width: '100%' },
          (disabled || loading) && styles.disabled,
          style,
        ]}
      >
        {/* Inner top highlight */}
        {variant !== 'primary' && (
          <View style={[styles.innerHighlight, { backgroundColor: colors.glassHighlight }]} />
        )}

        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text
            style={[
              styles.text,
              variantTextStyles[variant],
              sizeTextStyles[size],
              textStyle,
            ]}
          >
            {loading ? 'Loading…' : title}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconWrap: {
    marginRight: 4,
  },
  text: {
    letterSpacing: 0.4,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default GlassButton;
