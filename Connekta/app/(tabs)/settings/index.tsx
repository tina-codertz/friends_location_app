import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Font, Type } from '@/constants/typography';

const BIO_KEY = 'biometric_unlock_enabled';

export default function SettingsHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, accent } = useAppTheme();
  const { logout, user } = useAuth();
  const [bio, setBio] = useState(false);

  useEffect(() => {
    void (async () => {
      const v = await SecureStore.getItemAsync(BIO_KEY);
      setBio(v === '1');
    })();
  }, []);

  const toggleBio = async (value: boolean) => {
    if (value) {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!has || !enrolled) {
        Alert.alert('Unavailable', 'Biometrics are not set up on this device.');
        return;
      }
      const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Enable biometric unlock' });
      if (!r.success) return;
      await SecureStore.setItemAsync(BIO_KEY, '1');
      setBio(true);
    } else {
      await SecureStore.deleteItemAsync(BIO_KEY);
      setBio(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 20,
        paddingHorizontal: 20,
        paddingBottom: insets.bottom + 120,
        gap: 16,
      }}
    >
      <Text style={[Type.hero, { color: colors.textPrimary }]}>Profile</Text>
      <Text style={[Type.body, { color: colors.textMuted }]}>Manage your account, security, and preferences.</Text>

      <TouchableOpacity onPress={() => router.push('/(tabs)/settings/profile')} activeOpacity={0.85}>
        <GlassCard borderRadius={22} intensity="medium" glowAccent style={{ paddingVertical: 18 }}>
          <Text style={[Type.section, { color: colors.textPrimary }]}>Profile</Text>
          <Text style={[Type.caption, { color: colors.textMuted, marginTop: 6 }]}>View account details</Text>
        </GlassCard>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(tabs)/settings/CircleManagement')} activeOpacity={0.85}>
        <GlassCard borderRadius={22} intensity="medium" style={{ paddingVertical: 18 }}>
          <Text style={[Type.section, { color: colors.textPrimary }]}>Circle management</Text>
          <Text style={[Type.caption, { color: colors.textMuted, marginTop: 6 }]}>Invite codes, share link, join with code</Text>
        </GlassCard>
      </TouchableOpacity>

  
      <GlassCard borderRadius={22} intensity="medium" style={{ paddingVertical: 16 }}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>Biometric lock</Text>
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
              Require Face ID / Touch ID when opening the app.
            </Text>
          </View>
          <Switch
            value={bio}
            onValueChange={toggleBio}
            trackColor={{ false: colors.divider, true: `${accent.electricBlue}88` }}
            thumbColor={bio ? accent.electricBlue : colors.textTertiary}
          />
        </View>
      </GlassCard>

      <GlassCard borderRadius={22} intensity="light" style={{ paddingVertical: 16 }}>
        <Text style={[Type.caption, { color: colors.textMuted }]}>Session</Text>
        <Text style={[Type.body, { color: colors.textPrimary, marginTop: 8, fontFamily: Font.medium }]}>
          {user?.username}
        </Text>
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
                  router.replace('/(landing)');
                },
              },
            ]);
          }}
          variant="outline"
          fullWidth
        />
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
