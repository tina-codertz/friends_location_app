import { useCallback, useState } from 'react';
import { Alert, Linking, Platform, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import { Host, Column, Text, Switch, Button } from '@expo/ui';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/context/AuthContext';
import { saveDevicePushToken } from '@/connekta-firebase/firestore/devices';
import {
  getPushPermissionStatus,
  registerForPushNotificationsAsync,
} from '@/services/push-notifications';

type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'loading';

export default function NotificationSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [status, setStatus] = useState<PermissionStatus>('loading');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setStatus('loading');
    const permission = await getPushPermissionStatus();
    setStatus(permission);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const isGranted = status === 'granted';

  const onEnable = useCallback(async () => {
    if (!Device.isDevice) {
      Alert.alert('Simulator', 'Push notifications need a real device.');
      return;
    }
    setBusy(true);
    try {
      const result = await registerForPushNotificationsAsync();
      if (!result.token) {
        Alert.alert('Notifications off', result.reason ?? 'Could not enable push notifications.');
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
      Alert.alert('Notifications on', 'Push token saved to Firebase.');
    } finally {
      setBusy(false);
    }
  }, [user?.uid, refresh]);

  const onToggle = useCallback(
    async (next: boolean) => {
      if (!next) {
        Alert.alert(
          'Turn off in Settings',
          'To disable notifications, open your device Settings app.',
          Platform.OS === 'ios'
            ? [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => void Linking.openSettings() },
              ]
            : [{ text: 'OK' }],
        );
        return;
      }
      await onEnable();
    },
    [onEnable],
  );

  const statusLabel =
    status === 'granted'
      ? 'Enabled'
      : status === 'denied'
        ? 'Blocked in system settings'
        : status === 'loading'
          ? 'Checking…'
          : 'Not enabled yet';

  return (
    <View style={[styles.shell, { paddingTop: insets.top }]}>
      <Host style={{ flex: 1 }}>
        <Column spacing={16} style={{ padding: 20 }}>
          <Text textStyle={{ fontSize: 28, fontWeight: '700' }}>Notifications</Text>
          <Text textStyle={{ fontSize: 15, color: '#666' }}>
            Get alerts for circle requests, acceptances, and sharing updates.
          </Text>

          {status === 'loading' ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : (
            <>
              <Switch
                label="Push notifications"
                value={isGranted}
                onValueChange={onToggle}
                disabled={busy}
              />

              <Text textStyle={{ fontSize: 14, color: '#888' }}>{statusLabel}</Text>

              {!isGranted && (
                <Button
                  variant="filled"
                  label={busy ? 'Enabling…' : 'Enable notifications'}
                  onPress={() => void onEnable()}
                  disabled={busy}
                />
              )}
            </>
          )}
        </Column>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#fff' },
});
