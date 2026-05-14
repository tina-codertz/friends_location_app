import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Font, Type } from '@/constants/typography';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const { user } = useAuth();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 12, paddingBottom: 40 }}
    >
      <GlassCard borderRadius={24} intensity="heavy" glowAccent style={{ paddingVertical: 28, alignItems: 'center' }}>
        <View style={[styles.avatar, { borderColor: colors.tealBorder }]}>
          <Text style={{ fontSize: 36, color: colors.textPrimary, fontFamily: Font.bold }}>
            {(user?.username ?? '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={[Type.title, { color: colors.textPrimary, marginTop: 16 }]}>{user?.username}</Text>
        <Text style={[Type.body, { color: colors.textMuted, marginTop: 6 }]}>{user?.email}</Text>
      </GlassCard>

      <View style={{ height: 20 }} />

      <GlassCard borderRadius={22} intensity="medium">
        <Row label="User ID" value={String(user?.id ?? '—')} colors={colors} />
        <Row label="Verified" value={user?.verified ? 'Yes' : 'No'} colors={colors} />
        <Row label="Device" value={user?.device_id ? 'Linked' : '—'} colors={colors} muted />
      </GlassCard>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  colors,
  muted,
}: {
  label: string;
  value: string;
  colors: any;
  muted?: boolean;
}) {
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.divider }}>
      <Text style={[Type.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text
        style={[
          Type.body,
          { color: muted ? colors.textMuted : colors.textPrimary, marginTop: 4, fontFamily: Font.medium },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
