import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  AppState,
  type AppStateStatus,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { Type } from '@/constants/typography';
import {
  consumePendingBiometricCredentials,
  clearPendingBiometricCredentials,
  deviceSupportsBiometric,
  disableBiometricAppLock,
  enableBiometricAppLockOnly,
  enableBiometricUnlock,
  getBiometricPolicy,
  promptBiometricUnlock,
  skipBiometricEnrollment,
} from '@/services/biometric-unlock';

type Props = {
  children: React.ReactNode;
};

type GateState = 'loading' | 'unlocked' | 'locked' | 'enroll';

export function BiometricGate({ children }: Props) {
  const { colors, accent } = useAppTheme();
  const [gate, setGate] = useState<GateState>('loading');
  const appState = useRef(AppState.currentState);
  const unlockedThisSession = useRef(false);

  const resolveInitialGate = useCallback(async () => {
    const policy = await getBiometricPolicy();

    if (policy.needsEnrollment) {
      setGate('enroll');
      return;
    }

    if (!policy.enabled) {
      setGate('unlocked');
      unlockedThisSession.current = true;
      return;
    }

    if (unlockedThisSession.current) {
      setGate('unlocked');
      return;
    }

    const ok = await promptBiometricUnlock();
    setGate(ok ? 'unlocked' : 'locked');
    if (ok) unlockedThisSession.current = true;
  }, []);

  useEffect(() => {
    void resolveInitialGate().catch(() => setGate('unlocked'));
  }, [resolveInitialGate]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && next === 'active') {
        void (async () => {
          const policy = await getBiometricPolicy();
          if (policy.needsEnrollment) {
            setGate('enroll');
            return;
          }
          if (policy.enabled) {
            unlockedThisSession.current = false;
            setGate('locked');
          }
        })();
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, []);

  const handleUnlock = async () => {
    const ok = await promptBiometricUnlock();
    if (ok) {
      unlockedThisSession.current = true;
      setGate('unlocked');
    }
  };

  const completeEnrollment = async () => {
    if (!(await deviceSupportsBiometric())) {
      await enableBiometricAppLockOnly();
      await clearPendingBiometricCredentials();
      setGate('unlocked');
      unlockedThisSession.current = true;
      return;
    }

    const pending = await consumePendingBiometricCredentials();
    if (pending) {
      const result = await enableBiometricUnlock(
        pending.email,
        pending.password,
        'Enable biometric unlock'
      );
      if (!result.ok) {
        if (result.reason === 'unavailable') {
          Alert.alert(
            'Unavailable',
            'Biometrics are not set up on this device. You can enable them later in Settings.'
          );
          await skipEnrollment();
        }
        return;
      }
    } else {
      const ok = await promptBiometricUnlock('Enable biometric unlock');
      if (!ok) return;
      await enableBiometricAppLockOnly();
    }

    setGate('unlocked');
    unlockedThisSession.current = true;
  };

  const skipEnrollment = async () => {
    await skipBiometricEnrollment();
    setGate('unlocked');
    unlockedThisSession.current = true;
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
              Secure your account
            </Text>
            <Text style={[Type.body, { color: colors.textMuted, marginBottom: 24, textAlign: 'center' }]}>
              Use {Platform.OS === 'ios' ? 'Face ID or Touch ID' : 'your fingerprint'} to unlock Connekta and sign
              in quickly next time.
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

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg, padding: 24 }]}>
      <View style={styles.centered}>
        <GlassCard intensity="medium" borderRadius={24} glowAccent style={styles.card}>
          <View style={[styles.iconRing, { borderColor: accent.cyan }]}>
            <Ionicons name="lock-closed-outline" size={32} color={accent.cyan} />
          </View>
          <Text style={[Type.title, { color: colors.textPrimary, marginBottom: 8, textAlign: 'center' }]}>
            Connekta is locked
          </Text>
          <Text style={[Type.body, { color: colors.textMuted, marginBottom: 24, textAlign: 'center' }]}>
            Use {Platform.OS === 'ios' ? 'Face ID or Touch ID' : 'biometrics'} to continue.
          </Text>
          <GlassButton title="Unlock" onPress={() => void handleUnlock()} variant="primary" fullWidth size="large" />
          <View style={{ height: 12 }} />
          <GlassButton
            title="Turn off biometric lock"
            onPress={() => {
              void (async () => {
                await disableBiometricAppLock();
                unlockedThisSession.current = true;
                setGate('unlocked');
              })();
            }}
            variant="tonal"
            fullWidth
            size="medium"
          />
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
