import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Share,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { locationAPI } from '@/services/api';
import {
  formatSharingSummary,
  getSharingPermissionStatus,
  needsAlwaysPermission,
  permissionStatusHint,
  permissionStatusLabel,
  showBackgroundPermissionRequiredAlert,
  startLiveSharing,
  stopLiveSharing,
  type LocationPermissionStatus,
} from '@/services/location-sharing';
import { Font, Type } from '@/constants/typography';

const SHARE_DURATIONS = [
  { label: '30m', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '4h', minutes: 240 },
  { label: '8h', minutes: 480 },
  { label: 'Until off', minutes: null },
];

export default function ShareLocationScreen() {
  const insets = useSafeAreaInsets();
  const { colors, accent } = useAppTheme();
  const { user } = useAuth();
  const [liveSharing, setLiveSharing] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(60);
  const [shareUntil, setShareUntil] = useState<string | null>(null);
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus | null>(null);

  const refreshScreenState = useCallback(async () => {
    try {
      const [s, perms] = await Promise.all([locationAPI.myState(), getSharingPermissionStatus()]);
      setPermissionStatus(perms);
      if (s.success) {
        setLiveSharing(!!s.sharing);
        setShareUntil(s.share_until);
        if (typeof s.lat === 'number' && typeof s.lng === 'number') {
          setCurrentLat(s.lat);
          setCurrentLng(s.lng);
        }
      }
    } catch {
      /* offline */
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refreshScreenState();
    }, [refreshScreenState]),
  );

  const handleShareLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setCurrentLat(location.coords.latitude);
      setCurrentLng(location.coords.longitude);

      const mapsUrl = `https://maps.google.com/maps?q=${location.coords.latitude},${location.coords.longitude}`;
      const message = `${user?.username} is sharing their location: ${mapsUrl}`;

      await Share.share({ message, title: 'Share Location' });
    } catch {
      Alert.alert('Error', 'Could not get your location. Check permissions.');
    }
  }, [user]);

  const onStartLiveSharing = useCallback(async () => {
    setBusy(true);
    try {
      const result = await startLiveSharing({
        durationMinutes: selectedDuration,
        explainAlways: true,
      });
      setPermissionStatus(result.permissionStatus);
      if (result.cancelled || !result.success) return;

      setLiveSharing(true);
      setShareUntil(result.shareUntilIso ?? null);
      const s = await locationAPI.myState();
      if (s.success && typeof s.lat === 'number' && typeof s.lng === 'number') {
        setCurrentLat(s.lat);
        setCurrentLng(s.lng);
      }
    } catch {
      Alert.alert('Error', 'Could not start live sharing. Check location permissions and try again.');
    } finally {
      setBusy(false);
    }
  }, [selectedDuration]);

  const onStopLiveSharing = useCallback(async () => {
    setBusy(true);
    try {
      const stopped = await stopLiveSharing();
      if (!stopped) return;
      setLiveSharing(false);
      setShareUntil(null);
    } finally {
      setBusy(false);
    }
  }, []);

  const sharingSummary = formatSharingSummary(liveSharing, shareUntil);
  const showAlwaysSettingsCta =
    permissionStatus != null && needsAlwaysPermission(permissionStatus);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 40,
      }}
    >
      <Text style={[Type.hero, { color: colors.textPrimary, marginBottom: 8 }]}>Share Location</Text>
      <Text style={[Type.body, { color: colors.textMuted, marginBottom: 20 }]}>
        Share your location with trusted contacts — even when the app is closed.
      </Text>

      {permissionStatus && (
        <GlassCard borderRadius={16} intensity="light" style={{ marginBottom: 16 }}>
          <View style={styles.row}>
            <Ionicons
              name={
                permissionStatus.background === 'granted'
                  ? 'shield-checkmark'
                  : permissionStatus.foreground === 'granted'
                    ? 'location'
                    : 'location-outline'
              }
              size={22}
              color={permissionStatus.background === 'granted' ? accent.green : accent.electricBlue}
            />
            <View style={{ flex: 1 }}>
              <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
                {permissionStatusLabel(permissionStatus)}
              </Text>
              <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
                {permissionStatusHint(permissionStatus)}
              </Text>
            </View>
          </View>
          {showAlwaysSettingsCta && (
            <GlassButton
              title="Open Settings — choose Always"
              onPress={() => showBackgroundPermissionRequiredAlert(permissionStatus)}
              variant="secondary"
              fullWidth
              style={{ marginTop: 12 }}
            />
          )}
        </GlassCard>
      )}

      <GlassCard borderRadius={16} intensity="medium" style={{ marginBottom: 16 }}>
        <View style={[styles.row, { marginBottom: 14 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[Type.body, { color: colors.textPrimary, fontFamily: Font.semibold }]}>
              Live Location Sharing
            </Text>
            <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
              {sharingSummary}
            </Text>
          </View>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: liveSharing ? accent.electricBlue : colors.textTertiary },
            ]}
          />
        </View>

        {!liveSharing && (
          <View style={styles.durationGrid}>
            {SHARE_DURATIONS.map((option) => {
              const selected = selectedDuration === option.minutes;
              return (
                <TouchableOpacity
                  key={option.label}
                  onPress={() => setSelectedDuration(option.minutes)}
                  activeOpacity={0.8}
                  style={[
                    styles.durationButton,
                    {
                      borderColor: selected ? accent.electricBlue : colors.divider,
                      backgroundColor: selected ? `${accent.electricBlue}22` : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      Type.caption,
                      {
                        color: selected ? colors.textPrimary : colors.textMuted,
                        fontFamily: selected ? Font.semibold : Font.regular,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <GlassButton
          title={liveSharing ? (busy ? 'Stopping...' : 'Stop Live Sharing') : busy ? 'Starting...' : 'Start Live Sharing'}
          onPress={liveSharing ? onStopLiveSharing : onStartLiveSharing}
          variant={liveSharing ? 'secondary' : 'primary'}
          disabled={busy}
          fullWidth
        />
      </GlassCard>

      {currentLat && currentLng && (
        <GlassCard borderRadius={16} intensity="medium" style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Ionicons name="location" size={24} color={accent.electricBlue} />
            <Text style={[Type.section, { color: colors.textPrimary }]}>Last shared position</Text>
          </View>
          <Text style={[Type.caption, { color: colors.textMuted }]}>
            Latitude: {currentLat.toFixed(6)}
          </Text>
          <Text style={[Type.caption, { color: colors.textMuted, marginTop: 4 }]}>
            Longitude: {currentLng.toFixed(6)}
          </Text>
        </GlassCard>
      )}

      <GlassButton
        title="Share My Location Now"
        onPress={handleShareLocation}
        variant="primary"
        fullWidth
      />

      <View
        style={[
          styles.infoBox,
          {
            backgroundColor: `${accent.electricBlue}11`,
            borderColor: `${accent.electricBlue}44`,
            marginTop: 20,
          },
        ]}
      >
        <Ionicons name="information-circle" size={20} color={accent.electricBlue} style={{ marginRight: 10 }} />
        <Text style={[Type.caption, { color: colors.textMuted, flex: 1 }]}>
          Live sharing runs in the background and stops when the timer expires or you turn it off. A notification stays visible while sharing is active.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  durationButton: {
    minWidth: 72,
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
});
