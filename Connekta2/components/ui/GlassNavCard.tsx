import React from 'react';
import { type ViewStyle } from 'react-native';
import { ListItem } from '@expo/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  glow?: boolean;
  style?: ViewStyle;
};

/** Native settings row — Expo UI ListItem */
export function GlassNavCard({ title, subtitle, onPress, icon }: Props) {
  const { accent, colors } = useAppTheme();

  return (
    <ListItem
      onPress={onPress}
      leading={icon ? <Ionicons name={icon} size={22} color={accent.cyan} /> : undefined}
      trailing={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
      supportingText={subtitle}>
      {title}
    </ListItem>
  );
}
