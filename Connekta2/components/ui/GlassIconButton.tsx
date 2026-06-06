import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { Button } from '@expo/ui';
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

export function GlassIconButton({ name, onPress, size = 20, color, style, danger }: Props) {
  const { accent } = useAppTheme();
  const tint = color ?? (danger ? accent.sos : accent.cyan);

  return (
    <View style={style}>
      <Button variant="outlined" onPress={onPress}>
        <Ionicons name={name} size={size} color={tint} />
      </Button>
    </View>
  );
}
