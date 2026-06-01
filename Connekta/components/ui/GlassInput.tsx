/**
 * GlassInput — Transparent field with optional stacked or floating label.
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
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { Font } from '@/constants/typography';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
  showSecureToggle?: boolean;
  containerStyle?: ViewStyle;
  icon?: React.ReactNode;
  /** stacked = label above field (auth); floating = label inside field */
  layout?: 'floating' | 'stacked';
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
  layout = 'floating',
  ...rest
}) => {
  const { colors, accent } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const borderAnim = useRef(new Animated.Value(0)).current;
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const stacked = layout === 'stacked';
  const floated = stacked || focused || Boolean(value && String(value).length > 0);

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [focused, borderAnim]);

  useEffect(() => {
    if (stacked) return;
    Animated.timing(labelAnim, {
      toValue: floated ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [floated, labelAnim, stacked]);

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
      {stacked && label ? (
        <Text style={[styles.stackedLabel, { color: colors.textSecondary, fontFamily: Font.medium }]}>
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          styles.inputWrap,
          {
            borderColor,
            backgroundColor: error ? colors.errorBg : focused ? colors.inputBgFocus : colors.inputBg,
            shadowColor: focused ? accent.cyan : colors.glassShadow,
            shadowOpacity: focused ? 0.25 : 0.12,
            shadowRadius: focused ? 14 : 8,
            shadowOffset: { width: 0, height: 6 },
            elevation: focused ? 6 : 3,
          },
        ]}
      >
        <View style={[styles.innerHighlight, { backgroundColor: colors.glassHighlight }]} />

        {!stacked && label ? (
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.floatingLabel,
              {
                color: focused ? accent.cyan : colors.textMuted,
                fontFamily: Font.medium,
                left: icon ? 44 : 16,
                transform: [{ translateY: labelTranslate }, { scale: labelScale }],
              },
            ]}
          >
            {label}
          </Animated.Text>
        ) : null}

        {icon ? <View style={styles.iconWrap}>{icon}</View> : null}

        <TextInput
          {...rest}
          value={value}
          placeholder={stacked || floated ? placeholder : undefined}
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
              paddingTop: stacked ? 14 : label ? 22 : 14,
              paddingLeft: icon ? 0 : undefined,
            },
            rest.style,
          ]}
          placeholderTextColor={colors.inputPlaceholder}
          selectionColor={accent.cyan}
        />

        {showSecureToggle ? (
          <TouchableOpacity onPress={() => setHidden(!hidden)} style={styles.toggleBtn} hitSlop={12}>
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {error ? (
        <Text style={[styles.errorText, { color: accent.sos, fontFamily: Font.medium }]}>{error}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  stackedLabel: {
    fontSize: 13,
    marginBottom: 8,
    marginLeft: 2,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
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
    top: 8,
    fontSize: 12,
    letterSpacing: 0.4,
    zIndex: 2,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingBottom: 14,
    paddingRight: 4,
  },
  toggleBtn: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: { fontSize: 12, marginTop: 8, marginLeft: 4 },
});

export default GlassInput;
