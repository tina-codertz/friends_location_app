/**
 * Native text field — Expo UI TextInput.
 */
import React, { useState } from 'react';
import { View, type ViewStyle, type TextInputProps } from 'react-native';
import { Column, Text, TextInput, Button } from '@expo/ui';
import { useAppTheme } from '@/context/ThemeContext';

interface GlassInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  showSecureToggle?: boolean;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
  layout?: 'floating' | 'stacked';
  style?: TextInputProps['style'];
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  showSecureToggle = false,
  containerStyle,
  layout = 'floating',
  secureTextEntry,
  placeholder,
  ...rest
}) => {
  const { colors } = useAppTheme();
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const stacked = layout === 'stacked';
  const fieldPlaceholder = stacked ? placeholder : label || placeholder;

  return (
    <Column spacing={6} style={[{ marginBottom: 16 }, containerStyle]}>
      {stacked && label ? (
        <Text textStyle={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>{label}</Text>
      ) : null}
      <TextInput
        {...rest}
        placeholder={fieldPlaceholder}
        secureTextEntry={showSecureToggle ? hidden : secureTextEntry}
        onSubmitEditing={rest.onSubmitEditing}
      />
      {showSecureToggle ? (
        <Button
          variant="text"
          label={hidden ? 'Show password' : 'Hide password'}
          onPress={() => setHidden((v) => !v)}
        />
      ) : null}
      {error ? (
        <Text textStyle={{ fontSize: 12, color: colors.error ?? '#ef4444' }}>{error}</Text>
      ) : null}
    </Column>
  );
};

export default GlassInput;
