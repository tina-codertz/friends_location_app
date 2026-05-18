/**
 * GlassInput — Transparent field with floating label and focus glow.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { Font } from '@/constants/typography';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
  showSecureToggle?: boolean;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  showSecureToggle = false,
  containerStyle,
  icon,
  secureTextEntry,
  value,
  placeholder,
  ...rest
}) => {
  const { colors, accent } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const floated = focused || Boolean(value && String(value).length > 0);

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [focused, borderAnim]);

  useEffect(() => {
    Animated.timing(labelAnim, {
      toValue: floated ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [floated, labelAnim]);

  const borderColor = error
    ? colors.errorBorder
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.inputBorder, colors.inputBorderFocus],
      });

  const labelTranslate = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const labelScale = labelAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.82],
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.inputWrap,
          {
            borderColor,
            backgroundColor: error ? colors.errorBg : focused ? colors.inputBgFocus : colors.inputBg,
            shadowColor: focused ? accent.electricBlue : colors.glassShadow,
            shadowOpacity: focused ? 0.25 : 0.12,
            shadowRadius: focused ? 14 : 8,
            shadowOffset: { width: 0, height: 6 },
            elevation: focused ? 6 : 3,
          },
        ]}
      >
        <View style={[styles.innerHighlight, { backgroundColor: colors.glassHighlight }]} />

        {label ? (
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.floatingLabel,
              {
                color: focused ? accent.electricBlue : colors.textMuted,
                fontFamily: Font.medium,
                transform: [{ translateY: labelTranslate }, { scale: labelScale }],
              },
            ]}
          >
            {label}
          </Animated.Text>
        ) : null}

        {icon && <View style={styles.iconWrap}>{icon}</View>}

        <TextInput
          {...rest}
          value={value}
          placeholder={floated ? placeholder : undefined}
          secureTextEntry={showSecureToggle ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: Font.regular,
              paddingTop: label ? 22 : 14,
            },
            rest.style,
          ]}
          placeholderTextColor={colors.inputPlaceholder}
          selectionColor={accent.electricBlue}
        />

        {showSecureToggle && (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.toggleBtn} hitSlop={12}>
            <Text style={styles.toggleText}>{hidden ? '👁' : '🙈'}</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {error ? (
        <Text style={[styles.errorText, { color: accent.coral, fontFamily: Font.medium }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    overflow: 'hidden',
    minHeight: 56,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  floatingLabel: {
    position: 'absolute',
    left: 16,
    top: 8,
    fontSize: 12,
    letterSpacing: 0.4,
    zIndex: 2,
  },
  iconWrap: { marginRight: 10, marginTop: 8 },
  input: {
    flex: 1,
    fontSize: 17,
    paddingBottom: 12,
    paddingRight: 8,
  },
  toggleBtn: { paddingLeft: 8, paddingTop: 8 },
  toggleText: { fontSize: 18 },
  errorText: { fontSize: 12, marginTop: 8, marginLeft: 4 },
});

export default GlassInput;
