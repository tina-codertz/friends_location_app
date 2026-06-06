import React, { useCallback, useState } from 'react';
import { View, Alert, StyleSheet, ActivityIndicator, Linking, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Row } from '@expo/ui';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { saveDevicePushToken } from '@/connekta-firebase/firestore/devices';
import {
  getPushPermissionStatus,
  pushUnavailableReason,
  registerForPushNotificationsAsync,
} from '@/services/push-notifications';
import { isPushRuntimeAvailable } from '@/utils/push-runtime';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Font } from '@/constants/typography';

export default function NotificationSettingsScreen() {
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('unknown');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const permission = await getPushPermissionStatus();
      setStatus(permission);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const onEnable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await registerForPushNotificationsAsync();
      if (!result.token) {
        Alert.alert(
          'Notifications off',
          result.reason ?? 'Could not enable push notifications.',
          Platform.OS === 'ios'
            ? [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Settings', onPress: () => void Linking.openSettings() },
              ]
            : [{ text: 'OK' }],
        );
        await refresh();
        return;
      }
      if (user?.uid) {
        let deviceId = await SecureStore.getItemAsync('device_id');
        if (!deviceId) deviceId = await AsyncStorage.getItem('device_id');
        if (deviceId) {
          await saveDevicePushToken(user.uid, deviceId, result.token, result.platform);
        }
      }
      await refresh();
      Alert.alert('Notifications on', 'You will receive circle and safety alerts.');
    } finally {
      setBusy(false);
    }
  }, [user?.uid, refresh]);

  const statusLabel =
    status === 'granted' ? 'Enabled' : status === 'denied' ? 'Blocked in system settings' : 'Not enabled yet';

  const statusDetail =
    status === 'granted'
      ? 'Push token is registered for this device.'
      : 'Allow notifications to hear when friends interact with your circle.';

  return (
    <NativeScreen scroll contentStyle={{ gap: 16, paddingBottom: 40 }}>
      <NativeTypography variant="hero" color={colors.textPrimary}>
        Notifications
      </NativeTypography>
      <NativeTypography variant="body" color={colors.textMuted}>
        Get alerts for circle requests, acceptances, and sharing updates.
      </NativeTypography>

      {loading ? (
        <GlassCard borderRadius={16} intensity="light" style={{ padding: 24, alignItems: 'center' }}>
          <ActivityIndicator color={accent.cyan} />
        </GlassCard>
      ) : (
        <GlassCard borderRadius={16} intensity="medium" style={{ marginBottom: 16, padding: 14 }}>
          <Row spacing={12} alignment="center">
            <Ionicons
              name={status === 'granted' ? 'notifications' : 'notifications-off'}
              size={24}
              color={status === 'granted' ? accent.green : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <NativeTypography
                variant="body"
                color={colors.textPrimary}
                textStyle={{ fontFamily: Font.semibold }}>
                {statusLabel}
              </NativeTypography>
              <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginTop: 4 }}>
                {statusDetail}
              </NativeTypography>
            </View>
          </Row>
          {status !== 'granted' && isPushRuntimeAvailable() && (
            <GlassButton
              title={busy ? 'Enabling…' : 'Enable notifications'}
              onPress={() => void onEnable()}
              variant="primary"
              fullWidth
              style={{ marginTop: 14 }}
              disabled={busy}
            />
          )}
        </GlassCard>
      )}

      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: `${accent.cyan}11`,
            borderColor: `${accent.cyan}44`,
          },
        ]}>
        <Ionicons name="information-circle" size={20} color={accent.cyan} style={{ marginRight: 10 }} />
        <View style={{ flex: 1 }}>
          <NativeTypography variant="caption" color={colors.textMuted}>
            {pushUnavailableReason() ??
              'Remote alerts require a development or production build. SOS and place alerts will use this same channel in later phases.'}
          </NativeTypography>
        </View>
      </View>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
