import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { Radius } from '@/constants/ui';

type Props = {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: string;
  style?: ViewStyle;
  danger?: boolean;
};

export function GlassIconButton({ name, onPress, size = 20, color, style, danger }: Props) {
  const { colors, accent } = useAppTheme();
  const tint = color ?? (danger ? accent.sos : accent.cyan);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      hitSlop={10}
      style={[
        styles.btn,
        {
          backgroundColor: danger ? `${accent.sos}18` : colors.glassBgMedium,
          borderColor: danger ? `${accent.sos}44` : colors.glassBorderLight,
        },
        style,
      ]}
    >
      <Ionicons name={name} size={size} color={tint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
