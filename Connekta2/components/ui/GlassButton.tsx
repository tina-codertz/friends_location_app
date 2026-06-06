/**
 * GlassButton — calm, accessible button variants for safety flows.
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
import { Font } from '@/constants/typography';
import { Radius } from '@/constants/ui';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tonal'
  | 'outline'
  | 'ghost'
  | 'glass'
  | 'danger'
  | 'chip'
  | 'chipActive';

type ButtonSize = 'small' | 'medium' | 'large';

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

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
    Animated.spring(scale, { toValue: 0.94, tension: 200, friction: 12, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, tension: 200, friction: 12, useNativeDriver: true }).start();
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    small: { paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 },
    medium: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 44 },
    large: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 52 },
  };

  const sizeText: Record<ButtonSize, number> = { small: 12, medium: 14, large: 16 };

  const isChip = variant === 'chip' || variant === 'chipActive';
  const isGlassPill = variant === 'glass';

  const borderRadius = isGlassPill ? Radius.pill : isChip ? Radius.sm : Radius.md;

  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: accent.cyan,
          borderWidth: 0,
          shadowColor: accent.cyanDeep,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.16,
          shadowRadius: 10,
          elevation: 3,
        };
      case 'danger':
        return {
          backgroundColor: accent.sos,
          borderWidth: 0,
          shadowColor: accent.sos,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 10,
          elevation: 3,
        };
      case 'chipActive':
        return {
          backgroundColor: accent.cyanDeep,
          borderWidth: 0,
          shadowColor: accent.cyanDeep,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.14,
          shadowRadius: 8,
          elevation: 2,
        };
      case 'chip':
        return {
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.divider,
        };
      case 'secondary':
      case 'tonal':
        return {
          backgroundColor: colors.bgCard,
          borderWidth: 1,
          borderColor: colors.glassBorderLight,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.tealBorder,
        };
      case 'ghost':
        return {
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderWidth: 1,
          borderColor: colors.glassBorderLight,
        };
      case 'glass':
        return {
          backgroundColor: colors.glassBgMedium,
          borderWidth: 1,
          borderColor: colors.glassBorderMedium,
        };
      default:
        return {};
    }
  })();

  const labelColor = (() => {
    switch (variant) {
      case 'primary':
        return '#FFFFFF';
      case 'chipActive':
        return '#FFFFFF';
      case 'danger':
        return '#FFFFFF';
      case 'chip':
        return colors.textMuted;
      case 'secondary':
      case 'tonal':
        return accent.cyan;
      case 'outline':
      case 'glass':
        return accent.cyan;
      case 'ghost':
        return colors.textSecondary;
      default:
        return colors.textPrimary;
    }
  })();

  const fontFamily =
    variant === 'chip' || variant === 'chipActive' ? Font.semibold : Font.semibold;

  const letterSpacing = 0;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        activeOpacity={0.88}
        style={[
          sizeStyles[size],
          variantStyle,
          {
            borderRadius,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: disabled || loading ? 0.45 : 1,
          },
          fullWidth && { width: '100%' },
        ]}
      >
        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
        <Text
          style={[
            styles.text,
            {
              color: labelColor,
              fontSize: sizeText[size],
              fontFamily,
              letterSpacing,
              textTransform: isChip ? 'uppercase' : 'none',
            },
            textStyle,
          ]}
        >
          {loading ? 'Loading…' : title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconWrap: { marginRight: -2 },
  text: { textAlign: 'center' },
});

export default GlassButton;
