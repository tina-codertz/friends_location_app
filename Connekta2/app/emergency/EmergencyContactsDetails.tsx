import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { Font } from '@/constants/typography';
import { emergencyAPI } from '@/services/api';

export default function EmergencyContactsDetails() {
  const router = useRouter();
  const { colors } = useAppTheme();
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
          } catch {
            Alert.alert('Error', 'Failed to delete contact.');
          }
        },
      },
    ]);
  };

  const avatarLetter = (name ?? '?').slice(0, 1).toUpperCase();

  return (
    <NativeScreen scroll contentStyle={{ gap: 16, paddingBottom: 40 }}>
      <GlassCard borderRadius={16} intensity="heavy" glowAccent style={{ paddingVertical: 28, alignItems: 'center' }}>
        <View style={[styles.avatar, { borderColor: colors.tealBorder }]}>
          <NativeTypography variant="hero" color={colors.textPrimary} textStyle={{ fontFamily: Font.bold }}>
            {avatarLetter}
          </NativeTypography>
        </View>
        <NativeTypography variant="title" color={colors.textPrimary} textStyle={{ marginTop: 16 }}>
          {name ?? '—'}
        </NativeTypography>
        <NativeTypography variant="body" color={colors.textMuted} textStyle={{ marginTop: 6 }}>
          {phone ?? '—'}
        </NativeTypography>
      </GlassCard>

      <GlassCard borderRadius={16} intensity="medium">
        <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ marginBottom: 12 }}>
          Contact Information
        </NativeTypography>
        <ContactDetailRow label="Name" value={name ?? '—'} colors={colors} />
        <ContactDetailRow label="Phone" value={phone ?? '—'} colors={colors} />
      </GlassCard>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <GlassButton title="Close" onPress={() => router.back()} variant="tonal" fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <GlassButton title="Delete" onPress={handleDelete} variant="danger" fullWidth />
        </View>
      </View>
    </NativeScreen>
  );
}

function ContactDetailRow({
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
      <NativeTypography variant="caption" color={colors.textMuted}>
        {label}
      </NativeTypography>
      <NativeTypography
        variant="body"
        color={colors.textPrimary}
        textStyle={{ marginTop: 4, fontFamily: Font.medium }}>
        {value}
      </NativeTypography>
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
