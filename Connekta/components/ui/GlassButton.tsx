/**
 * GlassButton — Floating glass / gradient button with press scale.
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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';
import { Font } from '@/constants/typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
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
    Animated.spring(scale, { toValue: 0.96, tension: 140, friction: 9, useNativeDriver: true }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, { toValue: 1, tension: 140, friction: 9, useNativeDriver: true }).start();
  };

  const sizeStyles: Record<ButtonSize, ViewStyle> = {
    small: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 18 },
    medium: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 20 },
    large: { paddingVertical: 18, paddingHorizontal: 36, borderRadius: 22 },
  };

  const sizeText: Record<ButtonSize, number> = { small: 13, medium: 15, large: 17 };

  const isPrimary = variant === 'primary';

  const shellStyle: ViewStyle = {
    ...sizeStyles[size],
    overflow: 'hidden',
    borderWidth: variant === 'outline' ? 1.5 : variant === 'secondary' || variant === 'ghost' ? 1 : 0,
    borderColor:
      variant === 'outline'
        ? colors.glassBorderMedium
        : variant === 'secondary'
          ? colors.tealBorder
          : colors.glassBorderLight,
    backgroundColor:
      variant === 'secondary'
        ? colors.tealGlass
        : variant === 'ghost'
          ? colors.glassBgLight
          : variant === 'outline'
            ? 'transparent'
            : 'transparent',
    shadowColor: isPrimary ? accent.electricBlue : '#000',
    shadowOffset: { width: 0, height: isPrimary ? 8 : 4 },
    shadowOpacity: isPrimary ? 0.35 : 0.2,
    shadowRadius: isPrimary ? 16 : 10,
    elevation: isPrimary ? 10 : 5,
    ...(fullWidth ? { width: '100%' } : {}),
    ...(disabled || loading ? { opacity: 0.45 } : {}),
  };

  const labelColor =
    variant === 'primary'
      ? '#FFFFFF'
      : variant === 'secondary'
        ? accent.electricBlue
        : colors.textPrimary;

  const content = (
    <View style={[styles.content, sizeStyles[size], { paddingVertical: undefined, paddingHorizontal: undefined }]}>
      {icon && <View style={styles.iconWrap}>{icon}</View>}
      <Text
        style={[
          styles.text,
          { color: labelColor, fontSize: sizeText[size], fontFamily: Font.semibold },
          textStyle,
        ]}
      >
        {loading ? 'Loading…' : title}
      </Text>
    </View>
  );

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { width: '100%' }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled || loading}
        activeOpacity={0.92}
        style={[shellStyle, style]}
      >
        {isPrimary ? (
          <LinearGradient
            colors={[accent.electricBlue, accent.electricBlueDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {variant !== 'primary' && (
          <View style={[styles.innerHighlight, { backgroundColor: colors.glassHighlight }]} />
        )}
        {content}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  iconWrap: { marginRight: 2 },
  text: { letterSpacing: 0.35 },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});

export default GlassButton;
