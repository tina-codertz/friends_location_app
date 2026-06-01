import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { Type } from '@/constants/typography';
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

  if (needsEnroll === null) {
    return <View style={[styles.fill, { backgroundColor: colors.bg }]} />;
  }

  if (!needsEnroll) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg, padding: 24 }]}>
      <View style={styles.centered}>
        <GlassCard intensity="medium" borderRadius={24} glowAccent style={styles.card}>
          <View style={[styles.iconRing, { borderColor: accent.cyan }]}>
            <Ionicons
              name={Platform.OS === 'ios' ? 'scan-outline' : 'finger-print-outline'}
              size={36}
              color={accent.cyan}
            />
          </View>
          <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 12, textAlign: 'center' }]}>
            Quick sign-in
          </Text>
          <Text style={[Type.body, { color: colors.textMuted, marginBottom: 24, textAlign: 'center' }]}>
            After 10 minutes away, sign back in with {Platform.OS === 'ios' ? 'Face ID or Touch ID' : 'your fingerprint'}{' '}
            instead of typing your password.
          </Text>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center' },
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
