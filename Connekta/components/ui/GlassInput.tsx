/**
 * GlassInput — Reusable glassmorphism text input component
 *
 * Frosted-glass input field with animated focus glow,
 * optional label, error state, and secure-text toggle.
 * Automatically adapts to light/dark mode via useAppTheme().
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

// ─── Types ───────────────────────────────────────────────────────────────────
interface GlassInputProps extends TextInputProps {
  /** Label above the input */
  label?: string;
  /** Error message (also changes border colour) */
  error?: string;
  /** If true, shows a toggle to reveal/hide password */
  showSecureToggle?: boolean;
  /** Extra container style */
  containerStyle?: ViewStyle;
  /** Optional left icon element */
  icon?: React.ReactNode;
}

// ─── Component ───────────────────────────────────────────────────────────────
export const GlassInput: React.FC<GlassInputProps> = ({
  label,
  error,
  showSecureToggle = false,
  containerStyle,
  icon,
  secureTextEntry,
  ...rest
}) => {
  const { colors, accent } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = error
    ? colors.errorBorder
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.inputBorder, colors.inputBorderFocus],
      });

  const backgroundColor = error
    ? colors.errorBg
    : focused
      ? colors.inputBgFocus
      : colors.inputBg;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textTertiary }]}>
          {label}
        </Text>
      )}

      <Animated.View
        style={[
          styles.inputWrap,
          {
            borderColor,
            backgroundColor,
          },
        ]}
      >
        {/* Inner highlight */}
        <View style={[styles.innerHighlight, { backgroundColor: colors.glassHighlight }]} />

        {icon && <View style={styles.iconWrap}>{icon}</View>}

        <TextInput
          {...rest}
          secureTextEntry={showSecureToggle ? hidden : secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          style={[styles.input, { color: colors.textPrimary }, rest.style]}
          placeholderTextColor={colors.inputPlaceholder}
          selectionColor={accent.teal}
        />

        {showSecureToggle && (
          <TouchableOpacity
            onPress={() => setHidden(!hidden)}
            style={styles.toggleBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.toggleText}>
              {hidden ? '👁' : '🙈'}
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {error && (
        <Text style={[styles.errorText, { color: accent.error }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  iconWrap: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  toggleBtn: {
    paddingLeft: 10,
  },
  toggleText: {
    fontSize: 18,
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default GlassInput;
