import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';

type Props = {
  title: string;
  subtitle?: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  glow?: boolean;
  style?: ViewStyle;
};

/** RN settings row — avoids embedding Ionicons inside Expo UI SwiftUI views. */
export function GlassNavCard({ title, subtitle, onPress, icon, glow, style }: Props) {
  const { accent, colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: glow ? colors.tealBorder : colors.glassBorderMedium,
          backgroundColor: colors.bgCard,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}>
      <View style={styles.row}>
        {icon ? <Ionicons name={icon} size={22} color={accent.cyan} /> : null}
        <View style={styles.copy}>
          <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>{title}</Text>
          {subtitle ? (
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 2 }]}>{subtitle}</Text>
          ) : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
});
