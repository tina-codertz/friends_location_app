import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
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

/** Stitch-style tappable glass row card */
export function GlassNavCard({ title, subtitle, onPress, icon, glow, style }: Props) {
  const { colors, accent } = useAppTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <GlassCard
        borderRadius={16}
        intensity="medium"
        glowAccent={glow}
        padding={16}
        style={style}
      >
        <View style={styles.row}>
          {icon ? (
            <View style={[styles.iconBox, { backgroundColor: `${accent.cyan}18` }]}>
              <Ionicons name={icon} size={22} color={accent.cyan} />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Text style={[Type.section, { color: colors.textPrimary, fontSize: 17 }]}>{title}</Text>
            {subtitle ? (
              <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4, fontFamily: Font.regular }]}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
