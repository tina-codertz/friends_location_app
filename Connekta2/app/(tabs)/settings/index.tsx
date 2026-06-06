import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Host, Switch, Row } from '@expo/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassNavCard } from '@/components/ui/GlassNavCard';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Font } from '@/constants/typography';
import {
  deviceSupportsBiometric,
  disableBiometricUnlock,
  enableBiometricUnlock,
  getBiometricPolicy,
} from '@/services/biometric-unlock';
import { verifyCurrentUserPassword } from '@/connekta-firebase';

export default function SettingsHomeScreen() {
  const router = useRouter();
  const { colors, accent } = useAppTheme();
  const { logout, user } = useAuth();
  const [bio, setBio] = useState(false);
  const [passwordModal, setPasswordModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const refreshBio = useCallback(async () => {
    const policy = await getBiometricPolicy();
    setBio(policy.hasStoredCredentials);
  }, []);

  useEffect(() => {
    void refreshBio();
  }, [refreshBio]);

  const finishEnable = async (password: string) => {
    const email = user?.email;
    if (!email) {
      Alert.alert('Error', 'No email on your account. Sign in again with email and password.');
      return;
    }

    const valid = await verifyCurrentUserPassword(password);
    if (!valid) {
      Alert.alert('Incorrect password', 'Check your password and try again.');
      return;
    }

    const result = await enableBiometricUnlock(email, password, 'Enable biometric sign-in');
    if (result.ok) {
      setBio(true);
      setPasswordModal(false);
      setConfirmPassword('');
      return;
    }

    if (result.reason === 'unavailable') {
      Alert.alert('Unavailable', 'Biometrics are not set up on this device.');
    } else if (result.reason === 'cancelled') {
      /* user dismissed */
    } else {
      Alert.alert('Error', 'Could not save biometric sign-in. Try again.');
    }
  };

  const toggleBio = async (value: boolean) => {
    if (value) {
      if (!(await deviceSupportsBiometric())) {
        Alert.alert('Unavailable', 'Biometrics are not set up on this device.');
        return;
      }
      setPasswordModal(true);
      return;
    }

    await disableBiometricUnlock();
    setBio(false);
  };

  const onConfirmPassword = async () => {
    if (confirmPassword.length < 6) {
      Alert.alert('Password', 'Enter your account password (at least 6 characters).');
      return;
    }
    await finishEnable(confirmPassword);
  };

  return (
    <NativeScreen scroll contentStyle={{ gap: 16, paddingBottom: 120 }}>
      <NativeTypography variant="hero" color={colors.textPrimary}>
        Profile
      </NativeTypography>
      <NativeTypography variant="body" color={colors.textMuted}>
        Manage your account, security, and preferences.
      </NativeTypography>

      <GlassNavCard
        title="Profile"
        subtitle="View account details"
        icon="person-circle-outline"
        glow
        onPress={() => router.push('/(tabs)/settings/profile')}
      />

      <GlassNavCard
        title="Circle management"
        subtitle="Invite codes, share link, join with code"
        icon="people-outline"
        onPress={() => router.push('/(tabs)/settings/CircleManagement')}
      />

      <GlassNavCard
        title="Notifications"
        subtitle="Circle requests, sharing updates, and alerts"
        icon="notifications-outline"
        onPress={() => router.push('/(tabs)/settings/NotificationSettings')}
      />

      <GlassNavCard
        title="Location privacy"
        subtitle="Exact, approximate, or paused sharing"
        icon="shield-checkmark-outline"
        onPress={() => router.push('/(tabs)/settings/LocationPrivacy')}
      />

      <GlassNavCard
        title="Location history"
        subtitle="View your route trail and recent pings"
        icon="time-outline"
        onPress={() => router.push('/(tabs)/settings/LocationHistory')}
      />

      <GlassCard borderRadius={16} intensity="medium">
        <Row spacing={12} alignment="center">
          <View style={{ flex: 1 }}>
            <NativeTypography
              variant="body"
              color={colors.textPrimary}
              textStyle={{ fontFamily: Font.semibold }}>
              Biometric sign-in
            </NativeTypography>
          </View>
          <Switch value={bio} onValueChange={(v) => void toggleBio(v)} />
        </Row>
      </GlassCard>

      <GlassCard borderRadius={16} intensity="light">
        <NativeTypography variant="caption" color={colors.textMuted}>
          Session
        </NativeTypography>
        <NativeTypography
          variant="body"
          color={colors.textPrimary}
          textStyle={{ marginTop: 8, fontFamily: Font.medium }}>
          {user?.username ?? '—'}
        </NativeTypography>
        <View style={{ height: 16 }} />
        <GlassButton
          title="Sign out"
          onPress={() => {
            Alert.alert('Sign out', 'End this session?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: async () => {
                  await logout();
                  router.replace('/auth/AuthScreen');
                },
              },
            ]);
          }}
          variant="tonal"
          fullWidth
        />
      </GlassCard>

      <Modal visible={passwordModal} transparent animationType="fade" onRequestClose={() => setPasswordModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalBackdrop, { backgroundColor: colors.overlay }]}>
          <Host matchContents>
            <GlassCard borderRadius={20} intensity="heavy" glowAccent style={styles.modalCard}>
              <NativeTypography variant="section" color={colors.textPrimary} textStyle={{ marginBottom: 8 }}>
                Confirm password
              </NativeTypography>
              <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginBottom: 16 }}>
                Enter your password once to enable biometric sign-in after inactivity.
              </NativeTypography>
              <GlassInput
                layout="stacked"
                label="Password"
                placeholder="Your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                showSecureToggle
              />
              <GlassButton title="Enable" onPress={() => void onConfirmPassword()} variant="primary" fullWidth />
              <View style={{ height: 10 }} />
              <GlassButton
                title="Cancel"
                onPress={() => {
                  setPasswordModal(false);
                  setConfirmPassword('');
                }}
                variant="tonal"
                fullWidth
              />
            </GlassCard>
          </Host>
        </KeyboardAvoidingView>
      </Modal>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 24 },
  modalCard: { padding: 20 },
});
