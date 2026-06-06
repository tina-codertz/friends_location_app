/**
 * Native button — Expo UI label buttons inside Host; RN pressable when an icon is present.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { Button } from '@expo/ui';
import { Font } from '@/constants/typography';
import { useAppTheme } from '@/context/ThemeContext';

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

function mapVariant(variant: ButtonVariant): 'filled' | 'outlined' | 'text' {
  if (variant === 'primary' || variant === 'danger' || variant === 'chipActive') return 'filled';
  if (variant === 'outline' || variant === 'secondary' || variant === 'tonal' || variant === 'glass') {
    return 'outlined';
  }
  return 'text';
}

function rnButtonStyle(variant: ButtonVariant, colors: ReturnType<typeof useAppTheme>['colors'], accent: ReturnType<typeof useAppTheme>['accent']) {
  switch (variant) {
    case 'primary':
      return { backgroundColor: accent.cyanDeep, borderColor: accent.cyanDeep, textColor: '#fff' };
    case 'danger':
      return { backgroundColor: accent.sos, borderColor: accent.sos, textColor: '#fff' };
    case 'chipActive':
      return { backgroundColor: accent.cyanDeep, borderColor: accent.cyan, textColor: '#fff' };
    case 'chip':
      return { backgroundColor: colors.surface, borderColor: colors.glassBorderLight, textColor: colors.textMuted };
    case 'tonal':
    case 'glass':
    case 'outline':
    case 'secondary':
      return { backgroundColor: colors.tealGlass, borderColor: colors.tealBorder, textColor: colors.textPrimary };
    default:
      return { backgroundColor: 'transparent', borderColor: 'transparent', textColor: colors.textPrimary };
  }
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
  const { accent, colors } = useAppTheme();
  const label = loading ? 'Loading…' : title;
  const expoVariant = mapVariant(variant);
  const tint =
    variant === 'danger' ? accent.sos : variant === 'chipActive' ? accent.cyanDeep : undefined;

  if (icon) {
    const look = rnButtonStyle(variant, colors, accent);
    const padV = size === 'small' ? 8 : size === 'large' ? 16 : 12;
    const padH = size === 'small' ? 12 : size === 'large' ? 20 : 16;
    return (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.rnBtn,
          {
            paddingVertical: padV,
            paddingHorizontal: padH,
            backgroundColor: look.backgroundColor,
            borderColor: look.borderColor,
            opacity: disabled || loading ? 0.5 : pressed ? 0.88 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
        ]}>
        <View style={styles.rnRow}>
          {icon}
          <Text
            style={[
              styles.rnLabel,
              { color: look.textColor, fontFamily: Font.semibold },
              textStyle,
            ]}>
            {label}
          </Text>
        </View>
      </Pressable>
    );
  }

  const button = (
    <Button
      variant={expoVariant}
      label={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={tint ? { backgroundColor: tint } : undefined}
    />
  );

  return <View style={[fullWidth && styles.fullWidth, style]}>{button}</View>;
};

const styles = StyleSheet.create({
  fullWidth: { width: '100%' },
  rnBtn: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rnLabel: {
    fontSize: 15,
  },
});

export default GlassButton;
