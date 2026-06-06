import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Alert } from 'react-native';
import { Host } from '@expo/ui';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import {
  consumePendingBiometricCredentials,
  clearPendingBiometricCredentials,
  deviceSupportsBiometric,
  enableBiometricUnlock,
  getBiometricPolicy,
  promptBiometricUnlock,
  skipBiometricEnrollment,
} from '@/services/biometric-unlock';

type Props = {
  children: React.ReactNode;
};

/** Optional one-time enrollment after sign-up / sign-in — not an always-on app lock. */
export function BiometricGate({ children }: Props) {
  const { colors, accent } = useAppTheme();
  const [needsEnroll, setNeedsEnroll] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    const policy = await getBiometricPolicy();
    setNeedsEnroll(policy.needsEnrollment);
  }, []);

  useEffect(() => {
    void refresh().catch(() => setNeedsEnroll(false));
  }, [refresh]);

  const completeEnrollment = async () => {
    if (!(await deviceSupportsBiometric())) {
      Alert.alert(
        'Unavailable',
        'Biometrics are not set up on this device. You can enable them later in Settings.'
      );
      await skipBiometricEnrollment();
      setNeedsEnroll(false);
      return;
    }

    const pending = await consumePendingBiometricCredentials();
    if (pending) {
      const result = await enableBiometricUnlock(
        pending.email,
        pending.password,
        'Enable biometric sign-in'
      );
      if (!result.ok) {
        if (result.reason === 'unavailable') {
          Alert.alert(
            'Unavailable',
            'Biometrics are not set up on this device. You can enable them later in Settings.'
          );
          await skipBiometricEnrollment();
          setNeedsEnroll(false);
        }
        return;
      }
    } else {
      const ok = await promptBiometricUnlock('Enable biometric sign-in');
      if (!ok) return;
      await skipBiometricEnrollment();
    }

    setNeedsEnroll(false);
  };

  const skipEnrollment = async () => {
    await skipBiometricEnrollment();
    setNeedsEnroll(false);
  };

  const bioHint =
    Platform.OS === 'ios'
      ? 'Sign back in faster after you sign out — use Face ID or Touch ID instead of typing your password.'
      : 'Sign back in faster after you sign out — use your fingerprint instead of typing your password.';

  if (needsEnroll === null) {
    return (
      <NativeScreen contentStyle={{ flex: 1 }}>
        <View />
      </NativeScreen>
    );
  }

  if (!needsEnroll) {
    return <>{children}</>;
  }

  return (
    <NativeScreen contentStyle={{ justifyContent: 'center', paddingHorizontal: 24 }}>
      <Host matchContents>
        <GlassCard intensity="medium" borderRadius={24} glowAccent style={styles.card}>
          <View style={[styles.iconRing, { borderColor: accent.cyan }]}>
            <Ionicons
              name={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print-outline'}
              size={36}
              color={accent.cyan}
            />
          </View>
          <NativeTypography
            variant="hero"
            color={colors.textPrimary}
            textStyle={{ marginBottom: 12, textAlign: 'center' }}>
            Quick sign-in
          </NativeTypography>
          <NativeTypography
            variant="body"
            color={colors.textMuted}
            textStyle={{ marginBottom: 24, textAlign: 'center' }}>
            {bioHint}
          </NativeTypography>
          <GlassButton
            title="Enable biometrics"
            onPress={() => void completeEnrollment()}
            variant="primary"
            fullWidth
            size="large"
          />
          <View style={{ height: 12 }} />
          <GlassButton title="Not now" onPress={() => void skipEnrollment()} variant="tonal" fullWidth size="medium" />
        </GlassCard>
      </Host>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 28, paddingHorizontal: 8, alignItems: 'center' },
  iconRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});
