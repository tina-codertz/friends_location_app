import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { firebaseAuthErrorMessage } from '@/connekta-firebase';
import { validateUsername } from '@/utils/username';
import { Font } from '@/constants/typography';

export default function ProfileScreen() {
  const { colors, accent } = useAppTheme();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');

  useEffect(() => {
    if (!isEditing) {
      setEditUsername(user?.username || '');
    }
  }, [user?.username, isEditing]);

  const handleSave = async () => {
    const check = validateUsername(editUsername);
    if (!check.ok) {
      Alert.alert('Invalid username', check.message);
      return;
    }

    if (check.value === user?.username) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await updateProfile(check.value);
      Alert.alert('Profile updated', 'Your username has been saved.');
      setIsEditing(false);
    } catch (err: unknown) {
      Alert.alert('Could not update profile', firebaseAuthErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const avatarLetter = (editUsername ?? '?').slice(0, 1).toUpperCase();

  return (
    <NativeScreen scroll contentStyle={{ gap: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <NativeTypography variant="hero" color={colors.textPrimary}>
          Profile
        </NativeTypography>
        <GlassButton
          title={isEditing ? 'Cancel' : 'Edit profile'}
          onPress={() => {
            if (isEditing) {
              setEditUsername(user?.username || '');
            }
            setIsEditing(!isEditing);
          }}
          variant="glass"
          size="small"
          icon={
            <Ionicons name={isEditing ? 'close' : 'pencil'} size={16} color={accent.cyan} />
          }
        />
      </View>

      <GlassCard borderRadius={16} intensity="heavy" glowAccent style={{ paddingVertical: 28, alignItems: 'center' }}>
        <View style={[styles.avatar, { borderColor: colors.tealBorder }]}>
          <NativeTypography variant="hero" color={colors.textPrimary} textStyle={{ fontFamily: Font.bold }}>
            {avatarLetter}
          </NativeTypography>
        </View>
        {isEditing ? (
          <TextInput
            value={editUsername}
            onChangeText={setEditUsername}
            placeholder="Username"
            placeholderTextColor={colors.inputPlaceholder}
            style={[
              styles.usernameInput,
              {
                color: colors.textPrimary,
                borderColor: colors.inputBorder,
                backgroundColor: colors.inputBg,
                fontFamily: Font.semibold,
              },
            ]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : (
          <NativeTypography
            variant="title"
            color={colors.textPrimary}
            textStyle={{ marginTop: 16 }}>
            {user?.username ?? '—'}
          </NativeTypography>
        )}
        <NativeTypography variant="body" color={colors.textMuted} textStyle={{ marginTop: 6 }}>
          {user?.email ?? '—'}
        </NativeTypography>
      </GlassCard>

      <GlassCard borderRadius={16} intensity="medium">
        <ProfileDetailRow label="Account" value="Active" colors={colors} />
        <ProfileDetailRow
          label="User ID"
          value={user?.uid ? `${user.uid.slice(0, 8)}…` : '—'}
          colors={colors}
          muted
        />
      </GlassCard>

      {isEditing && (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <GlassButton
              title={saving ? 'Saving…' : 'Save'}
              onPress={handleSave}
              variant="primary"
              fullWidth
              disabled={saving}
            />
          </View>
          <View style={{ flex: 1 }}>
            <GlassButton
              title="Cancel"
              onPress={() => {
                setEditUsername(user?.username || '');
                setIsEditing(false);
              }}
              variant="tonal"
              fullWidth
            />
          </View>
        </View>
      )}
    </NativeScreen>
  );
}

function ProfileDetailRow({
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
      <NativeTypography variant="caption" color={colors.textMuted}>
        {label}
      </NativeTypography>
      <NativeTypography
        variant="body"
        color={muted ? colors.textMuted : colors.textPrimary}
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
  usernameInput: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    textAlign: 'center',
    minWidth: 200,
  },
});
