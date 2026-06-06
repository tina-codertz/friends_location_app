/**
 * Native button — Expo UI (@expo/ui) with Connekta variant names preserved.
 */
import React from 'react';
import { View, type ViewStyle, type TextStyle } from 'react-native';
import { Button, Row, Text } from '@expo/ui';
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

export const GlassButton: React.FC<GlassButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
}) => {
  const { accent } = useAppTheme();
  const label = loading ? 'Loading…' : title;
  const expoVariant = mapVariant(variant);
  const tint =
    variant === 'danger' ? accent.sos : variant === 'chipActive' ? accent.cyanDeep : undefined;

  const button = icon ? (
    <Button variant={expoVariant} onPress={onPress} disabled={disabled || loading}>
      <Row spacing={6} alignment="center">
        {icon}
        <Text textStyle={{ fontWeight: '600', color: expoVariant === 'filled' ? '#fff' : undefined }}>
          {label}
        </Text>
      </Row>
    </Button>
  ) : (
    <Button
      variant={expoVariant}
      label={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={tint ? { backgroundColor: tint } : undefined}
    />
  );

  return <View style={[fullWidth && { width: '100%' }, style]}>{button}</View>;
};

export default GlassButton;
