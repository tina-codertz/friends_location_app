import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AppState,
  type AppStateStatus,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { Font, Type } from '@/constants/typography';

const BIO_ENABLED_KEY = 'biometric_unlock_enabled';
const NEEDS_ENROLL_KEY = 'needs_biometric_enrollment';

type Props = {
  children: React.ReactNode;
};

export function BiometricGate({ children }: Props) {
  const { colors, accent } = useAppTheme();
  const [gate, setGate] = useState<'loading' | 'unlocked' | 'locked' | 'enroll'>('loading');
  const appState = useRef(AppState.currentState);

  const refreshPolicy = useCallback(async () => {
    const [enabled, needs] = await Promise.all([
      SecureStore.getItemAsync(BIO_ENABLED_KEY),
      SecureStore.getItemAsync(NEEDS_ENROLL_KEY),
    ]);
    return { enabled: enabled === '1', needsEnrollment: needs === '1' };
  }, []);

  const runUnlock = useCallback(async () => {
    const { enabled, needsEnrollment } = await refreshPolicy();
    if (needsEnrollment) {
      setGate('enroll');
      return;
    }
    if (!enabled) {
      setGate('unlocked');
      return;
    }
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!has || !enrolled) {
      setGate('unlocked');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Connekta',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    setGate(result.success ? 'unlocked' : 'locked');
  }, [refreshPolicy]);

  useEffect(() => {
    runUnlock();
  }, [runUnlock]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        void (async () => {
          const { enabled, needsEnrollment } = await refreshPolicy();
          if (needsEnrollment) {
            setGate('enroll');
            return;
          }
          if (enabled) {
            setGate('loading');
            await runUnlock();
          }
        })();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [refreshPolicy, runUnlock]);

  const completeEnrollment = async () => {
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!has || !enrolled) {
      await SecureStore.deleteItemAsync(NEEDS_ENROLL_KEY);
      setGate('unlocked');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enable biometric unlock',
      cancelLabel: 'Cancel',
    });
    if (!result.success) return;
    await SecureStore.setItemAsync(BIO_ENABLED_KEY, '1');
    await SecureStore.deleteItemAsync(NEEDS_ENROLL_KEY);
    setGate('unlocked');
  };

  const skipEnrollment = async () => {
    await SecureStore.deleteItemAsync(NEEDS_ENROLL_KEY);
    setGate('unlocked');
  };

  if (gate === 'unlocked') {
    return <>{children}</>;
  }

  if (gate === 'loading') {
    return <View style={[styles.fill, { backgroundColor: colors.bg }]} />;
  }

  if (gate === 'enroll') {
    return (
      <View style={[styles.fill, { backgroundColor: colors.bg, padding: 24 }]}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <GlassCard intensity="medium" borderRadius={24} glowAccent style={{ paddingVertical: 28 }}>
            <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 12 }]}>
              Secure your account
            </Text>
            <Text style={[Type.body, { color: colors.textMuted, marginBottom: 24 }]}>
              Use {Platform.OS === 'ios' ? 'Face ID or Touch ID' : 'your fingerprint'} to unlock Connekta. Your
              session stays in the secure keychain.
            </Text>
            <GlassButton title="Enable biometrics" onPress={completeEnrollment} variant="primary" fullWidth size="large" />
            <View style={{ height: 12 }} />
            <GlassButton title="Not now" onPress={skipEnrollment} variant="ghost" fullWidth size="medium" />
          </GlassCard>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg, padding: 24 }]}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <GlassCard intensity="medium" borderRadius={24} style={{ paddingVertical: 28 }}>
          <Text style={[Type.title, { color: colors.textPrimary, marginBottom: 8 }]}>Locked</Text>
          <Text style={[Type.body, { color: colors.textMuted, marginBottom: 24 }]}>
            Biometric unlock is on. Authenticate to continue.
          </Text>
          <GlassButton
            title="Unlock"
            onPress={runUnlock}
            variant="primary"
            fullWidth
            size="large"
          />
          <View style={{ height: 12 }} />
          <GlassButton
            title="Turn off in Settings"
            onPress={async () => {
              await SecureStore.deleteItemAsync(BIO_ENABLED_KEY);
              setGate('unlocked');
            }}
            variant="ghost"
            fullWidth
            size="medium"
            textStyle={{ color: accent.coral }}
          />
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
