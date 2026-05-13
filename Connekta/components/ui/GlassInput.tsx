/**
 * GlassInput — Reusable glassmorphism text input component
 *
 * Frosted-glass input field with animated focus glow,
 * optional label, error state, and secure-text visibility toggle.
 * Designed for Connekta's deep-navy (#07111f) theme.
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

// ─── Theme tokens ────────────────────────────────────────────────────────────
const C = {
  accent: '#2dd4bf',
  whiteHigh: 'rgba(255,255,255,0.92)',
  whiteMid: 'rgba(255,255,255,0.50)',
  whiteLow: 'rgba(255,255,255,0.25)',
  glassBg: 'rgba(255,255,255,0.06)',
  glassBgFocus: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassBorderFocus: 'rgba(45,212,191,0.45)',
  errorBorder: 'rgba(248,113,113,0.6)',
  errorBg: 'rgba(248,113,113,0.08)',
  errorText: '#f87171',
};

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
    ? C.errorBorder
    : borderAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [C.glassBorder, C.glassBorderFocus],
      });

  const backgroundColor = error
    ? C.errorBg
    : focused
      ? C.glassBgFocus
      : C.glassBg;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

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
        <View style={styles.innerHighlight} />

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
          style={[styles.input, rest.style]}
          placeholderTextColor={C.whiteMid}
          selectionColor={C.accent}
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

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    color: C.whiteLow,
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
    // Shadow
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
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.whiteHigh,
    paddingVertical: 14,
  },
  toggleBtn: {
    paddingLeft: 10,
  },
  toggleText: {
    fontSize: 18,
  },
  errorText: {
    color: C.errorText,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
});

export default GlassInput;
