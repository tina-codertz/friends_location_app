import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
  danger?: boolean;
};

/** RN pressable — Expo UI Button cannot host Ionicons (SwiftUI mount crash). */
export function GlassIconButton({ name, onPress, size = 20, color, style, danger }: Props) {
  const { accent, colors } = useAppTheme();
  const tint = color ?? (danger ? accent.sos : accent.cyan);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          borderColor: colors.glassBorderMedium,
          backgroundColor: colors.glassBgHeavy,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Ionicons name={name} size={size} color={tint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
