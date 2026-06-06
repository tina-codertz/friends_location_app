/**
 * Native text field — Expo UI TextInput with controlled state bridge.
 */
import React, { useEffect } from 'react';
import { View, type ViewStyle, type TextInputProps } from 'react-native';
import { Column, Text, TextInput, Button, useNativeState } from '@expo/ui';
import { useAppTheme } from '@/context/ThemeContext';

interface GlassInputProps extends Omit<TextInputProps, 'style' | 'value' | 'onChangeText'> {
  label?: string;
  error?: string;
  showSecureToggle?: boolean;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
  layout?: 'floating' | 'stacked';
  style?: TextInputProps['style'];
  value?: string;
  onChangeText?: (text: string) => void;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  showSecureToggle = false,
  containerStyle,
  layout = 'floating',
  secureTextEntry,
  placeholder,
  value = '',
  onChangeText,
  autoCapitalize,
  autoCorrect,
  keyboardType,
  editable,
  multiline,
}) => {
  const { colors } = useAppTheme();
  const textState = useNativeState(value);
  const [hidden, setHidden] = React.useState(secureTextEntry ?? false);
  const stacked = layout === 'stacked';
  const fieldPlaceholder = stacked ? placeholder : label || placeholder;

  useEffect(() => {
    if (value !== textState.value) {
      textState.value = value;
    }
  }, [value, textState]);

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      <Column spacing={6}>
        {stacked && label ? (
          <Text textStyle={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>{label}</Text>
        ) : null}
        <TextInput
          value={textState}
          onChangeText={onChangeText}
          placeholder={fieldPlaceholder}
          secureTextEntry={showSecureToggle ? hidden : secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
        />
        {showSecureToggle ? (
          <Button
            variant="text"
            label={hidden ? 'Show password' : 'Hide password'}
            onPress={() => setHidden((v) => !v)}
          />
        ) : null}
        {error ? <Text textStyle={{ fontSize: 12, color: '#ef4444' }}>{error}</Text> : null}
      </Column>
    </View>
  );
};

export default GlassInput;
