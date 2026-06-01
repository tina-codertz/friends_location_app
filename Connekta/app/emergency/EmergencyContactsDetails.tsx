import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';
import { emergencyAPI } from '@/services/api';

export default function EmergencyContactsDetails() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { id, name, phone } = useLocalSearchParams<{ id: string; name: string; phone: string }>();

  const handleDelete = async () => {
    Alert.alert('Delete Contact', `Are you sure you want to delete ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (id) {
              await emergencyAPI.remove(id);
              Alert.alert('Success', 'Contact deleted.');
              router.back();
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to delete contact.');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <GlassCard borderRadius={24} intensity="heavy" glowAccent style={{ paddingVertical: 28, alignItems: 'center' }}>
        <View style={[styles.avatar, { borderColor: colors.tealBorder }]}>
          <Text style={{ fontSize: 36, color: colors.textPrimary, fontFamily: Font.bold }}>
            {(name ?? '?').slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={[Type.title, { color: colors.textPrimary, marginTop: 16 }]}>{name}</Text>
        <Text style={[Type.body, { color: colors.textMuted, marginTop: 6 }]}>{phone}</Text>
      </GlassCard>

      <View style={{ height: 20 }} />

      <GlassCard borderRadius={22} intensity="medium">
        <Text style={[Type.section, { color: colors.textPrimary, marginBottom: 12 }]}>Contact Information</Text>
        <Row label="Name" value={name ?? '—'} colors={colors} />
        <Row label="Phone" value={phone ?? '—'} colors={colors} />
      </GlassCard>

      <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
        <View style={{ flex: 1 }}>
          <GlassButton
            title="Close"
            onPress={() => router.back()}
            variant="secondary"
            fullWidth
          />
        </View>
        <View style={{ flex: 1 }}>
          <GlassButton
            title="Delete"
            onPress={handleDelete}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={{ paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.divider }}>
      <Text style={[Type.caption, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[Type.body, { color: colors.textPrimary, marginTop: 4, fontFamily: Font.medium }]}>
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