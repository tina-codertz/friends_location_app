import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { NativeScreen } from '@/components/ui/NativeScreen';
import { NativeTypography } from '@/components/ui/NativeTypography';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import * as Linking from 'expo-linking';
import { emergencyAPI } from '@/services/api';
import { Font } from '@/constants/typography';

export default function SOSScreen() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [triggering, setTriggering] = useState(false);
  const [lastSOS, setLastSOS] = useState<Date | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const triggerSOS = async () => {
    try {
      setTriggering(true);
      scaleAnim.setValue(0.8);
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location required', 'Enable location so your message can include where you are.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      const listRes = await emergencyAPI.list();
      const contacts = listRes.success ? listRes.contacts : [];
      if (contacts.length === 0) {
        Alert.alert('No emergency contacts', 'Add at least one contact under Safety before using SOS.');
        return;
      }

      const mapsUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      const message = `SOS from ${user?.username ?? 'me'} on Connekta. I need help. My location: ${mapsUrl}`;

      const phone = contacts[0].phone.replace(/\D/g, '');
      const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
      const canOpen = await Linking.canOpenURL(smsUrl);
      if (canOpen) {
        await Linking.openURL(smsUrl);
      } else {
        const { Share } = await import('react-native');
        await Share.share({ message });
      }

      setLastSOS(new Date());
      Alert.alert(
        'SOS ready',
        contacts.length > 1
          ? `Opened message to ${contacts[0].name}. Add more contacts in Safety if needed.`
          : `Opened message to ${contacts[0].name} with your live location link.`
      );
    } catch (err) {
      Alert.alert('Error', 'Could not prepare SOS. Check location permission and emergency contacts.');
      console.error('SOS trigger error:', err);
    } finally {
      setTriggering(false);
    }
  };

  const lastSosText = lastSOS ? `Last SOS sent: ${lastSOS.toLocaleTimeString()}` : '';

  return (
    <NativeScreen contentStyle={{ paddingHorizontal: 0 }}>
      <View style={[styles.root, { backgroundColor: colors.bg }]}>
        <View style={[styles.glow, { backgroundColor: accent.sos }]} />

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
          <NativeTypography
            variant="hero"
            color={colors.textPrimary}
            textStyle={{ marginBottom: 24, textAlign: 'center' }}>
            Emergency SOS
          </NativeTypography>

          <GlassCard
            borderRadius={24}
            intensity="medium"
            style={{ marginBottom: 40, borderColor: `${accent.sos}44`, borderWidth: 1 }}>
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="alert-circle" size={48} color={accent.sos} style={{ marginBottom: 12 }} />
              <NativeTypography
                variant="body"
                color={colors.textPrimary}
                textStyle={{ textAlign: 'center', marginBottom: 8 }}>
                Press the button below to send an emergency alert
              </NativeTypography>
              <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ textAlign: 'center' }}>
                Your location will be shared with your accepted emergency contacts
              </NativeTypography>
            </View>
          </GlassCard>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPress={triggerSOS}
              disabled={triggering}
              activeOpacity={0.8}
              style={[
                styles.sosButton,
                { backgroundColor: accent.sos, opacity: triggering ? 0.6 : 1 },
              ]}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }], opacity: 0.3 }]} />
              <Ionicons name="alert" size={60} color="#fff" />
              <NativeTypography variant="section" color="#fff" textStyle={{ marginTop: 12 }}>
                SOS
              </NativeTypography>
            </TouchableOpacity>
          </Animated.View>

          {lastSOS ? (
            <View style={{ marginTop: 40 }}>
              <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ textAlign: 'center' }}>
                {lastSosText}
              </NativeTypography>
            </View>
          ) : null}

          <View
            style={[
              styles.warningBox,
              {
                backgroundColor: `${accent.sos}11`,
                borderColor: `${accent.sos}44`,
                marginTop: 40,
              },
            ]}>
            <Ionicons name="information-circle" size={20} color={accent.sos} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <NativeTypography variant="caption" color={colors.textMuted}>
                Only accepted emergency contacts will receive SOS alerts.
              </NativeTypography>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, alignItems: 'center' }}>
          <NativeTypography variant="caption" color={colors.textMuted} textStyle={{ marginBottom: 4 }}>
            Logged in as
          </NativeTypography>
          <NativeTypography variant="body" color={colors.textPrimary} textStyle={{ fontFamily: Font.semibold }}>
            {user?.username ?? '—'}
          </NativeTypography>
        </View>
      </View>
    </NativeScreen>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  glow: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    width: 300,
    height: 300,
    borderRadius: 300,
    opacity: 0.08,
    marginLeft: -150,
  },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  warningBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
