/**
 * Reusable Form Input Component
 */

import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text } from 'react-native';
import { LANDING_PAGE_COLORS } from '@/constants/animations';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: any;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  containerStyle,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        {...props}
        style={[styles.input, error && styles.inputError, props.style]}
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: LANDING_PAGE_COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: LANDING_PAGE_COLORS.text,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 6,
  },
});
